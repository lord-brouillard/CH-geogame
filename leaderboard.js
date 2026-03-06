import { initializeApp, getApps, getApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs }
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
    const app = getApps().find(a => a.name === '[DEFAULT]') ?? initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch(e) {
    console.warn("Firebase non disponible", e);
}

const TOP_N = 10;

// ── Charge et affiche le classement TOTAL CUMULÉ ─────────────
export async function loadLeaderboardTotal(cantonFilter = 'Toute la Suisse') {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;

    container.innerHTML = `<div class="lb-loading">Chargement…</div>`;

    if (!db) {
        container.innerHTML = `<div class="lb-error">Firebase non configuré.</div>`;
        return;
    }

    try {
        const snapshot = await getDocs(collection(db, "scores"));

        if (snapshot.empty) {
            container.innerHTML = `<div class="lb-empty">Aucun score enregistré pour l'instant.</div>`;
            return;
        }

        // Somme de TOUS les scores par joueur (filtrés par canton si besoin)
        const totals = {};
        snapshot.forEach(doc => {
            const d      = doc.data();
            const canton = d.canton || 'Toute la Suisse';

            if (cantonFilter) {
                if (canton !== cantonFilter) return;
            }

            const key = d.pseudo.toLowerCase();
            if (!totals[key]) {
                totals[key] = { pseudo: d.pseudo, total: 0, parties: 0, lastDate: d.date };
            }
            totals[key].total   += d.score;
            totals[key].parties += 1;
            if (d.date > totals[key].lastDate) totals[key].lastDate = d.date;
        });

        const sorted = Object.values(totals)
            .sort((a, b) => b.total - a.total)
            .slice(0, TOP_N);

        if (!sorted.length) {
            container.innerHTML = `<div class="lb-empty">Aucun score pour ce canton.</div>`;
            return;
        }

        let html = '';
        sorted.forEach((d, i) => {
            const rank  = i + 1;
            const date  = d.lastDate ? new Date(d.lastDate).toLocaleDateString('fr-CH') : '—';
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            html += `
            <div class="lb-row ${rank <= 3 ? 'lb-top' : ''}" style="--rank:${rank}">
                <span class="lb-rank">${medal}</span>
                <span class="lb-pseudo">${escapeHtml(d.pseudo)} <small style="font-weight:400;color:#aaa;">(${d.parties} partie${d.parties > 1 ? 's' : ''})</small></span>
                <span class="lb-score">${d.total} pts</span>
                <span class="lb-date">${date}</span>
            </div>`;
        });
        container.innerHTML = html;

    } catch (err) {
        console.error('Erreur Firestore :', err);
        container.innerHTML = `<div class="lb-error">Impossible de charger le classement.</div>`;
    }
}

// ── Charge et affiche le classement filtré par canton ─────────
export async function loadLeaderboard(cantonFilter = 'Toute la Suisse') {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;

    container.innerHTML = `<div class="lb-loading">Chargement…</div>`;

    if (!db) {
        container.innerHTML = `<div class="lb-error">Firebase non configuré.</div>`;
        return;
    }

    try {
        const snapshot = await getDocs(collection(db, "scores"));

        if (snapshot.empty) {
            container.innerHTML = `<div class="lb-empty">Aucun score enregistré pour l'instant.</div>`;
            return;
        }

        // 🔵 Filtre par canton :
        // - Aucun filtre → meilleur score global par joueur (toutes catégories)
        // - Canton sélectionné → uniquement les scores joués sur CE canton
        const best = {};
        snapshot.forEach(doc => {
            const d      = doc.data();
            const canton = d.canton || 'Toute la Suisse';

            if (cantonFilter) {
                // Filtre strict : seulement ce canton
                if (canton !== cantonFilter) return;
            }

            const key = d.pseudo.toLowerCase();
            if (!best[key] || d.score > best[key].score) {
                best[key] = { pseudo: d.pseudo, score: d.score, date: d.date };
            }
        });

        const sorted = Object.values(best)
            .sort((a, b) => b.score - a.score)
            .slice(0, TOP_N);

        if (!sorted.length) {
            container.innerHTML = `<div class="lb-empty">Aucun score pour ce canton.</div>`;
            return;
        }

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

// ── Sauvegarde un score avec le canton ────────────────────────
export async function saveScore(pseudo, score, canton = 'Toute la Suisse') {
    if (!db) return;
    try {
        await addDoc(collection(db, "scores"), {
            pseudo, score, canton, date: new Date().toISOString()
        });
        console.log("Score sauvegardé ✅");
    } catch(e) {
        console.warn("Erreur sauvegarde :", e);
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => loadLeaderboard('Toute la Suisse'));
