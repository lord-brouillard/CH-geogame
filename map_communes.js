fetch('./data/GeoJSON_communes.geojson')
    .then(response => response.json())
    .then(geojson => {

        const layer = L.geoJSON(geojson, {
            ...
            onEachFeature: (feature, lyr) => {
                allFeatures.push(lyr);
                ...
            }
        });

        layer.addTo(map);
        map.fitBounds(layer.getBounds());

        // --- Recherche ---
        document.getElementById('btnSearch').addEventListener('click', () => {
            const q = document.getElementById('search').value.toLowerCase();
            const found = allFeatures.filter(f =>
                f.feature.properties.NAME.toLowerCase().includes(q)
            );
            ...
        });

        // --- Autocomplétion ---
        const input = document.getElementById('search');
        const suggestions = document.getElementById('suggestions');

        input.addEventListener('input', () => {
            const q = input.value.toLowerCase();
            suggestions.innerHTML = '';

            if (q.length < 2) return;

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
    });
