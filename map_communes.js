let allFeatures = []; // stockage des features
const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
});
L.control.zoom({
    position: 'topright'
}).addTo(map);
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

                const html = ` <strong>${props.NAME}</strong><br> Surface : ${props.AREA ?? "?"} km²<br>`;

                lyr.bindPopup(html);

                lyr.on('click', () => {
                    document.getElementById('info').innerHTML = html;
                });

                lyr.on('mouseover', () => {
                    lyr.setStyle({ weight: 3, color: 'blue' });
                });

                lyr.on('mouseout', () => {
                    lyr.setStyle({ weight: 1, color: '#000' });
                });
            }
        });

        // ✅ Ajout à la carte séparé
        layer.addTo(map);

        // ✅ Zoom automatique
        map.fitBounds(layer.getBounds());

        // --- Recherche améliorée ---
        document.getElementById('btnSearch').addEventListener('click', () => {
            const q = document.getElementById('search').value.toLowerCase();

            const found = allFeatures.filter(f =>
                f.feature.properties.NAME.toLowerCase().includes(q)
            );

            if (found.length > 0) {
                map.fitBounds(found[0].getBounds());
                found[0].openPopup();
            } else {
                alert("Commune non trouvée");
            }
        });
    });
const input = document.getElementById('search');
const suggestions = document.getElementById('suggestions');

// --- Autocomplétion ---
input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    suggestions.innerHTML = '';

    if (q.length < 2) return; // éviter trop de résultats

    const matches = allFeatures.filter(f =>
        f.feature.properties.NAME.toLowerCase().includes(q)
    );

    matches.slice(0, 10).forEach(f => {
        const div = document.createElement('div');
        div.textContent = f.feature.properties.NAME;

        div.addEventListener('click', () => {
            input.value = f.feature.properties.NAME;
            suggestions.innerHTML = '';

            map.fitBounds(f.getBounds());
            f.openPopup();
        });

        suggestions.appendChild(div);
    });
});

