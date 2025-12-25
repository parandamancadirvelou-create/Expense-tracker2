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

  const snap = await getDoc(doc(db,"users",user.uid));
  if(snap.exists()){
    transactions = snap.data().transactions || [];
    investments = snap.data().investments || [];
  }

  // 🔒 rétrocompatibilité
  investments.forEach(inv=>{
    if(!inv.monthlyInterests) inv.monthlyInterests = {};
  });

  save();
});

// ================= TRANSACTIONS =================
document.getElementById("transaction-form").onsubmit = e => {
  e.preventDefault();

  const t = {
    name: name.value,
    amount: +amount.value,
    type: type.value,
    category: category.value,
    date: date.value,
    currency: currency.value
  };

  const idx = e.target.dataset.editIndex;
  if(idx !== undefined){
    transactions[idx] = t;
    delete e.target.dataset.editIndex;
  } else {
    transactions.push(t);
  }

  save();
  e.target.reset();
};

window.editTransaction = i => {
  const t = transactions[i];
  name.value=t.name;
  amount.value=t.amount;
  type.value=t.type;
  category.value=t.category;
  date.value=t.date;
  currency.value=t.currency;
  document.getElementById("transaction-form").dataset.editIndex=i;
};

window.delT = i => { transactions.splice(i,1); save(); };

// ================= INVESTMENTS =================
document.getElementById("investment-form").onsubmit = e => {
  e.preventDefault();

  investments.push({
    name: invName.value,
    principal: +invAmount.value,
    interest: +invInterest.value,
    currency: invCurrency.value,
    monthlyInterests: {}
  });

  save();
  e.target.reset();
};

// ================= ADD MONTHLY INTEREST =================
document.getElementById("add-monthly-interest").onclick = () => {

  const select = document.getElementById("select-investment");
  const monthInput = document.getElementById("interest-month");
  const paidDateInput = document.getElementById("interest-paid-date");
  const amountInput = document.getElementById("interest-amount");

  const idx = select.value;
  if(idx === "") return alert("Sélectionnez un investissement");

  const month = monthInput.value;
  const paidDate = paidDateInput.value;

  if(!month || !paidDate) return alert("Mois et date requis");

  const inv = investments[idx];

  const amount =
    parseFloat(amountInput.value) ||
    (inv.principal * inv.interest / 100);

  inv.monthlyInterests[month] = {
    amount,
    paidDate
  };

  monthInput.value = "";
  paidDateInput.value = "";
  amountInput.value = "";

  save();
};

// ================= HELPERS =================
function getAccumulatedInterest(inv){
  return Object.values(inv.monthlyInterests || {})
    .reduce((s,i)=>s+i.amount,0);
}

// ================= RENDER =================
function renderTransactions(){
  document.querySelector("#transaction-table tbody").innerHTML =
    transactions.map((t,i)=>`
      <tr>
        <td>${t.name}</td>
        <td>${t.amount}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
        <td>${t.date}</td>
        <td>${t.currency}</td>
        <td>
          <button onclick="editTransaction(${i})">✏️</button>
          <button onclick="delT(${i})">❌</button>
        </td>
      </tr>`).join("");
}

function renderInvestments(){
  document.querySelector("#investment-table tbody").innerHTML =
    investments.map((inv,i)=>`
      <tr>
        <td>${inv.name}</td>
        <td>${inv.principal}</td>
        <td>${inv.interest}%</td>
        <td>${inv.currency}</td>
        <td>${getAccumulatedInterest(inv).toFixed(2)}</td>
        <td><button onclick="investments.splice(${i},1);save()">❌</button></td>
      </tr>`).join("");

  document.getElementById("select-investment").innerHTML =
    `<option value="">-- Select Investment --</option>` +
    investments.map((i,idx)=>`<option value="${idx}">${i.name}</option>`).join("");
}

function renderMonthlyInterests(){
  const tbody = document.querySelector("#interest-table tbody");
  tbody.innerHTML = "";

  investments.forEach(inv=>{
    Object.entries(inv.monthlyInterests).forEach(([month,data])=>{
      tbody.innerHTML += `
        <tr>
          <td>${inv.name}</td>
          <td>${month}</td>
          <td>${data.paidDate}</td>
          <td>${data.amount.toFixed(2)} ${inv.currency}</td>
        </tr>`;
    });
  });
}

// ================= SAVE =================
async function save(){
  renderTransactions();
  renderInvestments();
  renderMonthlyInterests();

  const user = auth.currentUser;
  if(user){
    await setDoc(doc(db,"users",user.uid),{transactions,investments});
  }
}

// ================= INIT =================
document.getElementById("tab-transactions").click();
