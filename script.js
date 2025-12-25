import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = window.auth;
const db = window.db;

// ================= DATA =================
let transactions = [];
let investments = [];

let transactionsChart = null;
let investmentsChart = null;

// ================= AUTH =================
login.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
  } catch (e) {
    alert(e.message);
  }
};

register.onclick = async () => {
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
  } catch (e) {
    alert(e.message);
  }
};

logout.onclick = () => signOut(auth);

onAuthStateChanged(auth, async user => {
  if (user) {
    authBox.style.display = "none";
    appBox.style.display = "block";

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      transactions = snap.data().transactions || [];
      investments = snap.data().investments || [];
    } else {
      await setDoc(ref, { transactions: [], investments: [] });
    }

    save();
  } else {
    authBox.style.display = "block";
    appBox.style.display = "none";
  }
});

// ================= TABS =================
["transactions", "investments", "charts"].forEach(tab => {
  document.getElementById(`tab-${tab}`).onclick = () => {
    document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
    document.getElementById(`${tab}-tab`).style.display = "block";
    if (tab === "charts") renderCharts();
  };
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
  if (idx !== undefined) {
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
  name.value = t.name;
  amount.value = t.amount;
  type.value = t.type;
  category.value = t.category;
  date.value = t.date;
  currency.value = t.currency;
  document.getElementById("transaction-form").dataset.editIndex = i;
};

window.delT = i => {
  transactions.splice(i, 1);
  save();
};

// ================= INVESTMENTS =================
document.getElementById("investment-form").onsubmit = e => {
  e.preventDefault();

  investments.push({
    name: invName.value,
    principal: +invAmount.value,
    interest: +invInterest.value,
    currency: invCurrency.value,
    monthlyInterests: {} // { "YYYY-MM": { amount, paidDate } }
  });

  save();
  e.target.reset();
};

// ================= ADD MONTHLY INTEREST =================
document.getElementById("add-monthly-interest").onclick = () => {
  const idx = document.getElementById("select-investment").value;
  if (idx === "") return alert("Select an investment");

  const month = document.getElementById("interest-month").value;
  const paidDate = document.getElementById("interest-paid-date").value;

  if (!month || !paidDate) return alert("Month and payment date required");

  const inv = investments[idx];

  const amount =
    parseFloat(document.getElementById("interest-amount").value) ||
    (inv.principal * inv.interest / 100);

  if (!inv.monthlyInterests) inv.monthlyInterests = {};

  inv.monthlyInterests[month] = {
    amount,
    paidDate
  };

  document.getElementById("interest-month").value = "";
  document.getElementById("interest-paid-date").value = "";
  document.getElementById("interest-amount").value = "";

  save();
};

// ================= HELPERS =================
function getAccumulatedInterest(inv) {
  if (!inv.monthlyInterests) return 0;
  return Object.values(inv.monthlyInterests)
    .reduce((sum, i) => sum + i.amount, 0);
}

// ================= RENDER =================
function renderTransactions() {
  const tbody = document.querySelector("#transaction-table tbody");
  tbody.innerHTML = transactions.map((t, i) => `
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
    </tr>
  `).join("");
}

function renderInvestments() {
  const tbody = document.querySelector("#investment-table tbody");
  tbody.innerHTML = investments.map((inv, i) => `
    <tr>
      <td>${inv.name}</td>
      <td>${inv.principal}</td>
      <td>${inv.interest}%</td>
      <td>${inv.currency}</td>
      <td>${getAccumulatedInterest(inv).toFixed(2)}</td>
      <td>
        <button onclick="investments.splice(${i},1);save()">❌</button>
      </td>
    </tr>
  `).join("");

  const select = document.getElementById("select-investment");
  select.innerHTML = `<option value="">-- Select Investment --</option>` +
    investments.map((i, idx) =>
      `<option value="${idx}">${i.name}</option>`
    ).join("");
}

function renderMonthlyInterests() {
  const tbody = document.querySelector("#interest-table tbody");
  tbody.innerHTML = "";

  investments.forEach(inv => {
    if (!inv.monthlyInterests) return;

    Object.entries(inv.monthlyInterests).forEach(([month, data]) => {
      tbody.innerHTML += `
        <tr>
          <td>${inv.name}</td>
          <td>${month}</td>
          <td>${data.paidDate}</td>
          <td>${data.amount.toFixed(2)} ${inv.currency}</td>
        </tr>
      `;
    });
  });
}

// ================= CHARTS =================
function renderCharts() {
  if (transactionsChart) transactionsChart.destroy();
  if (investmentsChart) investmentsChart.destroy();

  const income = transactions
    .filter(t => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  transactionsChart = new Chart(
    document.getElementById("transactionsChart"),
    {
      type: "doughnut",
      data: {
        labels: ["Income", "Expense"],
        datasets: [{
          data: [income, expense],
          backgroundColor: ["#4CAF50", "#F44336"]
        }]
      }
    }
  );

  investmentsChart = new Chart(
    document.getElementById("investmentsChart"),
    {
      type: "bar",
      data: {
        labels: investments.map(i => i.name),
        datasets: [{
          label: "Capital + Interests",
          data: investments.map(i => i.principal + getAccumulatedInterest(i)),
          backgroundColor: "#2196F3"
        }]
      }
    }
  );
}

// ================= SAVE =================
async function save() {
  renderTransactions();
  renderInvestments();
  renderMonthlyInterests();

  const user = auth.currentUser;
  if (user) {
    await setDoc(doc(db, "users", user.uid), { transactions, investments });
  }
}

// ================= INIT =================
document.getElementById("tab-transactions").click();
