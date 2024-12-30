// Arquivo: filters.js

// Função debounce para limitar as chamadas frequentes
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Configura sliders e filtros
function configurarFiltros() {
    $(function() {
        $("#price-slider").slider({
            range: true,
            min: 0,
            max: 1000000,
            step: 1000,
            values: [0, 1000000],
            slide: debounce(function(event, ui) {
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
            slide: debounce(function(event, ui) {
                $("#discount-min").text(ui.values[0]);
                $("#discount-max").text(ui.values[1]);
                atualizarMarcadores();
            }, 200)
        });
        $("#discount-min").text($("#discount-slider").slider("values", 0));
        $("#discount-max").text($("#discount-slider").slider("values", 1));
    });
}

// Função para atualizar os marcadores com base nos filtros
function atualizarMarcadores() {
    var modalidadesSelecionadas = Array.from(document.querySelectorAll('#filter-modalidade input:checked')).map(checkbox => checkbox.value);
    var tiposSelecionados = Array.from(document.querySelectorAll('#filter-tipo input:checked')).map(checkbox => checkbox.value);
    var precoMin = $("#price-slider").slider("values", 0);
    var precoMax = $("#price-slider").slider("values", 1);
    var descontoMin = $("#discount-slider").slider("values", 0);
    var descontoMax = $("#discount-slider").slider("values", 1);

    // Remove todos os marcadores existentes do cluster
    markers.clearLayers();

    // Adiciona os marcadores correspondentes aos filtros
    allMarkers.forEach(function(item) {
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

// Inicializa os filtros
configurarFiltros();
