// ── Firebase ─────────────────────────────────────────────────
import { initializeApp }                    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import './tracker.js';

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

async function saveScore(pseudo, score) {
    if (!db) return;
    try {
        await addDoc(collection(db, "scores"), {
            pseudo, score, canton: "Cantons Suisse", date: new Date().toISOString()
        });
        console.log("Score sauvegardé ✅");
    } catch(e) {
        console.warn("Erreur sauvegarde :", e);
    }
}

// ── État du jeu ───────────────────────────────────────────────
let allFeatures   = [];
let correctFeature = null;
let blinkInterval  = null;

let score    = 0;
let attempts = 0;
const maxAttempts = 10;
let gameActive = true;
let hasClicked = false;
let currentAttemptsLog = [];

let bestScore = localStorage.getItem("bestScoreCantons")
    ? parseInt(localStorage.getItem("bestScoreCantons"))
    : 0;

let pseudo = localStorage.getItem("pseudo") || "";

// ── Carte ─────────────────────────────────────────────────────
const map = L.map('map', { zoomControl: false, attributionControl: false });
L.control.zoom({ position: 'topright' }).addTo(map);

// ── Distance ─────────────────────────────────────────────────
function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2)**2 +
        Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
        Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Chargement GeoJSON ────────────────────────────────────────
function startGame() {
    fetch('./data/GeoJSON_cantons.geojson')
        .then(r => r.json())
        .then(geojson => {

            window.layer = L.geoJSON(geojson, {
                style: { color: '#000', weight: 1, fillOpacity: 0.2 },

                onEachFeature: (feature, lyr) => {
                    allFeatures.push(lyr);

                    lyr.on('mouseover', () => {
                        if (!gameActive) return;
                        lyr.setStyle({ weight: 3, color: 'blue' });
                    });

                    lyr.on('mouseout', () => {
                        if (!gameActive) return;
                        lyr.setStyle({ weight: 1, color: '#000' });
                    });

                    lyr.on('click', () => {
                        if (!gameActive) return;
                        if (!correctFeature) return;
                        if (hasClicked) return;
                        hasClicked = true;

                        document.getElementById('new').disabled = false;

                        allFeatures.forEach(f => f.setStyle({ fillColor: '', fillOpacity: 0.2 }));

                        if (blinkInterval) {
                            clearInterval(blinkInterval);
                            blinkInterval = null;
                            correctFeature.setStyle({ fillColor: '', fillOpacity: 0.2 });
                        }

                        lyr.setStyle({ fillColor: 'orange', fillOpacity: 0.7 });

                        const c1 = lyr.getBounds().getCenter();
                        const c2 = correctFeature.getBounds().getCenter();
                        const d  = distanceKm(c1.lat, c1.lng, c2.lat, c2.lng);

                        const dist = Math.round(d);
                        const pts  = Math.max(0, 100 - dist);

                        score += pts;
                        attempts++;

                        currentAttemptsLog.push({
                            attempt: attempts,
                            distance: d.toFixed(2),
                            points: pts,
                            total: score
                        });

                        document.getElementById('info').innerHTML +=
                            `<div style="margin-bottom:10px;">
                                <b>Essai ${attempts}/${maxAttempts}</b><br>
                                Distance : <b>${d.toFixed(2)} km</b><br>
                                Points gagnés : <b>${pts}</b><br>
                                Score total : <b>${score}</b>
                             </div><hr>`;

                        if (dist === 0) {
                            lyr.setStyle({ fillColor: 'green', fillOpacity: 0.9 });
                        } else {
                            let visible = true;
                            blinkInterval = setInterval(() => {
                                correctFeature.setStyle({
                                    fillColor: visible ? 'red' : '',
                                    fillOpacity: visible ? 0.7 : 0.2
                                });
                                visible = !visible;
                            }, 500);
                        }

                        if (attempts >= maxAttempts) {
                            endGame();
                            return;
                        }
                    });
                }
            }).addTo(map);

            map.fitBounds(window.layer.getBounds());
            document.getElementById('best').innerHTML = `Meilleur score : <b>${bestScore}</b>`;
            pickNewCanton();
        });
}

