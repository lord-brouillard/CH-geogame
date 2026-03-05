// ============================================================
//  leaderboard.js  —  Chargement et affichage du classement
// ============================================================

import { db } from './firebase-config.js';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const TOP_N = 10; // Nombre de joueurs affichés

// ── Charge et affiche le classement ──────────────────────────
export async function loadLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;

    container.innerHTML = `<div class="lb-loading">Chargement…</div>`;

    try {
        const q = query(
            collection(db, "scores"),
            orderBy("score", "desc"),
            limit(TOP_N)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            container.innerHTML = `<div class="lb-empty">Aucun score enregistré pour l'instant.</div>`;
            return;
        }

        let html = '';
        let rank  = 1;

        snapshot.forEach(doc => {
            const d    = doc.data();
            const date = d.date ? new Date(d.date).toLocaleDateString('fr-CH') : '—';
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

            html += `
            <div class="lb-row ${rank <= 3 ? 'lb-top' : ''}" style="--rank:${rank}">
                <span class="lb-rank">${medal}</span>
                <span class="lb-pseudo">${escapeHtml(d.pseudo)}</span>
                <span class="lb-score">${d.score} pts</span>
                <span class="lb-date">${date}</span>
            </div>`;
            rank++;
        });

        container.innerHTML = html;

    } catch (err) {
        console.error('Erreur Firestore :', err);
        container.innerHTML = `<div class="lb-error">Impossible de charger le classement.</div>`;
    }
}

// ── Sauvegarde un score (appelé depuis map_game.js) ───────────
export async function saveScore(pseudo, score) {
    try {
        await addDoc(collection(db, "scores"), {
            pseudo: pseudo,
            score:  score,
            date:   new Date().toISOString()
        });
        console.log('Score sauvegardé ✅');
    } catch (err) {
        console.error('Erreur sauvegarde score :', err);
    }
}

// ── Utilitaire XSS ───────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Chargement automatique si on est sur la page classement ──
document.addEventListener('DOMContentLoaded', loadLeaderboard);
