import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = window.auth;
const db = window.db;

let transactions = [];
let investments = [];

const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const loginBtn = document.getElementById("login");
const registerBtn = document.getElementById("register");
const logoutBtn = document.getElementById("logout");

const transactionForm = document.getElementById("transaction-form");
const tName = document.getElementById("name");
const tAmount = document.getElementById("amount");
const tType = document.getElementById("type");
const tCategory = document.getElementById("category");
const tDate = document.getElementById("date");
const tCurrency = document.getElementById("currency");
const tAnnotation = document.getElementById("annotation");

const investmentForm = document.getElementById("investment-form");
const iName = document.getElementById("inv-name");
const iAmount = document.getElementById("inv-amount");
const iInterest = document.getElementById("inv-interest");
const iStartDate = document.getElementById("inv-start-date");
const iCurrency = document.getElementById("inv-currency");
const iAnnotation = document.getElementById("inv-annotation");

const selectInvestment = document.getElementById("select-investment");
const interestMonth = document.getElementById("interest-month");
const interestPaidDate = document.getElementById("interest-paid-date");
const interestAmount = document.getElementById("interest-amount");
const interestAnnotation = document.getElementById("interest-annotation");
const addMonthlyInterestBtn = document.getElementById("add-monthly-interest");

let transactionsChart, investmentsChart;

// ===== AUTH =====
loginBtn.onclick = () => signInWithEmailAndPassword(auth, emailEl.value, passwordEl.value).catch(e => alert(e.message));
registerBtn.onclick = () => createUserWithEmailAndPassword(auth, emailEl.value, passwordEl.value).catch(e => alert(e.message));
logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, async user => {
    if (!user) {
        document.getElementById("authBox").style.display = "block";
        document.getElementById("appBox").style.display = "none";
        return;
    }
    document.getElementById("authBox").style.display = "none";
    document.getElementById("appBox").style.display = "block";

    const userDoc = doc(db, "users", user.uid);
    const snap = await getDoc(userDoc);
    if (snap.exists()) {
        const data = snap.data();
        transactions = data.transactions || [];
        investments = data.investments || [];

        // Initialisation sécurisée
        investments.forEach(inv => {
            if (!inv.annotation) inv.annotation = "";
            if (!inv.monthlyInterests) inv.monthlyInterests = {};
            for (const month in inv.monthlyInterests) {
                if (!inv.monthlyInterests[month].annotation) inv.monthlyInterests[month].annotation = "";
            }
        });

        renderTransactions();
        renderInvestments();
        renderMonthlyInterests();
        updateCharts();
    } else {
        await setDoc(userDoc, { transactions: [], investments: [] }, { merge: true });
    }
});

// ===== TABS =====
["transactions", "investments", "charts"].forEach(tab => {
    document.getElementById(`tab-${tab}`).onclick = () => {
        document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
        document.getElementById(`${tab}-tab`).style.display = "block";
        document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
        document.getElementById(`tab-${tab}`).classList.add("active");
        if (tab === "charts") requestAnimationFrame(() => updateCharts());
    };
});

// ===== TRANSACTIONS =====
transactionForm.onsubmit = e => {
    e.preventDefault();
    const idx = transactionForm.dataset.editIndex;
    const t = {
        name: tName.value,
        amount: parseFloat(tAmount.value),
        type: tType.value,
        category: tCategory.value,
        date: tDate.value,
        annotation: tAnnotation.value,
        currency: tCurrency.value
    };
    if (idx !== undefined) { transactions[idx] = t; delete transactionForm.dataset.editIndex; }
    else transactions.push(t);
    save(); transactionForm.reset();
};
window.editTransaction = i => {
    const t = transactions[i];
    tName.value = t.name; tAmount.value = t.amount; tType.value = t.type; tCategory.value = t.category;
    tDate.value = t.date; tAnnotation.value = t.annotation || ""; tCurrency.value = t.currency;
    transactionForm.dataset.editIndex = i;
};
window.delT = i => { transactions.splice(i, 1); save(); };

function renderTransactions() {
    const tbody = document.querySelector("#transaction-table tbody"); tbody.innerHTML = "";
    transactions.forEach((t, i) => {
        tbody.innerHTML += `<tr>
            <td>${t.name}</td><td>${t.amount}</td><td>${t.type}</td><td>${t.category}</td>
            <td>${t.date}</td><td>${t.annotation || ""}</td><td>${t.currency}</td>
            <td><button onclick="editTransaction(${i})">✏️</button> <button onclick="delT(${i})">❌</button></td>
        </tr>`;
    });
}

