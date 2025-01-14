// Arquivo: map.js

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

// Carrega dados do arquivo JSON e popula os marcadores
fetch('locations.json?version=' + new Date().getTime())
    .then(response => response.json())
    .then(data => {
        const modalidades = new Set();
        const tipos = new Set();

        data.forEach(location => {
            modalidades.add(location.modalidade_de_venda);
            tipos.add(location.tipo);

            // Define ícones e rótulos para os marcadores
            const iconHtml = definirIcone(location.tipo, location.desconto);
            const customIcon = L.divIcon({
                className: 'custom-icon',
                html: iconHtml,
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });

            // Cria o marcador
            const marker = L.marker([location.lat, location.lng], { icon: customIcon })
                .bindPopup(
                    `<b>Preço: R$${location.preco}</b><br>` +
                    `<b>Desconto: ${location.desconto}%</b><br>` +
                    `<b>Tipo: ${location.tipo}</b><br>` +
                    `<b>Modalidade: ${location.modalidade_de_venda}</b><br>` +
                    `<a href="${location.link_de_acesso}" target="_blank">Acessar o Imóvel</a>`
                );

            // Armazena o marcador e seus atributos
            allMarkers.push({
                marker,
                modalidade: location.modalidade_de_venda,
                tipo: location.tipo,
                preco: location.preco,
                desconto: location.desconto !== null ? location.desconto : -1
            });

            // Adiciona ao cluster
            markers.addLayer(marker);
        });

        // Adiciona o cluster ao mapa
        map.addLayer(markers);

        // Preenche filtros dinâmicos
        preencherFiltros(modalidades, tipos);
    })
    .catch(error => console.error('Erro ao carregar o JSON:', error));

// Define ícones e rótulos de descontos para os marcadores
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

// Preenche filtros dinâmicos
function preencherFiltros(modalidades, tipos) {
    const filterModalidadeDiv = document.getElementById('filter-modalidade');
    modalidades.forEach(modalidade => {
        const container = document.createElement('div');
        const checkbox = criarCheckbox('modalidade', modalidade);
        container.appendChild(checkbox.checkbox);
        container.appendChild(checkbox.label);
        filterModalidadeDiv.appendChild(container);
    });

    const filterTipoDiv = document.getElementById('filter-tipo');
    tipos.forEach(tipo => {
        const container = document.createElement('div');
        const checkbox = criarCheckbox('tipo', tipo);
        container.appendChild(checkbox.checkbox);
        container.appendChild(checkbox.label);
        filterTipoDiv.appendChild(container);
    });
}

// Cria elementos de checkbox para os filtros
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

// Atualiza os marcadores com base nos filtros
function atualizarMarcadores() {
    const modalidadesSelecionadas = Array.from(document.querySelectorAll('#filter-modalidade input:checked')).map(checkbox => checkbox.value);
    const tiposSelecionados = Array.from(document.querySelectorAll('#filter-tipo input:checked')).map(checkbox => checkbox.value);
    const precoMin = $("#price-slider").slider("values", 0);
    const precoMax = $("#price-slider").slider("values", 1);
    const descontoMin = $("#discount-slider").slider("values", 0);
    const descontoMax = $("#discount-slider").slider("values", 1);

    markers.clearLayers(); // Remove marcadores antigos

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
