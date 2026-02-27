let allFeatures = [];
let correctFeature = null;
let blinkInterval = null;

let score = 0;
let attempts = 0;
const maxAttempts = 5;
let gameActive = true;
let hasClicked = false;

let bestScore = localStorage.getItem("bestScore")
    ? parseInt(localStorage.getItem("bestScore"))
    : 0;

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

                    allFeatures.forEach(f => f.setStyle({ fillColor: '', fillOpacity: 0.2 }));

                    if (blinkInterval) {
                        clearInterval(blinkInterval);
                        blinkInterval = null;
                        correctFeature.setStyle({ fillColor: '', fillOpacity: 0.2 });
                    }

                    lyr.setStyle({ fillColor: 'orange', fillOpacity: 0.7 });

                    const c1 = lyr.getBounds().getCenter();
                    const c2 = correctFeature.getBounds().getCenter();
                    const d = distanceKm(c1.lat, c1.lng, c2.lat, c2.lng);

                    let dist = Math.round(d);
                    let pts = Math.max(0, 100 - dist);

                    score += pts;
                    attempts++;

                    document.getElementById('info').innerHTML +=
                        `<div style="margin-bottom:10px;">
                            <b>Essai ${attempts}/${maxAttempts}</b><br>
                            Distance : <b>${d.toFixed(2)} km</b><br>
                            Points gagnés : <b>${pts}</b><br>
                            Score total : <b>${score}</b>
                         </div><hr>`;

                    let visible = true;
                    blinkInterval = setInterval(() => {
                        correctFeature.setStyle({
                            fillColor: visible ? 'red' : '',
                            fillOpacity: visible ? 0.7 : 0.2
                        });
                        visible = !visible;
                    }, 500);

                    if (attempts >= maxAttempts) {
                        endGame();
                        return;
                    }

                    setTimeout(() => {
                        pickNewCommune();   // 🔥 toujours appelé → hasClicked repasse à false
                    }, 1200);
                });
            }
        });

        layer.addTo(map);
        map.fitBounds(layer.getBounds());

        function pickNewCommune() {

            if (blinkInterval) {
                clearInterval(blinkInterval);
                blinkInterval = null;
            }

            allFeatures.forEach(f => f.setStyle({ fillColor: '', fillOpacity: 0.2 }));

            correctFeature = allFeatures[Math.floor(Math.random() * allFeatures.length)];

            const p = correctFeature.feature.properties;
            document.getElementById('target').innerHTML =
                `Commune à trouver : <b>${p.NAME}</b>`;

            hasClicked = false;   // 🔥 indispensable pour débloquer l’essai suivant
        }

        function endGame() {
            gameActive = false;

            if (blinkInterval) clearInterval(blinkInterval);

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

        function resetGame() {
            score = 0;
            attempts = 0;
            gameActive = true;
            hasClicked = false;

            document.getElementById('new').innerHTML = "Nouvelle commune";

            pickNewCommune();

            document.getElementById('best').innerHTML =
                `Meilleur score : <b>${bestScore}</b>`;
        }

        pickNewCommune();

        document.getElementById('best').innerHTML =
            `Meilleur score : <b>${bestScore}</b>`;

        document.getElementById('new').addEventListener('click', () => {

            hasClicked = false;

            if (!gameActive) resetGame();
            else pickNewCommune();
        });
    });
