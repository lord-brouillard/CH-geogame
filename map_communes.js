let allFeatures = []; // stockage des features

const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
});

// Contrôle zoom
L.control.zoom({
    position: 'topright'
}).addTo(map);

// ⚠️ AUCUNE couche de tuiles ici → pas d’OpenStreetMap

// Chargement du GeoJSON
fetch('./data/GeoJSON_communes.geojson')
    .then(response => response.json())
    .then(geojson => {

        const layer = L.geoJSON(geojson, {
            style: {
                color: '#000',
                weight: 1,
                fillOpacity: 0.01
            },

            onEachFeature: (feature, lyr) => {
                allFeatures.push(lyr);

                const p = feature.properties;

                const html = `
                    <b>${p.NAME}</b><br>
                    Population : ${p.EINWOHNERZ} habitants<br>
                    Surface : ${p.GEM_FLAECH} ha
                `;

                lyr.bindPopup(html);

                lyr.on('click', () => {
                    const info = document.getElementById('info');
                    if (info) info.innerHTML = html;
                });

                lyr.on('mouseover', () => {
                    lyr.setStyle({ weight: 3, color: 'blue' });
                });

                lyr.on('mouseout', () => {
                    lyr.setStyle({ weight: 1, color: '#000' });
                });
            }
        });

        layer.addTo(map);

        // Zoom automatique sur le GeoJSON
        map.fitBounds(layer.getBounds());
    });
