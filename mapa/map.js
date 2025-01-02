// Função debounce para limitar as chamadas frequentes
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Função para alternar a exibição do painel de filtros
function toggleFilterPanel() {
    const filterPanel = document.getElementById('filter-panel');
    filterPanel.classList.toggle('hidden');
}

// Inicializa o mapa
const map = L.map('map').setView([-23.55052, -46.633308], 5);

// Adiciona o tile layer do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Cria o grupo de clusters
const markers = L.markerClusterGroup();
const allMarkers = []; // Armazena todos os marcadores para reutilizar

// Função para carregar os dados do arquivo JSON
function carregarDados() {
    fetch('locations.json?version=' + new Date().getTime())
        .then((response) => response.json())
        .then((data) => {
            processarDados(data);
        })
        .catch((error) => {
            console.error('Erro ao carregar o JSON:', error);
        });
}

// Processa os dados e cria os marcadores
function processarDados(data) {
    data.forEach(function (location) {
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
            iconAnchor: [15, 30],
        });

        // Cria o marcador
        const marker = L.marker([location.lat, location.lng], { icon: customIcon }).bindPopup(
            `<b>Preço: R$${location.preco}</b><br>
             <b>Desconto: ${location.desconto}%</b><br>
             <b>Tipo: ${location.tipo}</b><br>
             <b>Modalidade: ${location.modalidade_de_venda}</b><br>
             <a href="${location.link_de_acesso}" target="_blank">Acessar o Imóvel</a>`
        );

        // Salva o marcador junto com seus filtros
        allMarkers.push({
            marker: marker,
            modalidade: location.modalidade_de_venda,
            tipo: location.tipo,
            preco: location.preco,
            desconto: location.desconto !== null ? location.desconto : -1,
        });

        // Adiciona o marcador ao cluster inicialmente
        markers.addLayer(marker);
    });

    // Adiciona os clusters ao mapa
    map.addLayer(markers);
}

// Função para atualizar os marcadores com base nos filtros
function atualizarMarcadores(modalidades, tipos, precoMin, precoMax, descontoMin, descontoMax) {
    // Remove todos os marcadores existentes do cluster
    markers.clearLayers();

    // Adiciona os marcadores correspondentes aos filtros
    allMarkers.forEach(function (item) {
        if (
            modalidades.includes(item.modalidade) &&
            tipos.includes(item.tipo) &&
            item.preco >= precoMin &&
            item.preco <= precoMax &&
            item.desconto >= descontoMin &&
            item.desconto <= descontoMax
        ) {
            markers.addLayer(item.marker);
        }
    });
}

// Inicializa o carregamento dos dados
carregarDados();
