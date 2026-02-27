let allFeatures = [];
let correctFeature = null;
let blinkInterval = null;
let hasClicked = false;

// Nouveau : score et gestion de partie
let score = 0;
let attempts = 0;
const maxAttempts = 5;
let gameActive = true;

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

                    // Reset styles
                    allFeatures.forEach(f => f.setStyle({ fillColor: '', fillOpacity: 0.2 }));

                    // Stopper clignotement précédent
                    if (hasClicked && blinkInterval) {
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

                    // Attribution des points
                    let pts = 0;
                    if (d === 0) pts = 100;
                    else if (d <= 25) pts = 75;
                    else if (d <= 50) pts = 50;
                    else if (d <= 100) pts = 25;

                    score += pts;
                    attempts++;

                    document.getElementById('info').innerHTML =
                        `Distance : <b>${d.toFixed(2)} km</b><br>
                         Points gagnés : <b>${pts}</b><br>
                         Score total : <b>${score}</b><br>
                         Essai ${attempts}/${maxAttempts}`;

                    // Lancer le clignotement
                    hasClicked = true;

                    let visible = true;
                    blinkInterval = setInterval(() => {
                        correctFeature.setStyle({
                            fillColor: visible ? 'red' : '',
                            fillOpacity: visible ? 0.7 : 0.2
                        });
                        visible = !visible;
                    }, 500);

                    // Fin de partie ?
                    if (attempts >= maxAttempts) {
                        endGame();
                    }
                });
            }
        });

        layer.addTo(map);
        map.fitBounds(layer.getBounds());

        // Fonction pour choisir une nouvelle commune
        function pickNewCommune() {

            if (!gameActive) return;

            // Stopper clignotement
            if (blinkInterval) {
                clearInterval(blinkInterval);
                blinkInterval = null;
            }

            // Reset styles
            allFeatures.forEach(f => f.setStyle({ fillColor: '', fillOpacity: 0.2 }));

            // Reset texte
            document.getElementById('info').innerHTML = '';

            // Nouvelle commune
            correctFeature = allFeatures[Math.floor(Math.random() * allFeatures.length)];

            // Affichage
            const p = correctFeature.feature.properties;
            document.getElementById('target').innerHTML =
                `Commune à trouver : <b>${p.NAME}</b>`;

            hasClicked = false;
        }

        // Fin de partie
        function endGame() {
            gameActive = false;

            if (blinkInterval) clearInterval(blinkInterval);

            document.getElementById('target').innerHTML =
                `🎉 Partie terminée ! Score final : <b>${score}</b>`;

            document.getElementById('new').innerHTML = "Nouvelle partie";
        }

        // Redémarrer une partie
        function resetGame() {
            score = 0;
            attempts = 0;
            gameActive = true;

            document.getElementById('new').innerHTML = "Nouvelle commune";
            pickNewCommune();
        }

        // Premier tirage
        pickNewCommune();

        // Bouton nouvelle commune / nouvelle partie
        const newBtn = document.getElementById('new');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                if (!gameActive) resetGame();
                else pickNewCommune();
            });
        }
    });
