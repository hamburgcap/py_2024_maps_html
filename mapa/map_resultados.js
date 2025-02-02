// ======================= map_resultados.js =======================

// --- Helper Functions ---

// Debounce function to limit frequent calls
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Define marker icon based on type and perc_de_luta
function definirIcone(tipo, perc_de_luta) {
    let iconHtml;
    if (['Casa', 'Apartamento', 'Sobrado', 'Prédio'].includes(tipo)) {
        iconHtml = '<i class="fas fa-home" style="font-size: 30px; color: #0000FF;"></i>';
    } else if (['Loja', 'Comercial', 'Sala', 'Galpão'].includes(tipo)) {
        iconHtml = '<i class="fas fa-store" style="font-size: 30px; color: #0000FF;"></i>';
    } else if (['Terreno', 'Gleba', 'Gleba Urbana', 'Imóvel Rural'].includes(tipo)) {
        iconHtml = '<i class="fas fa-tractor" style="font-size: 30px; color: #0000FF;"></i>';
    } else {
        iconHtml = '<i class="fas fa-map-marker-alt" style="font-size: 30px; color: #0000FF;"></i>';
    }
    if (perc_de_luta <= 20) {
        iconHtml += `<div class="perc_de_luta-label">${Math.round(perc_de_luta)}%</div>`;
    }
    return iconHtml;
}

// Create filters for dynamic filtering
function preencherFiltros(modalidades, tipos) {
    // Get the container for 'modalidade' filters and remove all its children
    const filterModalidadeDiv = document.getElementById('filter-modalidade-resultados');
    while (filterModalidadeDiv.firstChild) {
        filterModalidadeDiv.removeChild(filterModalidadeDiv.firstChild);
    }

    // Create and append new 'modalidade' filter items
    modalidades.forEach(modalidade => {
        const container = document.createElement('div');
        const checkbox = criarCheckbox('modalidade', modalidade);
        container.appendChild(checkbox.checkbox);
        container.appendChild(checkbox.label);
        filterModalidadeDiv.appendChild(container);
    });

    // Get the container for 'tipo' filters and remove all its children
    const filterTipoDiv = document.getElementById('filter-tipo-resultados');
    while (filterTipoDiv.firstChild) {
        filterTipoDiv.removeChild(filterTipoDiv.firstChild);
    }

    // Create and append new 'tipo' filter items
    tipos.forEach(tipo => {
        const container = document.createElement('div');
        const checkbox = criarCheckbox('tipo', tipo);
        container.appendChild(checkbox.checkbox);
        container.appendChild(checkbox.label);
        filterTipoDiv.appendChild(container);
    });
}

// Create checkbox element for a filter
function criarCheckbox(categoria, valor) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = valor;
    checkbox.checked = true;
    checkbox.id = `${categoria}-${valor}`;
    checkbox.addEventListener('change', atualizarMarcadores);

    const label = document.createElement('label');
    label.htmlFor = `${categoria}-${valor}`;
    label.textContent = valor;

    return { checkbox, label };
}

// Update markers based on filter values
function atualizarMarcadores() {
    const modalidadesSelecionadas = Array.from(document.querySelectorAll('#filter-modalidade-resultados input:checked')).map(cb => cb.value);
    const tiposSelecionados = Array.from(document.querySelectorAll('#filter-tipo-resultados input:checked')).map(cb => cb.value);
    const Valor_OfertaMin = $("#Valor_Oferta-slider-resultados").slider("values", 0);
    const Valor_OfertaMax = $("#Valor_Oferta-slider-resultados").slider("values", 1);
    const perc_de_lutaMin = $("#perc_de_luta-slider-resultados").slider("values", 0);
    const perc_de_lutaMax = $("#perc_de_luta-slider-resultados").slider("values", 1);

    window.markers.clearLayers();
    window.allMarkers.forEach(item => {
        if (
            modalidadesSelecionadas.includes(item.modalidade) &&
            tiposSelecionados.includes(item.tipo) &&
            item.Valor_Oferta >= Valor_OfertaMin &&
            item.Valor_Oferta <= Valor_OfertaMax &&
            item.perc_de_luta >= perc_de_lutaMin &&
            item.perc_de_luta <= perc_de_lutaMax
        ) {
            window.markers.addLayer(item.marker);
        }
    });
}