// ── Nouveau canton ────────────────────────────────────────────
function pickNewCanton() {
    if (blinkInterval) { clearInterval(blinkInterval); blinkInterval = null; }

    allFeatures.forEach(f => f.setStyle({ fillColor: '', fillOpacity: 0.2 }));

    if (!allFeatures.length) {
        document.getElementById('target').innerHTML = "Aucun canton disponible.";
        gameActive = false;
        return;
    }

    correctFeature = allFeatures[Math.floor(Math.random() * allFeatures.length)];
    const p = correctFeature.feature.properties;

    document.getElementById('target').innerHTML =
        `Canton à trouver : <b>${p.NAME}</b>`;

    hasClicked = false;
    document.getElementById('new').disabled = true;
}

// ── Fin de partie ─────────────────────────────────────────────
async function endGame() {
    gameActive = false;

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("bestScoreCantons", bestScore);
    }

    await saveScore(pseudo, score);

    document.getElementById('target').innerHTML =
        `🎉 Partie terminée ! Score final : <b>${score}</b>`;
    document.getElementById('new').innerHTML  = "Nouvelle partie";
    document.getElementById('new').disabled   = false;
    document.getElementById('best').innerHTML = `Meilleur score : <b>${bestScore}</b>`;

    const p = correctFeature.feature.properties;
    let html = `<div style="padding:10px; border:1px solid #ccc; margin-bottom:10px;">
                    <b>Partie terminée</b> — ${new Date().toLocaleString()}<br>
                    Joueur : <b>${pseudo}</b><br>
                    Canton cible : <b>${p.NAME}</b><br>
                    Score final : <b>${score}</b><br><br>
                    <u>Détails des essais :</u><br>`;
    currentAttemptsLog.forEach(a => {
        html += `Essai ${a.attempt} — Distance : ${a.distance} km — Points : ${a.points} — Total : ${a.total}<br>`;
    });
    html += `</div>`;
    document.getElementById('archive').innerHTML += html;
}

// ── Reset ─────────────────────────────────────────────────────
function resetGame() {
    if (blinkInterval) { clearInterval(blinkInterval); blinkInterval = null; }

    score    = 0;
    attempts = 0;
    gameActive = true;
    hasClicked = false;

    document.getElementById('info').innerHTML    = "";
    document.getElementById('archive').innerHTML = "<h3>Historique des parties</h3>";
    currentAttemptsLog = [];

    document.getElementById('new').innerHTML  = "Nouveau canton";
    document.getElementById('new').disabled   = true;
    document.getElementById('best').innerHTML = `Meilleur score : <b>${bestScore}</b>`;

    pickNewCanton();
}

// ── Bouton nouveau canton ─────────────────────────────────────
document.getElementById('new').addEventListener('click', () => {
    if (!gameActive) {
        resetGame();
    } else {
        if (!hasClicked) return;
        document.getElementById('info').innerHTML = "";
        pickNewCanton();
    }
});

// ── Écran de démarrage ────────────────────────────────────────
const startScreen = document.getElementById('startScreen');
const startBtn    = document.getElementById('startBtn');
const pseudoInput = document.getElementById('pseudoInput');

if (pseudo) {
    startScreen.style.display = 'none';
    startGame();
} else {
    startScreen.style.display = 'flex';
}

startBtn.addEventListener('click', () => {
    const val = pseudoInput.value.trim();
    if (!val) { pseudoInput.style.border = '2px solid red'; return; }
    pseudo = val;
    localStorage.setItem("pseudo", pseudo);
    startScreen.style.display = 'none';
    startGame();
});

pseudoInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') startBtn.click();
});
