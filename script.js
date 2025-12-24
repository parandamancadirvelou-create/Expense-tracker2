import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Sélecteurs
const authBox = document.getElementById("authBox");
const appBox = document.getElementById("appBox");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("login");
const registerBtn = document.getElementById("register");
const logoutBtn = document.getElementById("logout");

// LOGIN
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) return alert("Veuillez remplir email et mot de passe");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Connexion réussie !");
    authBox.style.display = "none";
    appBox.style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Erreur de connexion : " + err.message);
  }
});

// REGISTER
registerBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) return alert("Veuillez remplir email et mot de passe");

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Compte créé avec succès !");
    authBox.style.display = "none";
    appBox.style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Erreur d'inscription : " + err.message);
  }
});

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    authBox.style.display = "block";
    appBox.style.display = "none";
  } catch (err) {
    console.error(err);
    alert("Erreur de déconnexion : " + err.message);
  }
});

// Garder la session active
auth.onAuthStateChanged(user => {
  if (user) {
    authBox.style.display = "none";
    appBox.style.display = "block";
  } else {
    authBox.style.display = "block";
    appBox.style.display = "none";
  }
});
