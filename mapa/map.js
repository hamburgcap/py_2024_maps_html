// map.js

// Função debounce para limitar chamadas frequentes
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Função para alternar o painel de filtros
function toggleFilterPanel() {
    const filterPanel = document.getElementById('filter-panel');
    filterPanel.classList.toggle('hidden');
}

// Inicializa o mapa
const map = L.map('map').setView([-23.55052, -46.633308], 5);

// Adiciona o tile layer do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Cria o grupo de clusters
const markers = L.markerClusterGroup();
let allMarkers = []; // Armazena todos os marcadores para reutilização

// Configura sliders
$(function () {
    $("#price-slider").slider({
        range: true,
        min: 0,
        max: 1000000,
        step: 1000,
        values: [0, 1000000],
        slide: debounce(function (event, ui) {
            $("#price-min").text(ui.values[0]);
            $("#price-max").text(ui.values[1]);
            atualizarMarcadores();
        }, 200) // Atualiza após 200ms de inatividade
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

// Carrega dados do arquivo JSON e popula os marcadores
fetch('locations.json?version=' + new Date().getTime())
    .then(response => response.json())
    .then(data => {
        const modalidades = new Set();
        const tipos = new Set();

        data.forEach(location => {
            modalidades.add(location.modalidade_de_venda);
            tipos.add(location.tipo);

            // Escolhe o ícone com base no tipo de imóvel
            let iconHtml;
            if (['Casa', 'Apartamento', 'Sobrado', 'Prédio'].includes(location.tipo)) {
                iconHtml = '<i class="fas fa-home" style="font-size: 30px; color: #0000FF;"></i>';
            } else if (['Loja', 'Comercial', 'Sala', 'Galpão'].includes(location.tipo)) {
                iconHtml = '<i class="fas fa-store" style="font-size: 30px; color: #0000FF;"></i>';
            } else if (['Terreno', 'Gleba', 'Gleba Urbana', 'Imóvel Rural'].includes(location.tipo)) {
                iconHtml = '<i class="fas fa-tractor" style="font-size: 30px; color: #0000FF;"></i>';
            } else {
                iconHtml = '<i class="fas fa-map-marker-alt" style="font-size: 30px; color: #0000FF;"></i>';
            }

            // Adiciona indicador de desconto, se aplicável
            let discountHtml = '';
            if (location.desconto >= 30) {
                discountHtml = `<div class="discount-label">${Math.round(location.desconto)}%</div>`;
            }

            const customIcon = L.divIcon({
                className: 'custom-icon',
                html: iconHtml + discountHtml,
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });

            // Cria um marcador
            const marker = L.marker([location.lat, location.lng], { icon: customIcon })
                .bindPopup(
                    `<b>Preço: R$${location.preco}</b><br>` +
                    `<b>Desconto: ${location.desconto}%</b><br>` +
                    `<b>Tipo: ${location.tipo}</b><br>` +
                    `<b>Modalidade: ${location.modalidade_de_venda}</b><br>` +
                    `<a href="${location.link_de_acesso}" target="_blank">Acessar o Imóvel</a>`
                );

            // Salva o marcador junto com os filtros
            allMarkers.push({
                marker,
                modalidade: location.modalidade_de_venda,
                tipo: location.tipo,
                preco: location.preco,
                desconto: location.desconto !== null ? location.desconto : -1
            });

            // Adiciona o marcador ao cluster
            markers.addLayer(marker);
        });

        // Adiciona os clusters ao mapa
        map.addLayer(markers);

        // Preenche os checkboxes de filtros
        preencherFiltros(modalidades, tipos);
    })
    .catch(error => console.error('Erro ao carregar o JSON:', error));

// Preenche os filtros dinâmicos
function preencherFiltros(modalidades, tipos) {
    const filterModalidadeDiv = document.getElementById('filter-modalidade');
    modalidades.forEach(modalidade => {
        const container = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = modalidade;
        checkbox.checked = true;
        checkbox.id = 'modalidade-' + modalidade;
        checkbox.addEventListener('change', atualizarMarcadores);

        const label = document.createElement('label');
        label.htmlFor = 'modalidade-' + modalidade;
        label.textContent = modalidade;

        container.appendChild(checkbox);
        container.appendChild(label);
        filterModalidadeDiv.appendChild(container);
    });

    const filterTipoDiv = document.getElementById('filter-tipo');
    tipos.forEach(tipo => {
        const container = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = tipo;
        checkbox.checked = true;
        checkbox.id = 'tipo-' + tipo;
        checkbox.addEventListener('change', atualizarMarcadores);

        const label = document.createElement('label');
        label.htmlFor = 'tipo-' + tipo;
        label.textContent = tipo;

        container.appendChild(checkbox);
        container.appendChild(label);
        filterTipoDiv.appendChild(container);
    });
}

// Atualiza os marcadores no mapa com base nos filtros
function atualizarMarcadores() {
    const modalidadesSelecionadas = Array.from(document.querySelectorAll('#filter-modalidade input:checked')).map(checkbox => checkbox.value);
    const tiposSelecionados = Array.from(document.querySelectorAll('#filter-tipo input:checked')).map(checkbox => checkbox.value);
    const precoMin = $("#price-slider").slider("values", 0);
    const precoMax = $("#price-slider").slider("values", 1);
    const descontoMin = $("#discount-slider").slider("values", 0);
    const descontoMax = $("#discount-slider").slider("values", 1);

    markers.clearLayers(); // Remove marcadores antigos

    // Adiciona os marcadores filtrados
    allMarkers.forEach(item => {
        if (
            modalidadesSelecionadas.includes(item.modalidade) &&
            tiposSelecionados.includes(item.tipo) &&
            item.preco >= precoMin &&
            item.preco <= precoMax &&
            item.desconto >= descontoMin &&
            item.desconto <= descontoMax
        ) {
            markers.addLayer(item.marker);
        }
    });
}
