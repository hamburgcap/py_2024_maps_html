// ======================= map.js =======================

// --- Helper Functions ---

// Debounce function to limit frequent calls
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Define marker icon based on type and discount
function definirIcone(tipo, desconto) {
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
    if (desconto >= 30) {
        iconHtml += `<div class="discount-label">${Math.round(desconto)}%</div>`;
    }
    return iconHtml;
}

// Create filters for dynamic filtering
function preencherFiltros(modalidades, tipos) {
    // Get the container for 'modalidade' filters and remove all its children
    const filterModalidadeDiv = document.getElementById('filter-modalidade');
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
    const filterTipoDiv = document.getElementById('filter-tipo');
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
    const modalidadesSelecionadas = Array.from(document.querySelectorAll('#filter-modalidade input:checked')).map(cb => cb.value);
    const tiposSelecionados = Array.from(document.querySelectorAll('#filter-tipo input:checked')).map(cb => cb.value);
    const precoMin = $("#price-slider").slider("values", 0);
    const precoMax = $("#price-slider").slider("values", 1);
    const descontoMin = $("#discount-slider").slider("values", 0);
    const descontoMax = $("#discount-slider").slider("values", 1);

    window.markers.clearLayers();
    window.allMarkers.forEach(item => {
        if (
            modalidadesSelecionadas.includes(item.modalidade) &&
            tiposSelecionados.includes(item.tipo) &&
            item.preco >= precoMin &&
            item.preco <= precoMax &&
            item.desconto >= descontoMin &&
            item.desconto <= descontoMax
        ) {
            window.markers.addLayer(item.marker);
        }
    });
}

// Initialize jQuery UI sliders
$(function () {
    $("#price-slider").slider({
        range: true,
        min: 0,
        max: 200000000,
        step: 1000,
        values: [0, 200000000],
        slide: debounce(function (event, ui) {
            $("#price-min").text(ui.values[0].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }));
            $("#price-max").text(ui.values[1].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }));
            atualizarMarcadores();
        }, 200)
    });
    $("#price-min").text($("#price-slider").slider("values", 0));
    $("#price-max").text($("#price-slider").slider("values", 1));

    $("#discount-slider").slider({
        range: true,
        min: 0,
        max: 100,
        step: 1,
        values: [0, 100],
        slide: debounce(function (event, ui) {
            $("#discount-min").text(ui.values[0]);
            $("#discount-max").text(ui.values[1]);
            atualizarMarcadores();
        }, 200)
    });
    $("#discount-min").text($("#discount-slider").slider("values", 0));
    $("#discount-max").text($("#discount-slider").slider("values", 1));
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

    // Fetch the JSON data and populate markers.
    fetch('locations.json?version=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            const modalidades = new Set();
            const tipos = new Set();
            let prices = [];  // NEW: Array to store prices
            let discounts = []; // NEW: Array to store all discount values

            data.forEach(location => {
                modalidades.add(location.modalidade_de_venda);
                tipos.add(location.tipo);
                prices.push(parseFloat(location.preco.replace(/,/g, '')));  // NEW: Collect each price
                discounts.push(location.desconto !== null ? location.desconto : 0); // NEW: Collect each discount value

                const iconHtml = definirIcone(location.tipo, location.desconto);
                const customIcon = L.divIcon({
                    className: 'custom-icon',
                    html: iconHtml,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30]
                });

                const marker = L.marker([location.lat, location.lng], { icon: customIcon })
                    .bindPopup(
                        `<b>Preço: R$${location.preco}</b><br>` +
                        `<b>Desconto: ${location.desconto}%</b><br>` +
                        `<b>Tipo: ${location.tipo}</b><br>` +
                        `<b>Modalidade: ${location.modalidade_de_venda}</b><br>` +
                        `<a href="${location.link_de_acesso}" target="_blank">Acessar o Imóvel</a>`,
                        { offset: [0, -30] } // Moves the popup UP by 30 pixels
                    );

                window.allMarkers.push({
                    marker,
                    modalidade: location.modalidade_de_venda,
                    tipo: location.tipo,
                    preco: location.preco,
                    desconto: location.desconto !== null ? location.desconto : 0
                });

                window.markers.addLayer(marker);
            });

            // NEW: Compute dynamic minimum and maximum price values
           let minPrice = Math.min(...prices);
           let maxPrice = Math.max(...prices);
           // NEW: Compute dynamic minimum and maximum discount values
           let minDiscount = Math.min(...discounts);
           let maxDiscount = Math.max(...discounts);

           // NEW: Update the slider with dynamic min and max values
           $("#price-slider").slider("option", "min", minPrice);
           $("#price-slider").slider("option", "max", maxPrice);
           $("#price-slider").slider("option", "values", [minPrice, maxPrice]);
           $("#price-min").text(minPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }));
           $("#price-max").text(maxPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }));

           // NEW: Update discount slider with dynamic values
            $("#discount-slider").slider("option", "min", minDiscount);
            $("#discount-slider").slider("option", "max", maxDiscount);
            $("#discount-slider").slider("option", "values", [minDiscount, maxDiscount]);
            $("#discount-min").text(minDiscount);
            $("#discount-max").text(maxDiscount);

            window.map.addLayer(window.markers);
            preencherFiltros(modalidades, tipos);
            console.log("Prices:", prices);
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
