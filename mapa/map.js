// Arquivo: map.js

// Cria o mapa
var map = L.map('map').setView([-23.55052, -46.633308], 5);

// Adiciona o tile layer do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Cria o grupo de clusters
var markers = L.markerClusterGroup();
var allMarkers = []; // Armazena todos os marcadores para reutilizar

// Função para carregar dados do JSON e adicionar marcadores
function carregarDados() {
    fetch('locations.json?version=' + new Date().getTime())
    .then(response => response.json())
    .then(data => {
        data.forEach(function(location) {
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
                discountHtml = '<div class="discount-label">' + Math.round(location.desconto) + '%</div>';
            }

            var customIcon = L.divIcon({
                className: 'custom-icon',
                html: iconHtml + discountHtml,
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });

            // Cria um marcador
            var marker = L.marker([location.lat, location.lng], { icon: customIcon })
                .bindPopup(
                    '<b>Preço: R$' + location.preco + '</b><br>' +
                    '<b>Desconto: ' + location.desconto + '%</b><br>' +
                    '<b>Tipo: ' + location.tipo + '</b><br>' +
                    '<b>Modalidade: ' + location.modalidade_de_venda + '</b><br>' +
                    '<a href="' + location.link_de_acesso + '" target="_blank">Acessar o Imóvel</a>'
                );

            // Salva o marcador junto com seus filtros
            allMarkers.push({
                marker: marker,
                modalidade: location.modalidade_de_venda,
                tipo: location.tipo,
                preco: location.preco,
                desconto: location.desconto !== null ? location.desconto : -1
            });

            // Adiciona o marcador ao cluster inicialmente
            markers.addLayer(marker);
        });

        // Adiciona os clusters ao mapa
        map.addLayer(markers);
    })
    .catch(error => {
        console.error('Erro ao carregar o JSON:', error);
    });
}

// Inicializa o carregamento dos dados
carregarDados();
