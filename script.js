import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = window.auth;
const db = window.db;

// ================= AUTH =================
const authBox = document.getElementById("authBox");
const appBox = document.getElementById("appBox");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("login");
const registerBtn = document.getElementById("register");
const logoutBtn = document.getElementById("logout");

let transactions = [];
let investments = [];

// Connexion / Création / Déconnexion
loginBtn.addEventListener("click", async () => {
  try { await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value); }
  catch(e){ alert(e.message); }
});
registerBtn.addEventListener("click", async () => {
  try { await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value); }
  catch(e){ alert(e.message); }
});
logoutBtn.addEventListener("click", () => signOut(auth));

// AuthState
onAuthStateChanged(auth, async user => {
  if(user){
    authBox.style.display="none"; appBox.style.display="block";
    const userDocRef = doc(db,"users",user.uid);
    const userSnap = await getDoc(userDocRef);
    if(userSnap.exists()){
      const data = userSnap.data();
      transactions = data.transactions || [];
      investments = data.investments || [];
    } else {
      await setDoc(userDocRef,{transactions:[],investments:[]});
      transactions = []; investments = [];
    }
    save();
  } else {
    authBox.style.display="block"; appBox.style.display="none";
  }
});

// ================= TABS =================
function showTab(tab){
  document.querySelectorAll(".tab-content").forEach(t => t.style.display="none");
  document.getElementById(`${tab}-tab`).style.display="block";
  document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
}
document.getElementById("tab-transactions").onclick = () => showTab("transactions");
document.getElementById("tab-investments").onclick = () => showTab("investments");
document.getElementById("tab-charts").onclick = () => showTab("charts");

// ================= TRANSACTIONS =================
const transactionForm = document.getElementById("transaction-form");

transactionForm.addEventListener("submit", e => {
  e.preventDefault();
  const newTransaction = {
    name: document.getElementById("name").value,
    amount: +document.getElementById("amount").value,
    type: document.getElementById("type").value,
    category: document.getElementById("category").value,
    date: document.getElementById("date").value,
    currency: document.getElementById("currency").value
  };
  const editIndex = transactionForm.dataset.editIndex;
  if(editIndex !== undefined){
    transactions[editIndex] = newTransaction;
    delete transactionForm.dataset.editIndex;
  } else {
    transactions.push(newTransaction);
  }
  save();
  transactionForm.reset();
});

function renderTransactions() {
  const tbody = document.querySelector("#transaction-table tbody");
  tbody.innerHTML = "";
  transactions.forEach((t, i) => {
    tbody.innerHTML += `<tr>
      <td>${t.name}</td>
      <td>${t.amount}</td>
      <td>${t.type}</td>
      <td>${t.category}</td>
      <td>${t.date}</td>
      <td>${t.currency}</td>
      <td>
        <button onclick="editTransaction(${i})">Éditer</button>
        <button onclick="delT(${i})">X</button>
      </td>
    </tr>`;
  });
}

window.delT = idx => { transactions.splice(idx,1); save(); };

window.editTransaction = idx => {
  const t = transactions[idx];
  document.getElementById("name").value = t.name;
  document.getElementById("amount").value = t.amount;
  document.getElementById("type").value = t.type;
  document.getElementById("category").value = t.category;
  document.getElementById("date").value = t.date;
  document.getElementById("currency").value = t.currency;
  transactionForm.dataset.editIndex = idx;
};

// ================= INVESTMENTS =================
const investmentForm = document.getElementById("investment-form");
const invNameInput = document.getElementById("inv-name");
const invAmountInput = document.getElementById("inv-amount");
const invInterestInput = document.getElementById("inv-interest");
const invDateInput = document.getElementById("inv-date");
const invCurrencyInput = document.getElementById("inv-currency");
const invCategoryInput = document.getElementById("inv-category");

const selectInvestment = document.getElementById("select-investment");
const interestDateInput = document.getElementById("interest-date");
const interestAmountInput = document.getElementById("interest-amount");
const addMonthlyInterestBtn = document.getElementById("add-monthly-interest");

investmentForm.addEventListener("submit", async e => {
  e.preventDefault();
  const newInvestment = {
    name: invNameInput.value,
    principal: +invAmountInput.value,
    category: invCategoryInput.value,
    interest: +invInterestInput.value,
    date: invDateInput.value,
    currency: invCurrencyInput.value,
    accumulatedInterest: 0,
    monthlyInterests: []
  };
  const editIndex = investmentForm.dataset.editIndex;
  if(editIndex !== undefined){
    investments[editIndex] = newInvestment;
    delete investmentForm.dataset.editIndex;
  } else {
    investments.push(newInvestment);
  }
  await save();
  investmentForm.reset();
});

