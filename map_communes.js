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
const searchInput  = document.getElementById("search");
const suggestions  = document.getElementById("suggestions");
const btnSearch    = document.getElementById("btnSearch");

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

    // Réinitialise la recherche quand on change de canton
    searchInput.value = "";
    suggestions.innerHTML = "";
}

// 🔵 Recherche et zoom sur une commune par nom
function searchCommune(name) {
    const found = allFeatures.find(
        lyr => lyr.feature.properties.NAME.toLowerCase() === name.toLowerCase()
    );

    if (!found) return;

    // Remet tous les styles à zéro
    allFeatures.forEach(f => f.setStyle({ weight: 1, color: '#000', fillColor: '', fillOpacity: 0.01 }));

    // Met en évidence la commune trouvée
    found.setStyle({ weight: 3, color: 'blue', fillColor: 'blue', fillOpacity: 0.4 });

    map.fitBounds(found.getBounds());
    found.openPopup();

    const p = found.feature.properties;
    const info = document.getElementById('info');
    if (info) info.innerHTML = `
        <b>${p.NAME}</b><br>
        Population : ${p.EINWOHNERZ} habitants<br>
        Surface : ${p.GEM_FLAECH} ha
    `;

    suggestions.innerHTML = "";
    searchInput.value = p.NAME;
}

// 🔵 Autocomplétion
searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    suggestions.innerHTML = "";

    if (query.length < 2) return;

    const matches = allFeatures
        .map(lyr => lyr.feature.properties.NAME)
        .filter(name => name.toLowerCase().includes(query))
        .slice(0, 8);

    matches.forEach(name => {
        const div = document.createElement("div");
        div.textContent = name;
        div.addEventListener("click", () => searchCommune(name));
        suggestions.appendChild(div);
    });
});

// 🔵 Bouton OK
btnSearch.addEventListener("click", () => {
    searchCommune(searchInput.value.trim());
});

// 🔵 Touche Entrée
searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") searchCommune(searchInput.value.trim());
});

// 🔵 Ferme les suggestions si on clique ailleurs
document.addEventListener("click", e => {
    if (e.target !== searchInput) suggestions.innerHTML = "";
});

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