// Initialize jQuery UI sliders
$(function () {
    $("#Valor_Oferta-slider-resultados").slider({
        range: true,
        min: 0,
        max: 1000000,
        step: 1000,
        values: [0, 2000000],
        slide: debounce(function (event, ui) {
            $("#Valor_Oferta-min").text(ui.values[0].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }));
            $("#Valor_Oferta-max").text(ui.values[1].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }));
            atualizarMarcadores();
        }, 200)
    });
    $("#Valor_Oferta-min").text($("#Valor_Oferta-slider").slider("values", 0));
    $("#Valor_Oferta-max").text($("#Valor_Oferta-slider").slider("values", 1));

    $("#perc_de_luta-slider-resultados").slider({
        range: true,
        min: 0,
        max: 100,
        step: 1,
        values: [0, 100],
        slide: debounce(function (event, ui) {
            $("#perc_de_luta-min").text(ui.values[0]);
            $("#perc_de_luta-max").text(ui.values[1]);
            atualizarMarcadores();
        }, 200)
    });
    $("#perc_de_luta-min").text($("#perc_de_luta-slider").slider("values", -100000000));
    $("#perc_de_luta-max").text($("#perc_de_luta-slider").slider("values", 100000000));
});

// ======================= Map Initialization =======================

// Wrap all map-related code in a function so it can be (re)initialized when needed.
function initializeMap() {
    console.log("initializeMap() called.");

    // Remove any existing element with id "map" from the DOM.
    let oldMapContainer = document.getElementById('map');
    if (oldMapContainer) {
        oldMapContainer.parentNode.removeChild(oldMapContainer);
        console.log("Existing #map container removed.");
    }

    // Create a new map container element.
    const newMapContainer = document.createElement('div');
    newMapContainer.id = 'map';
    // Append the new container to the body (or, if you have a specific parent element, use that).
    document.body.appendChild(newMapContainer);
    console.log("New #map container created.");

    // Initialize the Leaflet map using the new container.
    window.map = L.map('map', {
        zoomControl: false
    }).setView([-23.55052, -46.633308], 5);

    L.control.zoom({
        position: 'topright'
    }).addTo(window.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(window.map);

    // Create the marker cluster group and initialize marker storage.
    window.markers = L.markerClusterGroup();
    window.allMarkers = [];

    // Fetch JSON data
    fetch('locations_resultados.json?version=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            const modalidades = new Set();
            const tipos = new Set();
            let ofertaValues = [];
            let lutaValues = [];

            data.forEach(location => {
                modalidades.add(location.modalidade_de_venda);
                tipos.add(location.tipo);
                ofertaValues.push(parseFloat(location.Valor_Oferta));
                lutaValues.push(location.perc_de_luta !== null ? location.perc_de_luta : 0);

                const marker = L.marker([location.lat, location.lng])
                    .bindPopup(
                        `<b>Valor Oferta: R$${location.Valor_Oferta}</b><br>` +
                        `<b>Percentual de Luta: ${location.perc_de_luta}%</b><br>` +
                        `<b>Tipo: ${location.tipo}</b><br>` +
                        `<b>Modalidade: ${location.modalidade_de_venda}</b><br>` +
                        `<b>Proponente 1: ${location.Proponente_1}</b><br>` +
                        `<b>Proponente 2: ${location.Proponente_2}</b><br>` +
                        `<b>Data da Licitação: ${location.data_licitacao}</b><br>`
                    );

                window.allMarkers.push({
                    marker,
                    modalidade: location.modalidade_de_venda,
                    tipo: location.tipo,
                    Valor_Oferta: location.Valor_Oferta,
                    perc_de_luta: location.perc_de_luta !== null ? location.perc_de_luta : 0
                });

                window.markers.addLayer(marker);
            });

            // Dynamically set slider values
            let minOferta = Math.min(...ofertaValues);
            let maxOferta = Math.max(...ofertaValues);
            let minLuta = Math.min(...lutaValues);
            let maxLuta = Math.max(...lutaValues);

            $("#Valor_Oferta-slider-resultados").slider("option", "min", minOferta);
            $("#Valor_Oferta-slider-resultados").slider("option", "max", maxOferta);
            $("#Valor_Oferta-slider-resultados").slider("option", "values", [minOferta, maxOferta]);
            $("#Valor_Oferta-min").text(minOferta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }));
            $("#Valor_Oferta-max").text(maxOferta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }));


            $("#perc_de_luta-slider-resultados").slider("option", "min", minLuta);
            $("#perc_de_luta-slider-resultados").slider("option", "max", maxLuta);
            $("#perc_de_luta-slider-resultados").slider("option", "values", [minLuta, maxLuta]);
            $("#perc_de_luta-min").text(minLuta);
            $("#perc_de_luta-max").text(maxLuta);

            // Add markers to the map
            window.map.addLayer(window.markers);
            preencherFiltros(modalidades, tipos);
        })
        .catch(error => console.error('Erro ao carregar o JSON:', error));

    // Delay and then force Leaflet to recalculate the map size.
    setTimeout(() => {
        if (window.map) {
            window.map.invalidateSize();
            console.log("Map size invalidated.");
        }
    }, 500);
}

// Expose the initializeMap function globally so that index.html can call it.
window.initializeMap = initializeMap;
