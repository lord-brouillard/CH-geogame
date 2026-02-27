let allFeatures = [];
let correctFeature = null;
let blinkInterval = null;

// Gestion du jeu
let score = 0;
let attempts = 0;
const maxAttempts = 5;
let gameActive = true;
let hasClicked = false;

// Record (meilleur score de partie)
let bestScore = localStorage.getItem("bestScore")
    ? parseInt(localStorage.getItem("bestScore"))
    : 0;

// Fonction distance (Haversine)
function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
});

L.control.zoom({ position: 'topright' }).addTo(map);

fetch('./data/GeoJSON_communes.geojson')
    .then(r => r.json())
    .then(geojson => {

        const layer = L.geoJSON(geojson, {
            style: {
                color: '#000',
                weight: 1,
                fillOpacity: 0.2
            },

            onEachFeature: (feature, lyr) => {
                allFeatures.push(lyr);

                // Hover
                lyr.on('mouseover', () => {
                    if (!gameActive) return;
                    lyr.setStyle({ weight: 3, color: 'blue' });
                });

                lyr.on('mouseout', () => {
                    if (!gameActive) return;
                    lyr.setStyle({ weight: 1, color: '#000' });
                });

                // Clic
                lyr.on('click', () => {

                    if (!gameActive) return;
                    if (!correctFeature) return;
                    if (hasClicked) return;
                    hasClicked = true;

                    // Reset styles
                    allFeatures.forEach(f => f.setStyle({ fillColor: '', fillOpacity: 0.2 }));

                    // Stopper clignotement précédent
                    if (blinkInterval) {
                        clearInterval(blinkInterval);
                        blinkInterval = null;
                        correctFeature.setStyle({ fillColor: '', fillOpacity: 0.2 });
                    }

                    // Colorer la commune cliquée
                    lyr.setStyle({ fillColor: 'orange', fillOpacity: 0.7 });

                    // Calcul distance
                    const c1 = lyr.getBounds().getCenter();
                    const c2 = correctFeature.getBounds().getCenter();
                    const d = distanceKm(c1.lat, c1.lng, c2.lat, c2.lng);

                    let dist = Math.round(d);
                    let pts = Math.max(0, 100 - dist);

                    score += pts;
                    attempts++;

                    // Ajout à l'historique (NE DISPARAÎT PAS)
                    document.getElementById('info').innerHTML +=
                        `<div style="margin-bottom:10px;">
                            <b>Essai ${attempts}/${maxAttempts}</b><br>
                            Distance : <b>${d.toFixed(2)} km</b><br>
                            Points gagnés : <b>${pts}</b><br>
                            Score total : <b>${score}</b>
                         </div><hr>`;

                    // Clignotement de la bonne commune
                    let visible = true;
                    blinkInterval = setInterval(() => {
                        correctFeature.setStyle({
                            fillColor: visible ? 'red' : '',
                            fillOpacity: visible ? 0.7 : 0.2
                        });
                        visible = !visible;
                    }, 500);

                    // Passage automatique à une nouvelle commune
                    setTimeout(() => {
                        if (gameActive) pickNewCommune();
                    }, 1200);

                    // Fin de partie ?
                    if (attempts >= maxAttempts) {
                        endGame();
                    }
                });
            }
        });

        layer.addTo(map);
        map.fitBounds(layer.getBounds());

        // Choisir une nouvelle commune
        function pickNewCommune() {

            if (!gameActive) return;

            if (blinkInterval) {
                clearInterval(blinkInterval);
                blinkInterval = null;
            }

            allFeatures.forEach(f => f.setStyle({ fillColor: '', fillOpacity: 0.2 }));

            correctFeature = allFeatures[Math.floor(Math.random() * allFeatures.length)];

            const p = correctFeature.feature.properties;
            document.getElementById('target').innerHTML =
                `Commune à trouver : <b>${p.NAME}</b>`;

            hasClicked = false; // IMPORTANT
        }

        // Fin de partie
        function endGame() {
            gameActive = false;

            if (blinkInterval) clearInterval(blinkInterval);

            // Mise à jour du record (par partie)
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem("bestScore", bestScore);
            }

            document.getElementById('target').innerHTML =
                `🎉 Partie terminée ! Score final : <b>${score}</b>`;

            document.getElementById('new').innerHTML = "Nouvelle partie";

            document.getElementById('best').innerHTML =
                `Meilleur score : <b>${bestScore}</b>`;
        }

        // Redémarrer une partie
        function resetGame() {
            score = 0;
            attempts = 0;
            gameActive = true;
            hasClicked = false;

            document.getElementById('new').innerHTML = "Nouvelle commune";

            // ❗ Tu veux garder l’historique → on NE vide PAS info
            // document.getElementById('info').innerHTML = "";

            pickNewCommune();

            document.getElementById('best').innerHTML =
                `Meilleur score : <b>${bestScore}</b>`;
        }

        // Premier tirage
        pickNewCommune();

        // Affichage initial du record
        document.getElementById('best').innerHTML =
            `Meilleur score : <b>${bestScore}</b>`;

        // Bouton nouvelle commune / nouvelle partie
        const newBtn = document.getElementById('new');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                if (!gameActive) resetGame();
                else pickNewCommune();
            });
        }
    });
