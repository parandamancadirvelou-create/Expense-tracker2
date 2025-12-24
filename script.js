import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Références aux éléments HTML
const authBox = document.getElementById("authBox");
const appBox = document.getElementById("appBox");

const loginBtn = document.getElementById("login");
const registerBtn = document.getElementById("register");
const logoutBtn = document.getElementById("logout");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const transactionForm = document.getElementById("transaction-form");
const transactionsTbody = document.getElementById("transactions");

const auth = window.auth;
const db = window.db;

// LOGIN
loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch(e) { alert(e.message); }
};

// REGISTER
registerBtn.onclick = async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch(e) { alert(e.message); }
};

// LOGOUT
logoutBtn.onclick = async () => {
  await signOut(auth);
};

// SURVEILLER L'ÉTAT AUTH
onAuthStateChanged(auth, user => {
  if(user){
    authBox.style.display = "none";
    appBox.style.display = "block";
    loadTransactions(user.uid);
  } else {
    authBox.style.display = "block";
    appBox.style.display = "none";
  }
});

// AJOUTER TRANSACTION
transactionForm.addEventListener("submit", async e => {
  e.preventDefault();
  const user = auth.currentUser;
  if(!user) return;

  await addDoc(collection(db, "users", user.uid, "transactions"), {
    name: document.getElementById("name").value,
    amount: document.getElementById("amount").value,
    type: document.getElementById("type").value,
    date: document.getElementById("date").value
  });

  e.target.reset();
  loadTransactions(user.uid);
});

// CHARGER LES TRANSACTIONS
async function loadTransactions(uid){
  transactionsTbody.innerHTML = "";
  const snapshot = await getDocs(collection(db, "users", uid, "transactions"));
  snapshot.forEach(docSnap => {
    const t = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.name}</td>
      <td>${t.amount}</td>
      <td>${t.type}</td>
      <td>${t.date}</td>
      <td><button onclick="deleteTransaction('${docSnap.id}')">❌</button></td>
    `;
    transactionsTbody.appendChild(tr);
  });
}

// SUPPRIMER TRANSACTION
window.deleteTransaction = async id => {
  const user = auth.currentUser;
  if(!user) return;
  await deleteDoc(doc(db, "users", user.uid, "transactions", id));
  loadTransactions(user.uid);
};
