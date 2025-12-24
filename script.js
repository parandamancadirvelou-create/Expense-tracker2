import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = window.auth;

// AUTH
const authBox = document.getElementById("authBox");
const appBox = document.getElementById("appBox");

login.onclick = async () =>
  signInWithEmailAndPassword(auth, email.value, password.value);

register.onclick = async () =>
  createUserWithEmailAndPassword(auth, email.value, password.value);

logout.onclick = async () => signOut(auth);

onAuthStateChanged(auth, u => {
  authBox.style.display = u ? "none" : "block";
  appBox.style.display = u ? "block" : "none";
});

// DATA
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let investments = JSON.parse(localStorage.getItem("investments")) || [];

// TABS
function showTab(tab){
  document.querySelectorAll(".tab-content").forEach(t=>t.style.display="none");
  document.getElementById(tab+"-tab").style.display="block";
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));
  document.getElementById("tab-"+tab).classList.add("active");
}
tab-transactions.onclick = ()=>showTab("transactions");
tab-investments.onclick = ()=>showTab("investments");
tab-charts.onclick = ()=>showTab("charts");

// TRANSACTIONS
transaction-form.addEventListener("submit", e=>{
  e.preventDefault();
  transactions.push({
    name:name.value,
    amount:+amount.value,
    type:type.value,
    category:category.value,
    date:date.value,
    currency:currency.value
  });
  save();
  transaction-form.reset();
});

function renderTransactions(){
  const tbody=document.querySelector("#transaction-table tbody");
  tbody.innerHTML="";
  transactions.forEach((t,i)=>{
    tbody.innerHTML+=`
    <tr>
      <td>${t.name}</td><td>${t.amount}</td><td>${t.type}</td>
      <td>${t.category}</td><td>${t.date}</td><td>${t.currency}</td>
      <td><button onclick="delT(${i})">X</button></td>
    </tr>`;
  });
}
window.delT=i=>{transactions.splice(i,1);save();};

// INVESTMENTS
investment-form.addEventListener("submit", e=>{
  e.preventDefault();
  investments.push({
    name:inv-name.value,
    principal:+inv-amount.value,
    interest:+inv-interest.value,
    date:inv-date.value,
    currency:inv-currency.value
  });
  save();
  investment-form.reset();
});

function renderInvestments(){
  const tbody=document.querySelector("#investment-table tbody");
  tbody.innerHTML="";
  investments.forEach((i,x)=>{
    tbody.innerHTML+=`
    <tr>
      <td>${i.name}</td><td>${i.principal}</td><td>${i.interest}%</td>
      <td>${i.currency}</td><td>${i.date}</td>
      <td>${i.principal*i.interest/100}</td>
      <td><button onclick="delI(${x})">X</button></td>
    </tr>`;
  });
}
window.delI=i=>{investments.splice(i,1);save();};

// CSV
export-csv-btn.onclick=()=>{
  let csv="Name,Amount,Type,Category,Date,Currency\n";
  transactions.forEach(t=>{
    csv+=`${t.name},${t.amount},${t.type},${t.category},${t.date},${t.currency}\n`;
  });
  const a=document.createElement("a");
  a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
  a.download="export.csv";
  a.click();
};

// SAVE
function save(){
  localStorage.setItem("transactions",JSON.stringify(transactions));
  localStorage.setItem("investments",JSON.stringify(investments));
  renderTransactions();
  renderInvestments();
}

// INIT
save();
showTab("transactions");
