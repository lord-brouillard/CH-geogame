// Initialisation de la carte (sans fond de carte)
const map = L.map('map', {
    zoomControl: true,
    attributionControl: false
});

// Chargement du GeoJSON
fetch('GeoJSON_cantons.geojson')
    .then(response => response.json())
    .then(geojson => {

        const layer = L.geoJSON(geojson, {
            style: {
                color: '#000',
                weight: 1,
                fillOpacity: 0.01
            },
            onEachFeature: (feature, layer) => {

                const html = `${feature.properties.NAME}`;

                layer.bindPopup(html);

                layer.on('click', () => {
                    document.getElementById('info').innerHTML = html;
                });

                // Survol : mise en évidence
                layer.on('mouseover', () => {
                    layer.setStyle({ weight: 3, color: 'blue' });
                });

                layer.on('mouseout', () => {
                    layer.setStyle({ weight: 1, color: '#000' });
                });
            }

        }).addTo(map);

        // Zoom automatique
        map.fitBounds(layer.getBounds());
    })
    .catch(err => console.error('Erreur GeoJSON:', err));
