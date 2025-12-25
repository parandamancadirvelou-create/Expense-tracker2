import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = window.auth;
const db = window.db;

let transactions = [];
let investments = [];

// DOM
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const login = document.getElementById("login");
const register = document.getElementById("register");
const logout = document.getElementById("logout");

const name = document.getElementById("name");
const amount = document.getElementById("amount");
const type = document.getElementById("type");
const category = document.getElementById("category");
const date = document.getElementById("date");
const currency = document.getElementById("currency");
const transactionForm = document.getElementById("transaction-form");

const invName = document.getElementById("inv-name");
const invAmount = document.getElementById("inv-amount");
const invInterest = document.getElementById("inv-interest");
const invCurrency = document.getElementById("inv-currency");
const investmentForm = document.getElementById("investment-form");

const selectInvestment = document.getElementById("select-investment");
const interestMonth = document.getElementById("interest-month");
const interestPaidDate = document.getElementById("interest-paid-date");
const interestAmount = document.getElementById("interest-amount");
const addMonthlyInterestBtn = document.getElementById("add-monthly-interest");

// ================= AUTH =================
login.onclick = () => signInWithEmailAndPassword(auth,emailEl.value,passwordEl.value);
register.onclick = () => createUserWithEmailAndPassword(auth,emailEl.value,passwordEl.value);
logout.onclick = () => signOut(auth);

onAuthStateChanged(auth, async user=>{
  if(!user){authBox.style.display="block"; appBox.style.display="none"; return;}
  authBox.style.display="none"; appBox.style.display="block";
  const ref=doc(db,"users",user.uid);
  const snap=await getDoc(ref);
  if(snap.exists()){transactions=snap.data().transactions||[]; investments=snap.data().investments||[];
    investments.forEach(inv=>{
      if(!inv.monthlyInterests) inv.monthlyInterests={};
    });
  }
  save();
});

// ================= TABS =================
["transactions","investments","charts"].forEach(tab=>{
  document.getElementById(`tab-${tab}`).onclick=()=>{
    document.querySelectorAll(".tab-content").forEach(t=>t.style.display="none");
    document.getElementById(`${tab}-tab`).style.display="block";
    if(tab==="charts") renderCharts();
  };
});

// ================= TRANSACTIONS =================
transactionForm.onsubmit = e=>{
  e.preventDefault();
  const t={name:name.value,amount:+amount.value,type:type.value,category:category.value,date:date.value,currency:currency.value};
  const idx=e.target.dataset.editIndex;
  if(idx!==undefined){transactions[idx]=t; delete e.target.dataset.editIndex;}
  else transactions.push(t);
  save(); e.target.reset();
};

window.editTransaction=i=>{
  const t=transactions[i];
  name.value=t.name; amount.value=t.amount; type.value=t.type; category.value=t.category;
  date.value=t.date; currency.value=t.currency;
  transactionForm.dataset.editIndex=i;
};

window.delT=i=>{transactions.splice(i,1); save();};

// ================= INVESTMENTS =================
investmentForm.onsubmit=e=>{
  e.preventDefault();
  const idx=investmentForm.dataset.editIndex;
  if(idx!==undefined){
    const inv=investments[idx];
    inv.name=invName.value; inv.principal=+invAmount.value; inv.interest=+invInterest.value; inv.currency=invCurrency.value;
    delete investmentForm.dataset.editIndex;
  } else {
    investments.push({name:invName.value,principal:+invAmount.value,interest:+invInterest.value,currency:invCurrency.value,monthlyInterests:{}});
  }
  save(); e.target.reset();
};

window.editInvestment=i=>{
  const inv=investments[i];
  invName.value=inv.name; invAmount.value=inv.principal; invInterest.value=inv.interest; invCurrency.value=inv.currency;
  investmentForm.dataset.editIndex=i;
};

window.deleteInvestment=i=>{
  investments.splice(i,1); save();
};

// ================= ADD MONTHLY INTEREST =================
addMonthlyInterestBtn.onclick=()=>{
  const idx=selectInvestment.value;
  if(idx==="") return alert("Sélectionnez un investissement");
  const month=interestMonth.value; const paidDate=interestPaidDate.value;
  if(!month||!paidDate) return alert("Mois et date requis");
  const inv=investments[idx]; if(!inv.monthlyInterests) inv.monthlyInterests={};
  const amount=parseFloat(interestAmount.value)||inv.principal*inv.interest/100;
  inv.monthlyInterests[month]={amount,paidDate};
  interestMonth.value=""; interestPaidDate.value=""; interestAmount.value="";
  save();
};

