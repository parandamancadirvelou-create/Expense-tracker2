import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===== INIT FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyChlTQgk-BvdNf8jRskBY-kos_kCeQIWW0",
  authDomain: "expense-traker-247d1.firebaseapp.com",
  projectId: "expense-traker-247d1",
  storageBucket: "expense-traker-247d1.appspot.com",
  messagingSenderId: "1083688124128",
  appId: "1:1083688124128:web:4e5c5c0313c5c8fe3cda85",
  measurementId: "G-W0XV7P2X2H"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
window.auth = auth;
window.db = db;

// ===== VARIABLES =====
let transactions = [];
let investments = [];

// ===== ELEMENTS =====
const authBox = document.getElementById("authBox");
const appBox = document.getElementById("appBox");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const loginBtn = document.getElementById("login");
const registerBtn = document.getElementById("register");
const logoutBtn = document.getElementById("logout");

// Transactions
const transactionForm = document.getElementById("transaction-form");
const tName = document.getElementById("name");
const tAmount = document.getElementById("amount");
const tType = document.getElementById("type");
const tCategory = document.getElementById("category");
const tDate = document.getElementById("date");
const tCurrency = document.getElementById("currency");
const tAnnotation = document.getElementById("annotation");

// Investments
const investmentForm = document.getElementById("investment-form");
const iName = document.getElementById("inv-name");
const iAmount = document.getElementById("inv-amount");
const iInterest = document.getElementById("inv-interest");
const iStartDate = document.getElementById("inv-start-date");
const iCurrency = document.getElementById("inv-currency");
const iAnnotation = document.getElementById("inv-annotation");

// Monthly interests
const selectInvestment = document.getElementById("select-investment");
const interestMonth = document.getElementById("interest-month");
const interestPaidDate = document.getElementById("interest-paid-date");
const interestAmount = document.getElementById("interest-amount");
const interestAnnotation = document.getElementById("interest-annotation");
const addMonthlyInterestBtn = document.getElementById("add-monthly-interest");

// ===== AUTH HANDLERS =====
loginBtn.onclick = ()=>signInWithEmailAndPassword(auth,emailEl.value,passwordEl.value).catch(e=>alert(e.message));
registerBtn.onclick = ()=>createUserWithEmailAndPassword(auth,emailEl.value,passwordEl.value).catch(e=>alert(e.message));
logoutBtn.onclick = ()=>signOut(auth);

onAuthStateChanged(auth, async user => {
    if(!user){
        authBox.style.display="block";
        appBox.style.display="none";
        return;
    }
    authBox.style.display="none";
    appBox.style.display="block";

    const userDoc = doc(db,"users",user.uid);
    const snap = await getDoc(userDoc);
    if(snap.exists()){
        const data = snap.data();
        transactions = data.transactions||[];
        investments = data.investments||[];
        investments.forEach(inv=>{
            if(!inv.annotation) inv.annotation="";
            if(!inv.monthlyInterests) inv.monthlyInterests={};
            Object.values(inv.monthlyInterests).forEach(mi=>{
                if(!mi.annotation) mi.annotation="";
            });
        });
    } else {
        await setDoc(userDoc,{transactions:[],investments:[]});
    }
    save();
});

// ===== TABS =====
["transactions","investments","charts"].forEach(tab=>{
    document.getElementById(`tab-${tab}`).onclick=()=>{
        document.querySelectorAll(".tab-content").forEach(t=>t.style.display="none");
        document.getElementById(`${tab}-tab`).style.display="block";
    };
});

// ===== RENDER & SAVE FUNCTIONS =====
function renderTransactions(){
    const tbody = document.querySelector("#transaction-table tbody"); tbody.innerHTML="";
    transactions.forEach((t,i)=>{
        tbody.innerHTML+=`<tr>
            <td>${t.name}</td>
            <td>${t.amount}</td>
            <td>${t.type}</td>
            <td>${t.category}</td>
            <td>${t.date}</td>
            <td>${t.annotation||""}</td>
            <td>${t.currency}</td>
            <td><button onclick="editTransaction(${i})">✏️</button> <button onclick="delT(${i})">❌</button></td>
        </tr>`;
    });
}

function renderInvestments(){
    const tbody=document.querySelector("#investment-table tbody"); tbody.innerHTML="";
    investments.forEach((inv,i)=>{
        const accumulated=Object.values(inv.monthlyInterests||{}).reduce((a,b)=>a+b.amount,0).toFixed(2);
        tbody.innerHTML+=`<tr>
            <td>${inv.name}</td>
            <td>${inv.principal}</td>
            <td>${inv.interest}%</td>
            <td>${inv.startDate||""}</td>
            <td>${inv.annotation||""}</td>
            <td>${inv.currency}</td>
            <td>${accumulated}</td>
            <td><button onclick="editInvestment(${i})">✏️</button> <button onclick="deleteInvestment(${i})">❌</button></td>
        </tr>`;
    });
    updateInvestmentSelect();
}

