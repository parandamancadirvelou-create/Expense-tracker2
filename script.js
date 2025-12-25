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

// ================= AUTH =================
login.onclick = () => signInWithEmailAndPassword(auth,email.value,password.value);
register.onclick = () => createUserWithEmailAndPassword(auth,email.value,password.value);
logout.onclick = () => signOut(auth);

onAuthStateChanged(auth, async user => {
  if(!user){
    authBox.style.display="block";
    appBox.style.display="none";
    return;
  }

  authBox.style.display="none";
  appBox.style.display="block";

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if(snap.exists()){
    transactions = snap.data().transactions || [];
    investments = snap.data().investments || [];
    // 🔒 rétrocompatibilité
    investments.forEach(inv=>{
      if(!inv.monthlyInterests) inv.monthlyInterests={};
      if(!("principal" in inv)) inv.principal=0;
      if(!("interest" in inv)) inv.interest=0;
      if(!("currency" in inv)) inv.currency="USD";
    });
  }

  save();
});

// ================= TABS =================
["transactions","investments","charts"].forEach(tab=>{
  document.getElementById(`tab-${tab}`).onclick = ()=>{
    document.querySelectorAll(".tab-content").forEach(t=>t.style.display="none");
    document.getElementById(`${tab}-tab`).style.display="block";
    if(tab==="charts") renderCharts();
  };
});

// ================= TRANSACTIONS =================
document.getElementById("transaction-form").onsubmit = e=>{
  e.preventDefault();
  const t = {
    name:name.value,
    amount:+amount.value,
    type:type.value,
    category:category.value,
    date:date.value,
    currency:currency.value
  };
  const idx=e.target.dataset.editIndex;
  if(idx!==undefined){transactions[idx]=t; delete e.target.dataset.editIndex;}
  else transactions.push(t);
  save(); e.target.reset();
};
window.editTransaction = i=>{
  const t=transactions[i];
  name.value=t.name; amount.value=t.amount; type.value=t.type; category.value=t.category;
  date.value=t.date; currency.value=t.currency;
  document.getElementById("transaction-form").dataset.editIndex=i;
};
window.delT=i=>{transactions.splice(i,1); save();};

// ================= INVESTMENTS =================
document.getElementById("investment-form").onsubmit = e=>{
  e.preventDefault();
  investments.push({
    name:invName.value,
    principal:+invAmount.value,
    interest:+invInterest.value,
    currency:invCurrency.value,
    monthlyInterests:{}
  });
  save(); e.target.reset();
};

// ================= ADD MONTHLY INTEREST =================
document.getElementById("add-monthly-interest").onclick = ()=>{
  const idx=document.getElementById("select-investment").value;
  const month=document.getElementById("interest-month").value;
  const paidDate=document.getElementById("interest-paid-date").value;
  const amount=parseFloat(document.getElementById("interest-amount").value);
  if(idx==="") return alert("Sélectionnez un investissement");
  if(!month||!paidDate) return alert("Mois et date requis");

  const inv=investments[idx];
  if(!inv.monthlyInterests) inv.monthlyInterests={};
  inv.monthlyInterests[month]={amount: amount||inv.principal*inv.interest/100, paidDate};
  document.getElementById("interest-month").value="";
  document.getElementById("interest-paid-date").value="";
  document.getElementById("interest-amount").value="";
  save();
};

// ================= HELPERS =================
function getAccumulatedInterest(inv){return Object.values(inv.monthlyInterests||{}).reduce((s,i)=>s+i.amount,0);}

// ================= RENDER =================
function renderTransactions(){
  document.querySelector("#transaction-table tbody").innerHTML=
    transactions.map((t,i)=>`
      <tr>
        <td>${t.name}</td><td>${t.amount}</td><td>${t.type}</td>
        <td>${t.category}</td><td>${t.date}</td><td>${t.currency}</td>
        <td><button onclick="editTransaction(${i})">✏️</button> <button onclick="delT(${i})">❌</button></td>
      </tr>`).join("");
}
function renderInvestments(){
  document.querySelector("#investment-table tbody").innerHTML=
    investments.map((inv,i)=>`
      <tr>
        <td>${inv.name}</td><td>${inv.principal}</td><td>${inv.interest}%</td>
        <td>${inv.currency}</td><td>${getAccumulatedInterest(inv).toFixed(2)}</td>
        <td><button onclick="investments.splice(${i},1);save()">❌</button></td>
      </tr>`).join("");
  document.getElementById("select-investment").innerHTML=
    `<option value="">-- Sélectionner investissement --</option>`+
    investments.map((i,idx)=>`<option value="${idx}">${i.name}</option>`).join("");
}
function renderMonthlyInterests(){
  const tbody=document.querySelector("#interest-table tbody"); tbody.innerHTML="";
  investments.forEach(inv=>{
    if(!inv.monthlyInterests) return;
    Object.entries(inv.monthlyInterests).forEach(([month,data])=>{
      tbody.innerHTML+=`<tr><td>${inv.name}</td><td>${month}</td><td>${data.paidDate}</td><td>${data.amount.toFixed(2)} ${inv.currency}</td></tr>`;
    });
  });
}

// ================= CHARTS =================
function renderCharts(){
  new Chart(document.getElementById("transactionsChart"),{
    type:"doughnut",
    data:{
      labels:["Income","Expense"],
      datasets:[{
        data:[
          transactions.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0),
          transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+b.amount,0)
        ],
        backgroundColor:["#4CAF50","#F44336"]
      }]
    }
  });
  new Chart(document.getElementById("investmentsChart"),{
    type:"bar",
    data:{
      labels:investments.map(i=>i.name),
      datasets:[{
        label:"Capital + Intérêts",
        data:investments.map(i=>i.principal+getAccumulatedInterest(i)),
        backgroundColor:"#2196F3"
      }]
    }
  });
}

// ================= EXPORT CSV =================
document.getElementById("export-csv-btn").onclick=()=>{
  let csv="Transactions\nNom,Montant,Type,Catégorie,Date,Devise\n";
  transactions.forEach(t=>csv+=`${t.name},${t.amount},${t.type},${t.category},${t.date},${t.currency}\n`);
  csv+="\nInvestissements\nNom,Principal,Taux %,Devise,Intérêt cumulé\n";
  investments.forEach(inv=>csv+=`${inv.name},${inv.principal},${inv.interest},${inv.currency},${getAccumulatedInterest(inv).toFixed(2)}\n`);
  csv+="\nIntérêts Mensuels\nInvestissement,Mois,Date paiement,Montant\n";
  investments.forEach(inv=>{if(inv.monthlyInterests)Object.entries(inv.monthlyInterests).forEach(([month,d])=>csv+=`${inv.name},${month},${d.paidDate},${d.amount.toFixed(2)}\n`);});
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
