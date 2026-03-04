let allFeatures = [];

const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
});

L.control.zoom({
    position: 'topright'
}).addTo(map);

let geojsonData = null;

const selectCanton = document.getElementById("selectCanton");

// 🔵 Construit la couche filtrée selon le canton sélectionné
function buildLayer() {
    allFeatures = [];

    const canton = selectCanton.value;

    const filtered = canton
        ? geojsonData.features.filter(f => f.properties.KANTONSNUM == canton)
        : geojsonData.features;

    if (window.layer) map.removeLayer(window.layer);

    const info = document.getElementById('info');

    if (!filtered.length) {
        if (info) info.innerHTML = "Aucune commune trouvée pour ce canton.";
        return;
    }

    window.layer = L.geoJSON(
        { type: "FeatureCollection", features: filtered },
        {
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
                    if (info) info.innerHTML = html;
                });

                lyr.on('mouseover', () => {
                    lyr.setStyle({ weight: 3, color: 'blue' });
                });

                lyr.on('mouseout', () => {
                    lyr.setStyle({ weight: 1, color: '#000' });
                });
            }
        }
    );

    window.layer.addTo(map);
    map.fitBounds(window.layer.getBounds());
}

// 🔵 Changement de canton
selectCanton.addEventListener("change", () => {
    const info = document.getElementById('info');
    if (info) info.innerHTML = "";
    buildLayer();
});

// 🔵 Chargement initial
fetch('./data/GeoJSON_communes.geojson')
    .then(response => response.json())
    .then(geojson => {
        geojsonData = geojson;
        buildLayer();
    });