// ============================================================
//  firebase-config.js  —  Configuration partagée Firebase
//  ⚠️  Remplace les valeurs ci-dessous par ta config Firebase
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey:            "REMPLACE_PAR_TA_CLE",
    authDomain:        "REMPLACE_PAR_TON_AUTH_DOMAIN",
    projectId:         "REMPLACE_PAR_TON_PROJECT_ID",
    storageBucket:     "REMPLACE_PAR_TON_STORAGE_BUCKET",
    messagingSenderId: "REMPLACE_PAR_TON_SENDER_ID",
    appId:             "REMPLACE_PAR_TON_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

export { app, db };
