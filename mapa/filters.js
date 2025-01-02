// Função para alternar a exibição do painel de filtros
function toggleFilterPanel() {
    const filterPanel = document.getElementById('filter-panel');
    filterPanel.classList.toggle('hidden');
}

// Função para inicializar os filtros no painel
function inicializarFiltros() {
    const filterModalidadeDiv = document.getElementById('filter-modalidade');
    const filterTipoDiv = document.getElementById('filter-tipo');

    // Arrays com modalidades e tipos
    const modalidades = ['Venda Direta Online', 'Licitação Aberta', 'Leilão SFI - Edital Único', 'Venda Online'];
    const tipos = ['Casa', 'Apartamento', 'Loja', 'Sala', 'Terreno', 'Comercial', 'Galpão', 'Prédio', 'Sobrado', 'Outros', 'Gleba', 'Imóvel Rural'];

    // Renderizar modalidades de venda
    modalidades.forEach(modalidade => {
        const container = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = modalidade;
        checkbox.checked = true;
        checkbox.id = 'modalidade-' + modalidade;
        checkbox.addEventListener('change', atualizarMarcadores); // Certifique-se de que esta função está no escopo global

        const label = document.createElement('label');
        label.htmlFor = 'modalidade-' + modalidade;
        label.textContent = modalidade;

        container.appendChild(checkbox);
        container.appendChild(label);
        filterModalidadeDiv.appendChild(container);
    });

    // Renderizar tipos
    tipos.forEach(tipo => {
        const container = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = tipo;
        checkbox.checked = true;
        checkbox.id = 'tipo-' + tipo;
        checkbox.addEventListener('change', atualizarMarcadores); // Certifique-se de que esta função está no escopo global

        const label = document.createElement('label');
        label.htmlFor = 'tipo-' + tipo;
        label.textContent = tipo;

        container.appendChild(checkbox);
        container.appendChild(label);
        filterTipoDiv.appendChild(container);
    });
}

// Chamar a função para inicializar os filtros após carregar a página
document.addEventListener("DOMContentLoaded", inicializarFiltros);