addMonthlyInterestBtn.addEventListener("click", async ()=>{
  const idx = parseInt(selectInvestment.value);
  if(isNaN(idx)) return alert("Sélectionnez un investissement");
  const inv = investments[idx];

  const month = interestDateInput.value;
  if(!month) return alert("Sélectionnez un mois");

  let interestValue = parseFloat(interestAmountInput.value);
  if(isNaN(interestValue) || interestValue <= 0) interestValue = inv.principal * inv.interest / 100;

  inv.monthlyInterests.push({ month, amount: interestValue });
  inv.accumulatedInterest = inv.monthlyInterests.reduce((sum,m)=>sum+m.amount,0);

  await save();
  selectInvestment.value = "";
  interestDateInput.value = "";
  interestAmountInput.value = "";
  alert(`Intérêt ajouté : ${interestValue.toFixed(2)} ${inv.currency} pour ${month}`);
});

function updateInvestmentSelect(){
  selectInvestment.innerHTML = `<option value="">-- Select Investment --</option>`;
  investments.forEach((inv,idx)=>{
    const option = document.createElement("option");
    option.value = idx; option.textContent = inv.name;
    selectInvestment.appendChild(option);
  });
}

function renderInvestments(){
  const tbody = document.querySelector("#investment-table tbody");
  tbody.innerHTML = "";
  investments.forEach((i,idx)=>{
    const interestsDetail = i.monthlyInterests.map(m=>`${m.month}: ${m.amount.toFixed(2)}`).join("<br>");
    tbody.innerHTML += `<tr>
      <td>${i.name}</td>
      <td>${i.principal}</td>
      <td>${i.category}</td>
      <td>${i.interest}%</td>
      <td>${i.currency}</td>
      <td>${i.date}</td>
      <td>${(i.accumulatedInterest||0).toFixed(2)}<br>${interestsDetail}</td>
      <td>
        <button onclick="editInvestment(${idx})">Éditer</button>
        <button onclick="deleteInvestment(${idx})">X</button>
      </td>
    </tr>`;
  });
}

window.deleteInvestment = async idx => {
  investments.splice(idx,1);
  await save();
};

window.editInvestment = idx => {
  const i = investments[idx];
  invNameInput.value = i.name;
  invAmountInput.value = i.principal;
  invCategoryInput.value = i.category;
  invInterestInput.value = i.interest;
  invDateInput.value = i.date;
  invCurrencyInput.value = i.currency;
  investmentForm.dataset.editIndex = idx;
};

// ================= CSV export =================
document.getElementById("export-csv-btn").onclick = () => {
  let csv = "Name,Amount,Type,Category,Date,Currency\n";
  transactions.forEach(t => csv += `${t.name},${t.amount},${t.type},${t.category},${t.date},${t.currency}\n`);
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = "export.csv";
  a.click();
};

// ================= Charts =================
let transactionsChart, investmentsChart;

function renderCharts(){
  // Transactions
  const incomeCategories = {}, expenseCategories = {};
  transactions.forEach(t=>{
    if(t.type==="income") incomeCategories[t.category] = (incomeCategories[t.category]||0)+t.amount;
    if(t.type==="expense") expenseCategories[t.category] = (expenseCategories[t.category]||0)+t.amount;
  });
  const labels = [...new Set([...Object.keys(incomeCategories),...Object.keys(expenseCategories)])];

  const ctxT = document.getElementById("transactionsChart").getContext("2d");
  if(transactionsChart) transactionsChart.destroy();
  transactionsChart = new Chart(ctxT,{
    type:"bar",
    data:{
      labels,
      datasets:[
        { label:"Income", data:labels.map(l=>incomeCategories[l]||0), backgroundColor:"green" },
        { label:"Expense", data:labels.map(l=>expenseCategories[l]||0), backgroundColor:"red" }
      ]
    },
    options:{ responsive:true, plugins:{ legend:{ position:"top" } } }
  });

  // Investments
  const invLabels = investments.map(i=>i.name);
  const invPrincipal = investments.map(i=>i.principal);
  const invInterest = investments.map(i=>i.accumulatedInterest||0);

  const ctxI = document.getElementById("investmentsChart").getContext("2d");
  if(investmentsChart) investmentsChart.destroy();
  investmentsChart = new Chart(ctxI,{
    type:"bar",
    data:{
      labels: invLabels,
      datasets:[
        { label:"Principal", data:invPrincipal, backgroundColor:"blue" },
        { label:"Accumulated Interest", data:invInterest, backgroundColor:"orange" }
      ]
    },
    options:{ responsive:true, plugins:{ legend:{ position:"top" } } }
  });
}

// ================= Save =================
async function save(){
  renderTransactions(); 
  renderInvestments(); 
  updateInvestmentSelect();
  renderCharts();

  const user = auth.currentUser;
  if(user){
    const userDocRef = doc(db,"users",user.uid);
    await setDoc(userDocRef,{transactions,investments});
  } else {
    localStorage.setItem("transactions",JSON.stringify(transactions));
    localStorage.setItem("investments",JSON.stringify(investments));
  }
}

// ================= Init =================
showTab("transactions");
updateInvestmentSelect();
