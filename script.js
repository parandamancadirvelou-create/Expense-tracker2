import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= AUTH ================= */

const auth = window.auth;

// Elements AUTH
const authBox = document.getElementById("authBox");
const appBox = document.getElementById("appBox");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("login");
const registerBtn = document.getElementById("register");
const logoutBtn = document.getElementById("logout");

// Login
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
  } catch (e) {
    alert(e.message);
  }
});

// Register
registerBtn.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
  } catch (e) {
    alert(e.message);
  }
});

// Logout
logoutBtn.addEventListener("click", () => signOut(auth));

// Auth state
onAuthStateChanged(auth, user => {
  authBox.style.display = user ? "none" : "block";
  appBox.style.display = user ? "block" : "none";
});

/* ================= DATA ================= */

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let investments = JSON.parse(localStorage.getItem("investments")) || [];

/* ================= TABS ================= */

const tabTransactions = document.getElementById("tab-transactions");
const tabInvestments = document.getElementById("tab-investments");
const tabCharts = document.getElementById("tab-charts");

function showTab(tab) {
  document.querySelectorAll(".tab-content")
    .forEach(t => t.style.display = "none");

  document.getElementById(`${tab}-tab`).style.display = "block";

  document.querySelectorAll(".tabs button")
    .forEach(b => b.classList.remove("active"));

  document.getElementById(`tab-${tab}`).classList.add("active");
}

tabTransactions.onclick = () => showTab("transactions");
tabInvestments.onclick = () => showTab("investments");
tabCharts.onclick = () => showTab("charts");

/* ================= TRANSACTIONS ================= */

const transactionForm = document.getElementById("transaction-form");

transactionForm.addEventListener("submit", e => {
  e.preventDefault();

  transactions.push({
    name: document.getElementById("name").value,
    amount: +document.getElementById("amount").value,
    type: document.getElementById("type").value,
    category: document.getElementById("category").value,
    date: document.getElementById("date").value,
    currency: document.getElementById("currency").value
  });

  save();
  transactionForm.reset();
});

function renderTransactions() {
  const tbody = document.querySelector("#transaction-table tbody");
  tbody.innerHTML = "";

  transactions.forEach((t, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${t.name}</td>
        <td>${t.amount}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
        <td>${t.date}</td>
        <td>${t.currency}</td>
        <td><button onclick="delT(${i})">X</button></td>
      </tr>`;
  });
}

window.delT = i => {
  transactions.splice(i, 1);
  save();
};

/* ================= CSV ================= */

document
  .getElementById("export-csv-btn")
  .onclick = () => {
    let csv = "Name,Amount,Type,Category,Date,Currency\n";
    transactions.forEach(t => {
      csv += `${t.name},${t.amount},${t.type},${t.category},${t.date},${t.currency}\n`;
    });

    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "export.csv";
    a.click();
  };

/* ================= SAVE ================= */

function save() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
  localStorage.setItem("investments", JSON.stringify(investments));
  renderTransactions();
}

save();
showTab("transactions");
