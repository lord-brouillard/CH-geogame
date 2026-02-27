let allFeatures = [];
let correctFeature = null;
let blinkInterval = null;

let score = 0;
let attempts = 0;
const maxAttempts = 5;
let gameActive = true;
let hasClicked = false;

let currentAttemptsLog = [];

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

// 1) Fond Suisse non interactif
fetch('./data/GeoJSON_CH_v2.geojson')
    .then(r => r.json())
    .then(territoire => {

        L.geoJSON(territoire, {
            coordsToLatLng: function (coords) {
                return L.latLng(coords[1], coords[0]);
            },
            style: {
                color: "#444",
                weight: 1,
                fillColor: "#ddd",
                fillOpacity: 0.3
            }
        }).addTo(map);

        // 2) Couche interactive des montagnes
        return fetch('./data/GeoJSON_montagnes_v2.geojson');
    })
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

                    document.getElementById('new').disabled = false;

                    // reset visuel
                    allFeatures.forEach(f => f.setStyle({ fillColor: '', fillOpacity: 0.2 }));

                    // arrêter un éventuel clignotement précédent
                    if (blinkInterval) {
                        clearInterval(blinkInterval);
                        blinkInterval = null;
                        correctFeature.setStyle({ fillColor: '', fillOpacity: 0.2 });
                    }

                    // montagne choisie par le joueur
                    lyr.setStyle({ fillColor: 'orange', fillOpacity: 0.7 });

                    const c1 = lyr.getBounds().getCenter();
                    const c2 = correctFeature.getBounds().getCenter();
                    const d = distanceKm(c1.lat, c1.lng, c2.lat, c2.lng);

                    let dist = Math.round(d);
                    let pts = Math.max(0, 100 - dist);

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

                    // clignotement de la bonne montagne à CHAQUE essai
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

                    hasClicked = false;
                });
            }
        });

        layer.addTo(map);
        map.fitBounds(layer.getBounds());

        // 🟢 Correction : attendre que toutes les features soient chargées
        let featuresLoaded = 0;
        const totalFeatures = geojson.features.length;

        map.on('layeradd', () => {
    if (allFeatures.length === geojson.features.length) {
        pickNewMontagne();
    }
});


        function pickNewMontagne() {

    if (blinkInterval) {
        clearInterval(blinkInterval);
        blinkInterval = null;
    }

    allFeatures.forEach(f => f.setStyle({ fillColor: '', fillOpacity: 0.2 }));

    // montagne cible aléatoire
    correctFeature = allFeatures[Math.floor(Math.random() * allFeatures.length)];

    const p = correctFeature.feature.properties;

    document.getElementById('target').innerHTML =
        `Montagne à trouver : <b>${p.NAME}</b>`;

    // 🔥 AJOUT : affichage en bas à droite
    document.querySelector('#randomNameBox b').textContent = p.NAME;

    hasClicked = false;
    document.getElementById('new').disabled = true;
}


        function endGame() {
            gameActive = false;

            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem("bestScore", bestScore);
            }

            document.getElementById('target').innerHTML =
                `🎉 Partie terminée ! Score final : <b>${score}</b>`;

            document.getElementById('new').innerHTML = "Nouvelle partie";
            document.getElementById('new').disabled = false;

            document.getElementById('best').innerHTML =
                `Meilleur score : <b>${bestScore}</b>`;

            const p = correctFeature.feature.properties;

            let html = `<div style="padding:10px; border:1px solid #ccc; margin-bottom:10px;">
                            <b>Partie terminée</b> — ${new Date().toLocaleString()}<br>
                            Montagne cible : <b>${p.NAME}</b><br>
                            Score final : <b>${score}</b><br><br>
                            <u>Détails des essais :</u><br>`;

            currentAttemptsLog.forEach(a => {
                html += `Essai ${a.attempt} — Distance : ${a.distance} km — Points : ${a.points} — Total : ${a.total}<br>`;
            });

            html += `</div>`;

            document.getElementById('archive').innerHTML += html;
        }

        function resetGame() {

            if (blinkInterval) {
                clearInterval(blinkInterval);
                blinkInterval = null;
            }

            score = 0;
            attempts = 0;
            gameActive = true;
            hasClicked = false;

            document.getElementById('info').innerHTML = "";
            currentAttemptsLog = [];

            document.getElementById('new').innerHTML = "Nouvelle montagne";
            document.getElementById('new').disabled = true;

            pickNewMontagne();

            document.getElementById('best').innerHTML =
                `Meilleur score : <b>${bestScore}</b>`;
        }

        document.getElementById('best').innerHTML =
            `Meilleur score : <b>${bestScore}</b>`;

        document.getElementById('new').addEventListener('click', () => {
            if (!gameActive) {
                resetGame();
            } else {
                pickNewMontagne();
                document.getElementById('info').innerHTML = "";
            }
        });
    });
document.getElementById('randomNameText').textContent = "TEST OK";