// ================= EDIT/DELETE INTEREST =================
window.deleteInterest=(invIndex,month)=>{
  delete investments[invIndex].monthlyInterests[month];
  save();
};

window.editInterest=(invIndex,month)=>{
  const inv = investments[invIndex];
  const data = inv.monthlyInterests[month];
  selectInvestment.value = invIndex;
  interestMonth.value = month;
  interestPaidDate.value = data.paidDate;
  interestAmount.value = data.amount;
};

// ================= HELPERS =================
function getAccumulatedInterest(inv){return Object.values(inv.monthlyInterests||{}).reduce((s,i)=>s+i.amount,0);}

// ================= RENDER =================
function renderTransactions(){
  const tbody=document.querySelector("#transaction-table tbody"); tbody.innerHTML="";
  transactions.forEach((t,i)=>{
    tbody.innerHTML+=`<tr>
      <td>${t.name}</td><td>${t.amount}</td><td>${t.type}</td><td>${t.category}</td><td>${t.date}</td><td>${t.currency}</td>
      <td><button onclick="editTransaction(${i})">✏️</button> <button onclick="delT(${i})">❌</button></td></tr>`;
  });
}

function renderInvestments(){
  const tbody=document.querySelector("#investment-table tbody"); tbody.innerHTML="";
  investments.forEach((inv,i)=>{
    tbody.innerHTML+=`<tr>
      <td>${inv.name}</td><td>${inv.principal}</td><td>${inv.interest}%</td><td>${inv.currency}</td><td>${getAccumulatedInterest(inv).toFixed(2)}</td>
      <td><button onclick="editInvestment(${i})">✏️</button> <button onclick="deleteInvestment(${i})">❌</button></td></tr>`;
  });
  updateInvestmentSelect();
}

function updateInvestmentSelect(){
  selectInvestment.innerHTML=`<option value="">-- Sélectionner investissement --</option>`;
  investments.forEach((i,idx)=>{const option=document.createElement("option"); option.value=idx; option.textContent=i.name; selectInvestment.appendChild(option);});
}

function renderMonthlyInterests(){
  const tbody=document.querySelector("#interest-table tbody"); tbody.innerHTML="";
  investments.forEach((inv,i)=>{
    if(!inv.monthlyInterests) return;
    Object.entries(inv.monthlyInterests).forEach(([month,data])=>{
      tbody.innerHTML+=`<tr>
        <td>${inv.name}</td><td>${month}</td><td>${data.paidDate}</td><td>${data.amount.toFixed(2)} ${inv.currency}</td>
        <td><button onclick="editInterest(${i},'${month}')">✏️</button> <button onclick="deleteInterest(${i},'${month}')">❌</button></td>
      </tr>`;
    });
  });
}

// ================= CHARTS =================
function renderCharts(){
  new Chart(document.getElementById("transactionsChart"),{type:"doughnut",data:{labels:["Income","Expense"],datasets:[{data:[transactions.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0),transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+b.amount,0)],backgroundColor:["#4CAF50","#F44336"]}]}});

  new Chart(document.getElementById("investmentsChart"),{type:"bar",data:{labels:investments.map(i=>i.name),datasets:[{label:"Capital + Intérêts",data:investments.map(i=>i.principal+getAccumulatedInterest(i)),backgroundColor:"#2196F3"}]}});
}

// ================= EXPORT CSV =================
document.getElementById("export-csv-btn").onclick=()=>{
  let csv="Transactions\nNom,Montant,Type,Catégorie,Date,Devise\n";
  transactions.forEach(t=>csv+=`${t.name},${t.amount},${t.type},${t.category},${t.date},${t.currency}\n`);
  csv+="\nInvestissements\nNom,Principal,Taux %,Devise,Intérêt cumulé\n";
  investments.forEach(inv=>csv+=`${inv.name},${inv.principal},${inv.interest},${inv.currency},${getAccumulatedInterest(inv).toFixed(2)}\n`);
  csv+="\nIntérêts Mensuels\nInvestissement,Mois,Date paiement,Montant\n";
  investments.forEach(inv=>{if(inv.monthlyInterests) Object.entries(inv.monthlyInterests).forEach(([month,d])=>csv+=`${inv.name},${month},${d.paidDate},${d.amount.toFixed(2)}\n`);});
  const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download="export_finances.csv"; a.click();
};

// ================= SAVE =================
async function save(){
  renderTransactions(); renderInvestments(); renderMonthlyInterests();
  const user=auth.currentUser;
  if(user) await setDoc(doc(db,"users",user.uid),{transactions,investments});
}

// ================= INIT =================
document.getElementById("tab-transactions").click();
