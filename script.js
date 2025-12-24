// ================== FIREBASE AUTH ==================
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = window.auth;

// ================== SELECTEURS AUTH ==================
const authBox = document.getElementById("authBox");
const appBox = document.getElementById("appBox");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

document.getElementById("login").onclick = async () => {
  if (!emailInput.value || !passwordInput.value) return alert("Champs requis");
  await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
};

document.getElementById("register").onclick = async () => {
  if (!emailInput.value || !passwordInput.value) return alert("Champs requis");
  await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
};

document.getElementById("logout").onclick = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  authBox.style.display = user ? "none" : "block";
  appBox.style.display = user ? "block" : "none";
});

// ================== DATA ==================
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let investments = JSON.parse(localStorage.getItem("investments")) || [];
let selectedCurrency = "USD";

// ================== ONGLET ==================
const tabs = {
  transactions: document.getElementById("transactions-tab"),
  investments: document.getElementById("investments-tab"),
  charts: document.getElementById("charts-tab")
};

function showTab(tab) {
  Object.values(tabs).forEach(t => t.style.display = "none");
  tabs[tab].style.display = "block";
  document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
}

document.getElementById("tab-transactions").onclick = () => showTab("transactions");
document.getElementById("tab-investments").onclick = () => showTab("investments");
document.getElementById("tab-charts").onclick = () => showTab("charts");

// ================== TRANSACTIONS ==================
const transactionForm = document.getElementById("transaction-form");
const transactionTableBody = document.querySelector("#transaction-table tbody");

transactionForm.addEventListener("submit", e => {
  e.preventDefault();

  const transaction = {
    name: document.getElementById("name").value.trim(),
    amount: parseFloat(document.getElementById("amount").value),
    type: document.getElementById("type").value,
    category: document.getElementById("category").value,
    date: document.getElementById("date").value,
    currency: document.getElementById("currency").value
  };

  if (!transaction.name || transaction.amount <= 0) {
    return alert("Données invalides");
  }

  selectedCurrency = transaction.currency;
  transactions.push(transaction);
  saveData();
  transactionForm.reset();
});

function renderTransactions() {
  transactionTableBody.innerHTML = "";
  transactions.forEach((t, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.name}</td>
      <td>${t.amount.toFixed(2)}</td>
      <td>${t.type}</td>
      <td>${t.category}</td>
      <td>${t.date}</td>
      <td>${t.currency}</td>
      <td>
        <button onclick="editTransaction(${i})">Edit</button>
        <button onclick="deleteTransaction(${i})">Delete</button>
      </td>
    `;
    transactionTableBody.appendChild(row);
  });
}

window.deleteTransaction = i => {
  transactions.splice(i, 1);
  saveData();
};

window.editTransaction = i => {
  const t = transactions[i];
  document.getElementById("name").value = t.name;
  document.getElementById("amount").value = t.amount;
  document.getElementById("type").value = t.type;
  document.getElementById("category").value = t.category;
  document.getElementById("date").value = t.date;
  document.getElementById("currency").value = t.currency;
  transactions.splice(i, 1);
  saveData();
};

// ================== INVESTMENTS ==================
const investmentForm = document.getElementById("investment-form");
const investmentTableBody = document.querySelector("#investment-table tbody");
const selectInvestment = document.getElementById("select-investment");

investmentForm.addEventListener("submit", e => {
  e.preventDefault();

  const investment = {
    name: document.getElementById("inv-name").value.trim(),
    principal: parseFloat(document.getElementById("inv-amount").value),
    category: document.getElementById("inv-category").value,
    interestRate: parseFloat(document.getElementById("inv-interest").value),
    startDate: document.getElementById("inv-date").value,
    currency: document.getElementById("inv-currency").value
  };

  if (!investment.name || investment.principal <= 0) return alert("Erreur");

  investments.push(investment);
  saveData();
  investmentForm.reset();
});

function renderInvestments() {
  investmentTableBody.innerHTML = "";
  selectInvestment.innerHTML = "<option value=''>-- Select --</option>";

  investments.forEach((inv, i) => {
    const interest = calculateInterest(inv);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${inv.name}</td>
      <td>${inv.principal.toFixed(2)}</td>
      <td>${inv.interestRate}%</td>
      <td>${inv.currency}</td>
      <td>${inv.startDate}</td>
      <td>${interest.toFixed(2)}</td>
      <td><button onclick="deleteInvestment(${i})">Delete</button></td>
    `;
    investmentTableBody.appendChild(row);

    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = inv.name;
    selectInvestment.appendChild(opt);
  });
}

window.deleteInvestment = i => {
  investments.splice(i, 1);
  saveData();
};

function calculateInterest(inv) {
  const months =
    (new Date().getFullYear() - new Date(inv.startDate).getFullYear()) * 12;
  return inv.principal * inv.interestRate / 100 * Math.max(months, 0);
}

// ================== CSV EXPORT ==================
function exportCSV() {
  let csv = "Name,Amount,Type,Category,Date,Currency\n";
  transactions.forEach(t => {
    csv += `${t.name},${t.amount},${t.type},${t.category},${t.date},${t.currency}\n`;
  });

  const link = document.createElement("a");
  link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  link.download = "export.csv";
  link.click();
}

document.getElementById("export-csv-btn").onclick = exportCSV;
document.addEventListener("keydown", e => e.ctrlKey && e.key === "e" && exportCSV());

// ================== SAVE ==================
function saveData() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
  localStorage.setItem("investments", JSON.stringify(investments));
  renderTransactions();
  renderInvestments();
}

// ================== INIT ==================
renderTransactions();
renderInvestments();
showTab("transactions");
