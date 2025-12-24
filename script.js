// ================== FIREBASE AUTH ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Configuration Firebase
const firebaseConfig = {
 apiKey: "AIzaSyChlTQgk-BvdNf8jRskBY-kos_kCeQIWW0",
  authDomain: "expense-traker-247d1.firebaseapp.com",
  projectId: "expense-traker-247d1",
  storageBucket: "expense-traker-247d1.firebasestorage.app",
  messagingSenderId: "1083688124128",
  appId: "1:1083688124128:web:4e5c5c0313c5c8fe3cda85",
  measurementId: "G-W0XV7P2X2H"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ================== SELECTEURS ==================
const authBox = document.getElementById("authBox");
const appBox = document.getElementById("appBox");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("login");
const registerBtn = document.getElementById("register");
const logoutBtn = document.getElementById("logout");

// ================== AUTHENTIFICATION ==================

// LOGIN
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) return alert("Veuillez remplir email et mot de passe");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Connexion réussie !");
  } catch (err) {
    console.error(err);
    alert("Erreur de connexion : " + err.message);
  }
});

// REGISTER
registerBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) return alert("Veuillez remplir email et mot de passe");

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Compte créé avec succès !");
  } catch (err) {
    console.error(err);
    alert("Erreur d'inscription : " + err.message);
  }
});

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error(err);
    alert("Erreur de déconnexion : " + err.message);
  }
});

// Garder la session active
onAuthStateChanged(auth, user => {
  if (user) {
    authBox.style.display = "none";
    appBox.style.display = "block";
  } else {
    authBox.style.display = "block";
    appBox.style.display = "none";
  }
});

// ================== DATA STORAGE ==================
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let investments = JSON.parse(localStorage.getItem('investments')) || [];
let selectedCurrency = 'USD';

// ================== TAB CONTROL ==================
const tabs = {
  transactions: document.getElementById('transactions-tab'),
  investments: document.getElementById('investments-tab'),
  charts: document.getElementById('charts-tab')
};

