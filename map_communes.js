let allFeatures = [];

const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
});

// Fond de carte obligatoire
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

// Contrôle zoom
L.control.zoom({ position: 'topright' }).addTo(map);

fetch('./data/GeoJSON_communes.geojson')
    .then(r => r.json())
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
                    Population : ${p.EINWOHNERZ}<br>
                    Surface : ${p.GEM_FLAECH} ha
                `;

                lyr.bindPopup(html);

                lyr.on('click', () => {
                    const info = document.getElementById('info');
                    if (info) info.innerHTML = html;
                });

                lyr.on('mouseover', () => lyr.setStyle({ weight: 3, color: 'blue' }));
                lyr.on('mouseout', () => lyr.setStyle({ weight: 1, color: '#000' }));
            }
        });

        layer.addTo(map);
        map.fitBounds(layer.getBounds());
    });
