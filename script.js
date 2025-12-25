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

// AUTH
login.onclick = () => signInWithEmailAndPassword(auth,email.value,password.value);
register.onclick = () => createUserWithEmailAndPassword(auth,email.value,password.value);
logout.onclick = () => signOut(auth);

onAuthStateChanged(auth, async user=>{
  if(user){
    authBox.style.display="none"; appBox.style.display="block";
    const snap = await getDoc(doc(db,"users",user.uid));
    if(snap.exists()){
      transactions = snap.data().transactions||[];
      investments = snap.data().investments||[];
    }
    save();
  } else {
    authBox.style.display="block"; appBox.style.display="none";
  }
});

// TABS
["transactions","investments","charts"].forEach(t=>{
  document.getElementById(`tab-${t}`).onclick=()=>{
    document.querySelectorAll(".tab-content").forEach(x=>x.style.display="none");
    document.getElementById(`${t}-tab`).style.display="block";
    if(t==="charts") renderCharts();
  };
});

// TRANSACTIONS
transaction-form.onsubmit=e=>{
  e.preventDefault();
  const t={name:name.value,amount:+amount.value,type:type.value,category:category.value,date:date.value,currency:currency.value};
  const i=transaction-form.dataset.editIndex;
  i!==undefined?(transactions[i]=t,delete transaction-form.dataset.editIndex):transactions.push(t);
  save(); transaction-form.reset();
};

window.editTransaction=i=>{
  const t=transactions[i];
  name.value=t.name;amount.value=t.amount;type.value=t.type;
  category.value=t.category;date.value=t.date;currency.value=t.currency;
  transaction-form.dataset.editIndex=i;
};

window.delT=i=>{transactions.splice(i,1);save();};

// INVESTMENTS
investment-form.onsubmit=e=>{
  e.preventDefault();
  investments.push({
    name:invName.value,
    principal:+invAmount.value,
    interest:+invInterest.value,
    currency:invCurrency.value,
    monthlyInterests:{}
  });
  save(); investment-form.reset();
};

add-monthly-interest.onclick=()=>{
  const i=select-investment.value;
  if(i==="")return;
  const inv=investments[i];
  const m=new Date().toISOString().slice(0,7);
  const v=+interest-amount.value||inv.principal*inv.interest/100;
  inv.monthlyInterests[m]=(inv.monthlyInterests[m]||0)+v;
  save(); interest-amount.value="";
};

function save(){
  render();
  const u=auth.currentUser;
  if(u) setDoc(doc(db,"users",u.uid),{transactions,investments});
}

function render(){
  transaction-table.querySelector("tbody").innerHTML=transactions.map((t,i)=>`
    <tr><td>${t.name}</td><td>${t.amount}</td><td>${t.type}</td>
    <td>${t.category}</td><td>${t.date}</td><td>${t.currency}</td>
    <td><button onclick="editTransaction(${i})">✏️</button>
    <button onclick="delT(${i})">❌</button></td></tr>`).join("");

  select-investment.innerHTML='<option value="">--Select--</option>'+
    investments.map((i,x)=>`<option value="${x}">${i.name}</option>`).join("");

  investment-table.querySelector("tbody").innerHTML=investments.map((i,x)=>{
    const acc=Object.values(i.monthlyInterests).reduce((a,b)=>a+b,0);
    return `<tr><td>${i.name}</td><td>${i.principal}</td>
    <td>${i.interest}%</td><td>${i.currency}</td>
    <td>${acc.toFixed(2)}</td><td><button onclick="investments.splice(${x},1);save()">❌</button></td></tr>`;
  }).join("");

  interest-table.querySelector("tbody").innerHTML=investments.flatMap(i=>
    Object.entries(i.monthlyInterests).map(([m,v])=>
      `<tr><td>${i.name}</td><td>${m}</td><td>${v.toFixed(2)} ${i.currency}</td></tr>`
    )).join("");
}

function renderCharts(){
  new Chart(transactionsChart,{type:"doughnut",
    data:{labels:["Income","Expense"],
    datasets:[{data:[
      transactions.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0),
      transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+b.amount,0)
    ]}]}});
}