function showTab(tab){
  for(const key in tabs) tabs[key].style.display = 'none';
  tabs[tab].style.display = 'block';
  document.querySelectorAll('.tabs button').forEach(btn=>btn.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  if(tab==='charts') renderChart();
}

document.getElementById('tab-transactions').addEventListener('click', ()=>showTab('transactions'));
document.getElementById('tab-investments').addEventListener('click', ()=>showTab('investments'));
document.getElementById('tab-charts').addEventListener('click', ()=>showTab('charts'));

// ================== TRANSACTIONS ==================
const transactionForm = document.getElementById('transaction-form');
const transactionTableBody = document.querySelector('#transaction-table tbody');

transactionForm.addEventListener('submit', e=>{
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  const currency = document.getElementById('currency').value;
  selectedCurrency = currency;

  if(!name || isNaN(amount) || amount <= 0){
    return alert("Veuillez entrer un nom valide et un montant > 0");
  }

  transactions.push({name, amount, type, category, date, currency});
  saveData();
  transactionForm.reset();
});

function renderTransactions(){
  transactionTableBody.innerHTML = '';
  transactions.forEach((t, i)=>{
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${t.name}</td>
      <td>${t.amount.toFixed(2)}</td>
      <td>${t.type}</td>
      <td>${t.category}</td>
      <td>${t.date}</td>
      <td>${t.currency}</td>
    `;
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', ()=>editTransaction(i));
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', ()=>deleteTransaction(i));
    const tdActions = document.createElement('td');
    tdActions.appendChild(editBtn);
    tdActions.appendChild(deleteBtn);
    row.appendChild(tdActions);

    transactionTableBody.appendChild(row);
  });
}

function deleteTransaction(index){
  transactions.splice(index,1);
  saveData();
}

function editTransaction(index){
  const t = transactions[index];
  document.getElementById('name').value = t.name;
  document.getElementById('amount').value = t.amount;
  document.getElementById('type').value = t.type;
  document.getElementById('category').value = t.category;
  document.getElementById('date').value = t.date;
  document.getElementById('currency').value = t.currency;
  transactions.splice(index,1);
}

// ================== INVESTMENTS ==================
const investmentForm = document.getElementById('investment-form');
const investmentTableBody = document.querySelector('#investment-table tbody');
const selectInvestment = document.getElementById('select-investment');
const monthlyInterestBtn = document.getElementById('add-monthly-interest');
const interestAmountInput = document.getElementById('interest-amount');

investmentForm.addEventListener('submit', e=>{
  e.preventDefault();
  const name = document.getElementById('inv-name').value.trim();
  const principal = parseFloat(document.getElementById('inv-amount').value);
  const category = document.getElementById('inv-category').value;
  const interestRate = parseFloat(document.getElementById('inv-interest').value);
  const startDate = document.getElementById('inv-date').value;
  const currency = document.getElementById('inv-currency').value;

  if(!name || isNaN(principal) || principal <= 0 || isNaN(interestRate) || interestRate < 0){
    return alert("Veuillez entrer des valeurs valides");
  }

  investments.push({name, principal, category, interestRate, startDate, currency});
  saveData();
  investmentForm.reset();
});

function updateInvestmentDropdown() {
  selectInvestment.innerHTML = '<option value="">-- Select Investment --</option>';
  investments.forEach((inv,i)=>{
    const option = document.createElement('option');
    option.value = i;
    option.textContent = inv.name;
    selectInvestment.appendChild(option);
  });
}

monthlyInterestBtn.addEventListener('click', ()=>{
  const selectedMonth = document.getElementById('interest-date').value;
  const selectedIndex = selectInvestment.value;
  if(selectedIndex === "" || !selectedMonth){
    return alert('Please select an investment and a month.');
  }
  const inv = investments[selectedIndex];
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthStr = `${year}-${String(month).padStart(2,'0')}`;
  const interestDate = new Date(year, month-1, 1);

  let interestAmount = parseFloat(interestAmountInput.value);
  if(isNaN(interestAmount) || interestAmount <= 0){
    interestAmount = inv.principal * inv.interestRate / 100;
  }

  transactions.push({
    name: `${inv.name} Interest (${monthStr})`,
    amount: interestAmount,
    type: 'income',
    category: 'Investment Interest',
    date: interestDate.toISOString().slice(0,10),
    currency: inv.currency
  });

  saveData();
  alert(`Monthly interest for ${inv.name} added for ${monthStr}.`);
});

function renderInvestments(){
  investmentTableBody.innerHTML = '';
  investments.forEach((inv,i)=>{
    const accInterest = calculateAccumulatedInterest(inv);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${inv.name}</td>
      <td>${inv.principal.toFixed(2)}</td>
      <td>${inv.interestRate}%</td>
      <td>${inv.currency}</td>
      <td>${inv.startDate}</td>
      <td>${accInterest.toFixed(2)}</td>
    `;
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', ()=>deleteInvestment(i));
    const tdActions = document.createElement('td');
    tdActions.appendChild(delBtn);
    row.appendChild(tdActions);
    investmentTableBody.appendChild(row);
  });
  updateInvestmentDropdown();
}

function deleteInvestment(index){
  investments.splice(index,1);
  saveData();
}

function calculateAccumulatedInterest(inv){
  const today = new Date();
  const start = new Date(inv.startDate);
  let months = (today.getFullYear()-start.getFullYear())*12 + (today.getMonth()-start.getMonth());
  if(months<0) months = 0;
  return inv.principal * inv.interestRate/100 * months;
}

// ================== CHART ==================
let overviewChart;
function renderChart(){
  const monthSet = new Set();
  transactions.forEach(t=>monthSet.add(t.date.slice(0,7)));
  investments.forEach(inv=>monthSet.add(inv.startDate.slice(0,7)));
  const months = Array.from(monthSet).sort();

  const incomeData = months.map(m=>transactions.filter(t=>t.type==='income' && t.date.startsWith(m) && t.currency===selectedCurrency).reduce((a,b)=>a+b.amount,0));
  const expenseData = months.map(m=>transactions.filter(t=>t.type==='expense' && t.date.startsWith(m) && t.currency===selectedCurrency).reduce((a,b)=>a+b.amount,0));
  const investmentData = months.map(m=>{
    return investments.filter(inv=>inv.currency===selectedCurrency).reduce((sum,inv)=>{
      const monthInterest = calculateInterestUpToMonth(inv,m);
      return sum+monthInterest;
    },0);
  });

  const ctx = document.getElementById('overviewChart').getContext('2d');
  if(overviewChart) overviewChart.destroy();

  overviewChart = new Chart(ctx,{
    type:'bar',
    data:{
      labels:months,
      datasets:[
        {label:'Income', data:incomeData, backgroundColor:'green'},
        {label:'Expenses', data:expenseData, backgroundColor:'red'},
        {label:'Investments (Interest)', data:investmentData, backgroundColor:'blue'}
      ]
    },
    options:{responsive:true, scales:{y:{beginAtZero:true}}}
  });
}

function calculateInterestUpToMonth(inv,monthStr){
  const [year, mon] = monthStr.split('-').map(Number);
  const monthDate = new Date(year, mon-1, 1);
  const startDate = new Date(inv.startDate);
  let months = (monthDate.getFullYear()-startDate.getFullYear())*12 + (monthDate.getMonth()-startDate.getMonth()) + 1;
  if(months<0) months=0;
  return inv.principal * inv.interestRate/100 * months;
}

// ================== SAVE / LOAD ==================
function saveData(){
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('investments', JSON.stringify(investments));
  renderTransactions();
  renderInvestments();
}

// ================== INITIAL RENDER ==================
renderTransactions();
renderInvestments();
showTab('transactions');

// ================== CSV EXPORT ==================
function exportCSV(){
  let csv = "Name,Amount/Principal,Type/Interest%,Category,Date,Currency\n";
  transactions.forEach(t=>{
    csv+=`${t.name},${t.amount},${t.type},${t.category},${t.date},${t.currency}\n`;
  });
  investments.forEach(inv=>{
    const accInterest = calculateAccumulatedInterest(inv).toFixed(2);
    csv+=`${inv.name},${inv.principal},Investment,${inv.category},${inv.startDate},${inv.currency}\n`;
    csv+=`${inv.name} (Interest),${accInterest},Accumulated Interest,${inv.category},${inv.startDate},${inv.currency}\n`;
  });

  const encodedUri = encodeURI("data:text/csv;charset=utf-8,"+csv);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download","tracker_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.addEventListener('keydown', e=>{
  if(e.ctrlKey && e.key==='e'){ // Ctrl+E to export
    exportCSV();
  }
});
// ================== BOUTON EXPORT CSV ==================
const exportCSVBtn = document.getElementById('export-csv-btn');
exportCSVBtn.addEventListener('click', () => {
    exportCSV();
});

