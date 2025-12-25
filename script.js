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

let transactionsChart = null;
let investmentsChart = null;

// ================= LOGIN =================
loginBtn.onclick = async () => {
  try { await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value); }
  catch(e){ alert(e.message); }
};
registerBtn.onclick = async () => {
  try { await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value); }
  catch(e){ alert(e.message); }
};
logoutBtn.onclick = () => signOut(auth);

// ================= AUTH STATE =================
onAuthStateChanged(auth, async user => {
  if(user){
    authBox.style.display="none"; appBox.style.display="block";
    const ref = doc(db,"users",user.uid);
    const snap = await getDoc(ref);
    if(snap.exists()){
      transactions = snap.data().transactions || [];
      investments = snap.data().investments || [];
    } else {
      await setDoc(ref,{transactions:[],investments:[]});
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
  if(tab === "charts"){
    renderTransactionsChart();
    renderInvestmentsChart();
  }
}
document.getElementById("tab-transactions").onclick = () => showTab("transactions");
document.getElementById("tab-investments").onclick = () => showTab("investments");
document.getElementById("tab-charts").onclick = () => showTab("charts");

// ================= TRANSACTIONS =================
const transactionForm = document.getElementById("transaction-form");

transactionForm.onsubmit = e => {
  e.preventDefault();
  const t = {
    name: name.value,
    amount: +amount.value,
    type: type.value,
    category: category.value,
    date: date.value,
    currency: currency.value
  };
  const idx = transactionForm.dataset.editIndex;
  if(idx !== undefined){ transactions[idx] = t; delete transactionForm.dataset.editIndex; }
  else transactions.push(t);
  save(); transactionForm.reset();
};

function renderTransactions(){
  const tbody = document.querySelector("#transaction-table tbody");
  tbody.innerHTML="";
  transactions.forEach((t,i)=>{
    tbody.innerHTML += `
    <tr>
      <td>${t.name}</td><td>${t.amount}</td><td>${t.type}</td>
      <td>${t.category}</td><td>${t.date}</td><td>${t.currency}</td>
      <td><button onclick="editTransaction(${i})">✏️</button>
      <button onclick="delT(${i})">❌</button></td>
    </tr>`;
  });
}
window.delT = i => { transactions.splice(i,1); save(); };
window.editTransaction = i => {
  const t = transactions[i];
  name.value=t.name; amount.value=t.amount; type.value=t.type;
  category.value=t.category; date.value=t.date; currency.value=t.currency;
  transactionForm.dataset.editIndex=i;
};

// ================= INVESTMENTS =================
const investmentForm = document.getElementById("investment-form");
const selectInvestment = document.getElementById("select-investment");
const interestAmountInput = document.getElementById("interest-amount");

investmentForm.onsubmit = e => {
  e.preventDefault();
  const inv = {
    name: invName.value,
    principal: +invAmount.value,
    category: invCategory.value,
    interest: +invInterest.value,
    date: invDate.value,
    currency: invCurrency.value,
    accumulatedInterest: 0,
    monthlyInterests: {}
  };
  investments.push(inv);
  save(); investmentForm.reset();
};

document.getElementById("add-monthly-interest").onclick = () => {
  const idx = selectInvestment.value;
  if(idx==="") return alert("Sélection requise");
  const inv = investments[idx];
  const value = parseFloat(interestAmountInput.value) ||
                (inv.principal * inv.interest / 100);
  inv.accumulatedInterest += value;
  save();
  interestAmountInput.value="";
};

function updateInvestmentSelect(){
  selectInvestment.innerHTML = `<option value="">-- Select Investment --</option>`;
  investments.forEach((i,idx)=>{
    selectInvestment.innerHTML += `<option value="${idx}">${i.name}</option>`;
  });
}

function renderInvestments(){
  const tbody = document.querySelector("#investment-table tbody");
  tbody.innerHTML="";
  investments.forEach((i,idx)=>{
    tbody.innerHTML += `
    <tr>
      <td>${i.name}</td><td>${i.principal}</td><td>${i.category}</td>
      <td>${i.interest}%</td><td>${i.currency}</td><td>${i.date}</td>
      <td>${i.accumulatedInterest.toFixed(2)}</td>
      <td><button onclick="deleteInvestment(${idx})">❌</button></td>
    </tr>`;
  });
}
window.deleteInvestment = i => { investments.splice(i,1); save(); };

// ================= CHARTS =================
function renderTransactionsChart(){
  if(transactionsChart) transactionsChart.destroy();
  const income = transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expense = transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);

  transactionsChart = new Chart(document.getElementById("transactionsChart"),{
    type:"doughnut",
    data:{ labels:["Income","Expense"],
      datasets:[{ data:[income,expense], backgroundColor:["#4CAF50","#F44336"] }] }
  });
}

function renderInvestmentsChart(){
  if(investmentsChart) investmentsChart.destroy();
  investmentsChart = new Chart(document.getElementById("investmentsChart"),{
    type:"bar",
    data:{
      labels: investments.map(i=>i.name),
      datasets:[{
        label:"Capital + Intérêts",
        data: investments.map(i=>i.principal+i.accumulatedInterest),
        backgroundColor:"#2196F3"
      }]
    }
  });
}

// ================= SAVE =================
async function save(){
  renderTransactions(); renderInvestments(); updateInvestmentSelect();
  const user = auth.currentUser;
  if(user){
    await setDoc(doc(db,"users",user.uid),{transactions,investments});
  }
}

// ================= INIT =================
showTab("transactions");