// ===== INVESTMENTS =====
investmentForm.onsubmit = e => {
    e.preventDefault();
    const idx = investmentForm.dataset.editIndex;
    if (idx !== undefined) {
        const inv = investments[idx];
        inv.name = iName.value; inv.principal = parseFloat(iAmount.value); inv.interest = parseFloat(iInterest.value);
        inv.startDate = iStartDate.value; inv.annotation = iAnnotation.value; inv.currency = iCurrency.value;
        if (!inv.monthlyInterests) inv.monthlyInterests = {};
        delete investmentForm.dataset.editIndex;
    } else {
        investments.push({
            name: iName.value,
            principal: parseFloat(iAmount.value),
            interest: parseFloat(iInterest.value),
            startDate: iStartDate.value,
            annotation: iAnnotation.value,
            currency: iCurrency.value,
            monthlyInterests: {}
        });
    }
    save(); investmentForm.reset();
};
window.editInvestment = i => {
    const inv = investments[i];
    iName.value = inv.name; iAmount.value = inv.principal; iInterest.value = inv.interest;
    iStartDate.value = inv.startDate || ""; iAnnotation.value = inv.annotation || ""; iCurrency.value = inv.currency;
    investmentForm.dataset.editIndex = i;
};
window.deleteInvestment = i => { investments.splice(i, 1); save(); };

function renderInvestments() {
    const tbody = document.querySelector("#investment-table tbody"); tbody.innerHTML = "";
    investments.forEach((inv, i) => {
        const accumulated = Object.values(inv.monthlyInterests || {}).reduce((a, b) => a + b.amount, 0).toFixed(2);
        tbody.innerHTML += `<tr>
            <td>${inv.name}</td><td>${inv.principal}</td><td>${inv.interest}%</td><td>${inv.startDate || ""}</td>
            <td>${inv.annotation || ""}</td><td>${inv.currency}</td><td>${accumulated}</td>
            <td><button onclick="editInvestment(${i})">✏️</button> <button onclick="deleteInvestment(${i})">❌</button></td>
        </tr>`;
    });
    updateInvestmentSelect();
}

// ===== MONTHLY INTEREST =====
addMonthlyInterestBtn.onclick = () => {
    const idx = selectInvestment.value; if (idx === "") return alert("Sélectionnez un investissement");
    const month = interestMonth.value; const paidDate = interestPaidDate.value;
    if (!month || !paidDate) return alert("Mois et date requis");
    const inv = investments[idx]; const amt = parseFloat(interestAmount.value) || inv.principal * inv.interest / 100;
    const annot = interestAnnotation.value || "";
    inv.monthlyInterests[month] = { amount: amt, paidDate, annotation: annot };
    interestMonth.value = ""; interestPaidDate.value = ""; interestAmount.value = ""; interestAnnotation.value = "";
    save();
};
window.editInterest = (invIdx, month) => {
    const data = investments[invIdx].monthlyInterests[month];
    selectInvestment.value = invIdx; interestMonth.value = month; interestPaidDate.value = data.paidDate;
    interestAmount.value = data.amount; interestAnnotation.value = data.annotation || "";
};
window.deleteInterest = (invIdx, month) => { delete investments[invIdx].monthlyInterests[month]; save(); };

function renderMonthlyInterests() {
    const tbody = document.querySelector("#interest-table tbody"); tbody.innerHTML = "";
    investments.forEach((inv, i) => Object.entries(inv.monthlyInterests || {}).forEach(([month, data]) => {
        tbody.innerHTML += `<tr>
            <td>${inv.name}</td><td>${month}</td><td>${data.paidDate}</td>
            <td>${data.amount.toFixed(2)} ${inv.currency}</td><td>${data.annotation || ""}</td>
            <td><button onclick="editInterest(${i},'${month}')">✏️</button> <button onclick="deleteInterest(${i},'${month}')">❌</button></td>
        </tr>`;
    }));
}

function updateInvestmentSelect() {
    selectInvestment.innerHTML = '<option value="">-- Sélectionner investissement --</option>';
    investments.forEach((inv, i) => { selectInvestment.innerHTML += `<option value="${i}">${inv.name}</option>`; });
}

// ===== CHARTS =====
function calculateAccumulatedInterest(inv) { return Object.values(inv.monthlyInterests || {}).reduce((sum, m) => sum + m.amount, 0); }

function renderTransactionsChart() {
    if (transactionsChart) transactionsChart.destroy();
    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const ctx = document.getElementById("transactionsChart").getContext("2d");
    transactionsChart = new Chart(ctx, { type: "doughnut", data: { labels: ["Income", "Expense"], datasets: [{ data: [income, expense], backgroundColor: ["#4CAF50", "#F44336"] }] }, options: { responsive: true, maintainAspectRatio: false } });
}

function renderInvestmentsChart() {
    if (investmentsChart) investmentsChart.destroy();
    const ctx = document.getElementById("investmentsChart").getContext("2d");
    investmentsChart = new Chart(ctx, {
        type: "bar",
        data: { labels: investments.map(i => i.name), datasets: [{ label: "Capital + Intérêts", data: investments.map(i => i.principal + calculateAccumulatedInterest(i)), backgroundColor: "#2196F3" }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function updateCharts() { renderTransactionsChart(); renderInvestmentsChart(); }

// ===== SAVE =====
async function save() {
    renderTransactions(); renderInvestments(); renderMonthlyInterests(); updateCharts();
    const user = auth.currentUser;
    if (user) await setDoc(doc(db, user.uid), { transactions, investments }, { merge: true });
}

// ===== INIT =====
document.getElementById("tab-transactions").click();
