// ── tracker.js — Temps passé sur le site par utilisateur ─────
import { initializeApp }                              from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey:            "AIzaSyCj8F4ABo02jZDbE0VmOr62RgmRhYTi1XE",
    authDomain:        "ch-geogame.firebaseapp.com",
    projectId:         "ch-geogame",
    storageBucket:     "ch-geogame.firebasestorage.app",
    messagingSenderId: "173593614352",
    appId:             "1:173593614352:web:7e4109bab775d6d7f31295"
};

let db = null;
try {
    const app = initializeApp(firebaseConfig, "tracker");
    db = getFirestore(app);
} catch(e) {
    console.warn("Tracker Firebase non disponible", e);
}

let sessionStart = Date.now();
let lastFlush    = Date.now();
const FLUSH_INTERVAL = 30_000; // flush toutes les 30s

// ── Sauvegarde X secondes dans Firebase pour ce pseudo ───────
async function flushTime() {
    const pseudo = localStorage.getItem("pseudo");
    if (!pseudo || !db) return;

    const now     = Date.now();
    const elapsed = Math.round((now - lastFlush) / 1000); // secondes depuis dernier flush
    if (elapsed <= 0) return;
    lastFlush = now;

    try {
        const key = pseudo.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
        const ref = doc(db, "playtime", key);
        await setDoc(ref, {
            pseudo:  pseudo,
            seconds: increment(elapsed)
        }, { merge: true });
    } catch(e) {
        console.warn("Tracker flush error:", e);
    }
}

// ── Flush périodique ──────────────────────────────────────────
setInterval(flushTime, FLUSH_INTERVAL);

// ── Flush à la fermeture / changement de page ─────────────────
window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushTime();
});
window.addEventListener("beforeunload", () => flushTime());

// ── Charge le temps total d'un joueur (en secondes) ──────────
export async function getPlaytime(pseudo) {
    if (!db) return 0;
    try {
        const key = pseudo.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
        const ref = doc(db, "playtime", key);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data().seconds || 0) : 0;
    } catch(e) {
        return 0;
    }
}

// ── Charge tous les temps (pour le classement) ───────────────
export async function getAllPlaytimes() {
    if (!db) return [];
    try {
        const { getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        const snap = await getDocs(collection(db, "playtime"));
        const result = [];
        snap.forEach(d => result.push(d.data()));
        return result.sort((a, b) => b.seconds - a.seconds);
    } catch(e) {
        console.warn("getAllPlaytimes error:", e);
        return [];
    }
}

// ── Formate les secondes en 1h 23m 45s ───────────────────────
export function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
    if (m > 0) return `${m}m ${String(s).padStart(2,'0')}s`;
    return `${s}s`;
}
