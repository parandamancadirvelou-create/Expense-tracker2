import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = window.auth;
const db = window.db;

let transactions = [];
let investments = [];

let transactionsChart, investmentsChart;

console.log("✅ script.js chargé");

// AUTH
login.onclick = () => signInWithEmailAndPassword(auth, email.value, password.value);
register.onclick = () => createUserWithEmailAndPassword(auth, email.value, password.value);

onAuthStateChanged(auth, async user => {
  if (!user) return authBox.style.display="block";
  authBox.style.display="none";
  appBox.style.display="block";

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    transactions = data.transactions || [];
    investments = data.investments || [];
    console.log("📦 Données Firestore chargées", data);
  } else {
    await setDoc(ref, { transactions: [], investments: [] });
  }
  renderAll();
});

// TABS
["transactions","investments","charts"].forEach(t=>{
  document.getElementById(`tab-${t}`).onclick=()=>{
    document.querySelectorAll(".tab-content").forEach(x=>x.style.display="none");
    document.getElementById(`${t}-tab`).style.display="block";
  };
});

// TRANSACTIONS
transactionForm.onsubmit=e=>{
  e.preventDefault();
  transactions.push({
    name:name.value, amount:+amount.value, type:type.value,
    category:category.value, date:date.value, currency:currency.value
  });
  save();
  transactionForm.reset();
};

function renderTransactions(){
  transactionTable.tBodies[0].innerHTML="";
  transactions.forEach(t=>{
    transactionTable.tBodies[0].innerHTML+=
      `<tr><td>${t.name}</td><td>${t.amount}</td><td>${t.type}</td><td>${t.category}</td><td>${t.date}</td><td>${t.currency}</td></tr>`;
  });
}

// INVESTMENTS
investmentForm.onsubmit=e=>{
  e.preventDefault();
  investments.push({
    name:invName.value, principal:+invAmount.value,
    interest:+invInterest.value, monthly:{}
  });
  save(); investmentForm.reset();
};

addMonthlyInterest.onclick=()=>{
  const inv=investments[selectInvestment.value];
  if(!inv) return;
  inv.monthly[interestMonth.value]={amount:+interestAmount.value||0};
  save();
};

// CHARTS
function renderCharts(){
  if(transactionsChart) transactionsChart.destroy();
  transactionsChart=new Chart(transactionsChartEl,{
    type:"bar",
    data:{labels:transactions.map(t=>t.date),
    datasets:[{data:transactions.map(t=>t.amount)}]},
    options:{responsive:true,maintainAspectRatio:false}
  });
}

// SAVE
async function save(){
  renderAll();
  const user=auth.currentUser;
  if(user){
    console.log("💾 Sauvegarde Firestore");
    await setDoc(doc(db,"users",user.uid),{transactions,investments});
  }
}

function renderAll(){
  renderTransactions();
  renderCharts();
}