function renderMonthlyInterests(){
    const tbody=document.querySelector("#interest-table tbody"); tbody.innerHTML="";
    investments.forEach((inv,i)=>{
        if(!inv.monthlyInterests) inv.monthlyInterests={};
        Object.entries(inv.monthlyInterests).forEach(([month,data])=>{
            if(!data.annotation) data.annotation="";
            tbody.innerHTML+=`<tr>
                <td>${inv.name}</td>
                <td>${month}</td>
                <td>${data.paidDate}</td>
                <td>${data.amount.toFixed(2)} ${inv.currency}</td>
                <td>${data.annotation}</td>
                <td>
                    <button onclick="editInterest(${i},'${month}')">✏️</button>
                    <button onclick="deleteInterest(${i},'${month}')">❌</button>
                </td>
            </tr>`;
        });
    });
}

function updateInvestmentSelect(){
    selectInvestment.innerHTML=`<option value="">-- Sélectionner investissement --</option>`;
    investments.forEach((inv,i)=>{
        const opt=document.createElement("option"); opt.value=i; opt.textContent=inv.name;
        selectInvestment.appendChild(opt);
    });
}

async function save(){
    renderTransactions(); renderInvestments(); renderMonthlyInterests();
    const user=auth.currentUser;
    if(user) await setDoc(doc(db,"users",user.uid),{transactions,investments});
}

// ===== TRANSACTIONS EVENTS =====
transactionForm.onsubmit=e=>{
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
    if(idx!==undefined){ transactions[idx]=t; delete transactionForm.dataset.editIndex; } 
    else transactions.push(t);
    save(); transactionForm.reset();
};
window.editTransaction=i=>{
    const t=transactions[i];
    tName.value=t.name; tAmount.value=t.amount; tType.value=t.type; tCategory.value=t.category;
    tDate.value=t.date; tAnnotation.value=t.annotation||""; tCurrency.value=t.currency;
    transactionForm.dataset.editIndex=i;
};
window.delT=i=>{ transactions.splice(i,1); save(); };

// ===== INVESTMENTS EVENTS =====
investmentForm.onsubmit=e=>{
    e.preventDefault();
    const idx=investmentForm.dataset.editIndex;
    if(idx!==undefined){
        const inv=investments[idx];
        inv.name=iName.value; inv.principal=parseFloat(iAmount.value); inv.interest=parseFloat(iInterest.value);
        inv.startDate=iStartDate.value; inv.annotation=iAnnotation.value; inv.currency=iCurrency.value;
        if(!inv.monthlyInterests) inv.monthlyInterests={};
        delete investmentForm.dataset.editIndex;
    } else {
        investments.push({
            name:iName.value,
            principal:parseFloat(iAmount.value),
            interest:parseFloat(iInterest.value),
            startDate:iStartDate.value,
            annotation:iAnnotation.value,
            currency:iCurrency.value,
            monthlyInterests:{}
        });
    }
    save(); investmentForm.reset();
};
window.editInvestment=i=>{
    const inv=investments[i];
    iName.value=inv.name; iAmount.value=inv.principal; iInterest.value=inv.interest;
    iStartDate.value=inv.startDate||""; iAnnotation.value=inv.annotation||""; iCurrency.value=inv.currency;
    investmentForm.dataset.editIndex=i;
};
window.deleteInvestment=i=>{ investments.splice(i,1); save(); };

// ===== MONTHLY INTERESTS EVENTS =====
addMonthlyInterestBtn.onclick=()=>{
    const idx=selectInvestment.value; if(idx==="") return alert("Sélectionnez un investissement");
    const month=interestMonth.value; const paidDate=interestPaidDate.value;
    if(!month||!paidDate) return alert("Mois et date requis");
    const inv=investments[idx];
    const amt=parseFloat(interestAmount.value)||inv.principal*inv.interest/100;
    const annot=interestAnnotation.value||"";
    if(!inv.monthlyInterests) inv.monthlyInterests={};
    inv.monthlyInterests[month]={amount:amt, paidDate, annotation:annot};
    interestMonth.value=""; interestPaidDate.value=""; interestAmount.value=""; interestAnnotation.value="";
    save();
};
window.editInterest=(invIdx,month)=>{
    const data=investments[invIdx].monthlyInterests[month];
    selectInvestment.value=invIdx; interestMonth.value=month; interestPaidDate.value=data.paidDate;
    interestAmount.value=data.amount; interestAnnotation.value=data.annotation||"";
};
window.deleteInterest=(invIdx,month)=>{ delete investments[invIdx].monthlyInterests[month]; save(); };

// ===== EXPORT CSV =====
document.getElementById("export-csv-btn").onclick=()=>{
    let csv="Nom,Montant,Type,Catégorie,Date,Annotation,Devise\n";
    transactions.forEach(t=>{ csv+=`${t.name},${t.amount},${t.type},${t.category},${t.date},${t.annotation||""},${t.currency}\n`; });
    const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download="transactions.csv"; a.click();
};

// ===== INIT =====
document.getElementById("tab-transactions").click();
updateInvestmentSelect();
