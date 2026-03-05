import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch(e) {
    console.warn("Firebase non disponible", e);
}

const TOP_N = 10;

export async function loadLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;

    container.innerHTML = `<div class="lb-loading">Chargement…</div>`;

    if (!db) {
        container.innerHTML = `<div class="lb-error">Firebase non configuré.</div>`;
        return;
    }

    try {
        // Récupère tous les scores
        const snapshot = await getDocs(collection(db, "scores"));

        if (snapshot.empty) {
            container.innerHTML = `<div class="lb-empty">Aucun score enregistré pour l'instant.</div>`;
            return;
        }

        // 🔵 Garde uniquement le meilleur score par joueur
        const best = {};
        snapshot.forEach(doc => {
            const d = doc.data();
            const key = d.pseudo.toLowerCase(); // insensible à la casse
            if (!best[key] || d.score > best[key].score) {
                best[key] = { pseudo: d.pseudo, score: d.score, date: d.date };
            }
        });

        // Trie par score décroissant et prend le top N
        const sorted = Object.values(best)
            .sort((a, b) => b.score - a.score)
            .slice(0, TOP_N);

        let html = '';
        sorted.forEach((d, i) => {
            const rank  = i + 1;
            const date  = d.date ? new Date(d.date).toLocaleDateString('fr-CH') : '—';
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            html += `
            <div class="lb-row ${rank <= 3 ? 'lb-top' : ''}" style="--rank:${rank}">
                <span class="lb-rank">${medal}</span>
                <span class="lb-pseudo">${escapeHtml(d.pseudo)}</span>
                <span class="lb-score">${d.score} pts</span>
                <span class="lb-date">${date}</span>
            </div>`;
        });
        container.innerHTML = html;

    } catch (err) {
        console.error('Erreur Firestore :', err);
        container.innerHTML = `<div class="lb-error">Impossible de charger le classement.</div>`;
    }
}

export async function saveScore(pseudo, score) {
    if (!db) return;
    try {
        await addDoc(collection(db, "scores"), {
            pseudo, score, date: new Date().toISOString()
        });
    } catch(e) {
        console.warn("Erreur sauvegarde :", e);
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', loadLeaderboard);
