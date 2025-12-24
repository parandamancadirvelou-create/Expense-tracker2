import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= INIT FIRESTORE ================= */

const auth = window.auth;
const db = window.db;

/* ================= AUTH ================= */

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
    const userCred = await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    console.log("Connecté :", userCred.user.email);
  } catch (e) {
    alert(e.message);
  }
});

// Register
registerBtn.addEventListener("click", async () => {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    console.log("Compte créé :", userCred.user.email);
  } catch (e) {
    alert(e.message);
  }
});

// Logout
logoutBtn.addEventListener("click", () => signOut(auth));

// AuthState + charger les données Firestore
let transactions = [];
let investments = [];

onAuthStateChanged(auth, async user => {
  if (user) {
    authBox.style.display = "none";
    appBox.style.display = "block";

    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      transactions = data.transactions || [];
      investments = data.investments || [];
    } else {
      await setDoc(userDocRef, { transactions: [], investments: [] });
      transactions = [];
      investments = [];
    }

    save();
  } else {
    authBox.style.display = "block";
    appBox.style.display = "none";
  }
});

/* ================= TABS ================= */

const tabTransactions = document.getElementById("tab-transactions");
const tabInvestments = document.getElementById("tab-investments");
const tabCharts = document.getElementById("tab-charts");

function showTab(tab) {
  document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
  document.getElementById(`${tab}-tab`).style.display = "block";
  document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
}

tabTransactions.onclick = () => showTab("transactions");
tabInvestments.onclick = () => showTab("investments");
tabCharts.onclick = () => showTab("charts");

/* ================= TRANSACTIONS ================= */

const transactionForm = document.getElementById("transaction-form");
const nameInput = document.getElementById("name");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const currencyInput = document.getElementById("currency");

transactionForm.addEventListener("submit", e => {
  e.preventDefault();

  transactions.push({
    name: nameInput.value,
    amount: +amountInput.value,
    type: typeInput.value,
    category: categoryInput.value,
    date: dateInput.value,
    currency: currencyInput.value
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

/* ================= INVESTMENTS ================= */

const investmentForm = document.getElementById("investment-form");
const invNameInput = document.getElementById("inv-name");
const invAmountInput = document.getElementById("inv-amount");
const invInterestInput = document.getElementById("inv-interest");
const invDateInput = document.getElementById("inv-date");
const invCurrencyInput = document.getElementById("inv-currency");

investmentForm.addEventListener("submit", e => {
  e.preventDefault();

  investments.push({
    name: invNameInput.value,
    principal: +invAmountInput.value,
    interest: +invInterestInput.value,
    date: invDateInput.value,
    currency: invCurrencyInput.value
  });

  save();
  investmentForm.reset();
});

function renderInvestments() {
  const tbody = document.querySelector("#investment-table tbody");
  tbody.innerHTML = "";
  investments.forEach((i, x) => {
    tbody.innerHTML += `
      <tr>
        <td>${i.name}</td>
        <td>${i.principal}</td>
        <td>${i.interest}%</td>
        <td>${i.currency}</td>
        <td>${i.date}</td>
        <td>${(i.principal * i.interest / 100).toFixed(2)}</td>
        <td><button onclick="delI(${x})">X</button></td>
      </tr>`;
  });
}

window.delI = x => {
  investments.splice(x, 1);
  save();
};

/* ================= CSV ================= */

const exportCsvBtn = document.getElementById("export-csv-btn");
exportCsvBtn.onclick = () => {
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

async function save() {
  renderTransactions();
  renderInvestments();

  const user = auth.currentUser;
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, { transactions, investments });
  } else {
    // fallback localStorage si pas connecté
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("investments", JSON.stringify(investments));
  }
}

/* ================= INIT ================= */

showTab("transactions");
