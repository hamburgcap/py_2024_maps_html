import json

# Tabela de limites dos estados brasileiros
limites_estados = [
    {"uf": "AC", "estado": "Acre", "lat_min": -12.00, "lat_max": -6.20, "lon_min": -75.00, "lon_max": -66.70},
    {"uf": "AL", "estado": "Alagoas", "lat_min": -11.50, "lat_max": -7.80, "lon_min": -39.00, "lon_max": -34.00},
    {"uf": "AM", "estado": "Amazonas", "lat_min": -10.80, "lat_max": 3.20, "lon_min": -74.00, "lon_max": -58.80},
    {"uf": "AP", "estado": "Amapá", "lat_min": -2.50, "lat_max": 4.00, "lon_min": -55.00, "lon_max": -49.00},
    {"uf": "BA", "estado": "Bahia", "lat_min": -19.40, "lat_max": -6.00, "lon_min": -47.60, "lon_max": -36.00},
    {"uf": "CE", "estado": "Ceará", "lat_min": -8.80, "lat_max": -1.80, "lon_min": -42.50, "lon_max": -36.80},
    {"uf": "DF", "estado": "Distrito Federal", "lat_min": -17.05, "lat_max": -14.50, "lon_min": -49.20, "lon_max": -46.20},
    {"uf": "ES", "estado": "Espírito Santo", "lat_min": -22.30, "lat_max": -16.90, "lon_min": -42.20, "lon_max": -38.80},
    {"uf": "GO", "estado": "Goiás", "lat_min": -20.50, "lat_max": -11.00, "lon_min": -53.80, "lon_max": -45.00},
    {"uf": "MA", "estado": "Maranhão", "lat_min": -8.00, "lat_max": 0.00, "lon_min": -49.00, "lon_max": -41.00},
    {"uf": "MG", "estado": "Minas Gerais", "lat_min": -23.90, "lat_max": -13.00, "lon_min": -52.10, "lon_max": -38.90},
    {"uf": "MS", "estado": "Mato Grosso do Sul", "lat_min": -24.90, "lat_max": -16.00, "lon_min": -58.60, "lon_max": -49.00},
    {"uf": "MT", "estado": "Mato Grosso", "lat_min": -18.50, "lat_max": -6.10, "lon_min": -62.50, "lon_max": -49.10},
    {"uf": "PA", "estado": "Pará", "lat_min": -10.60, "lat_max": 3.00, "lon_min": -57.10, "lon_max": -45.00},
    {"uf": "PB", "estado": "Paraíba", "lat_min": -9.30, "lat_max": -5.00, "lon_min": -39.90, "lon_max": -33.80},
    {"uf": "PE", "estado": "Pernambuco", "lat_min": -10.50, "lat_max": -6.10, "lon_min": -42.10, "lon_max": -33.80},
    {"uf": "PI", "estado": "Piauí", "lat_min": -11.10, "lat_max": -1.80, "lon_min": -46.90, "lon_max": -39.40},
    {"uf": "PR", "estado": "Paraná", "lat_min": -27.70, "lat_max": -21.90, "lon_min": -56.60, "lon_max": -47.00},
    {"uf": "RJ", "estado": "Rio de Janeiro", "lat_min": -24.40, "lat_max": -19.00, "lon_min": -45.80, "lon_max": -39.90},
    {"uf": "RN", "estado": "Rio Grande do Norte", "lat_min": -7.70, "lat_max": -3.80, "lon_min": -39.70, "lon_max": -34.20},
    {"uf": "RO", "estado": "Rondônia", "lat_min": -14.60, "lat_max": -7.00, "lon_min": -66.00, "lon_max": -59.90},
    {"uf": "RR", "estado": "Roraima", "lat_min": -0.50, "lat_max": 6.30, "lon_min": -65.90, "lon_max": -58.80},
    {"uf": "RS", "estado": "Rio Grande do Sul", "lat_min": -34.80, "lat_max": -26.10, "lon_min": -58.60, "lon_max": -48.70},
    {"uf": "SC", "estado": "Santa Catarina", "lat_min": -30.30, "lat_max": -24.70, "lon_min": -54.80, "lon_max": -47.60},
    {"uf": "SE", "estado": "Sergipe", "lat_min": -12.60, "lat_max": -8.50, "lon_min": -39.40, "lon_max": -35.40},
    {"uf": "SP", "estado": "São Paulo", "lat_min": -25.00, "lat_max": -18.70, "lon_min": -54.10, "lon_max": -43.00},
    {"uf": "TO", "estado": "Tocantins", "lat_min": -14.50, "lat_max": -4.10, "lon_min": -51.70, "lon_max": -45.40},
]

# Função para verificar se a coordenada pertence ao estado correto
def validar_coordenada(lat, lon, uf):
    for estado in limites_estados:
        if (
            estado["uf"] == uf
            and estado["lat_min"] <= lat <= estado["lat_max"]
            and estado["lon_min"] <= lon <= estado["lon_max"]
        ):
            return True
    return False

# Carregar o arquivo JSON
def carregar_arquivo(nome_arquivo):
    try:
        with open(nome_arquivo, "r", encoding="utf-8") as arquivo:
            return json.load(arquivo)
    except FileNotFoundError:
        print(f"Arquivo {nome_arquivo} não encontrado.")
        return []

# Salvar o arquivo JSON
def salvar_arquivo(nome_arquivo, dados):
    with open(nome_arquivo, "w", encoding="utf-8") as arquivo:
        json.dump(dados, arquivo, indent=4, ensure_ascii=False)

# Filtrar as entradas em um arquivo
def filtrar_enderecos(nome_arquivo):
    dados = carregar_arquivo(nome_arquivo)
    if not dados:
        return

    entradas_invalidas = []
    dados_filtrados = []

    for item in dados:
        if validar_coordenada(item["lat"], item["lng"], item["uf"]):
            dados_filtrados.append(item)
        else:
            entradas_invalidas.append(item)

    # Salvar dados válidos no arquivo
    salvar_arquivo(nome_arquivo, dados_filtrados)

    # Relatório
    print(f"Arquivo: {nome_arquivo}")
    print(f"Total de entradas inválidas: {len(entradas_invalidas)}")
    for invalido in entradas_invalidas:
        print(
            f"n_do_imovel: {invalido.get('n_do_imovel', 'N/A')}, "
            f"lat: {invalido.get('lat', 'N/A')}, "
            f"lng: {invalido.get('lng', 'N/A')}, "
            f"uf: {invalido.get('uf', 'N/A')}, "
            f"google_query: {invalido.get('google_query', 'N/A')}, "
            f"google_geo_link: {invalido.get('google_geo_link', 'N/A')}"
        )
    print("-" * 40)

# Executar o script para ambos os arquivos
if __name__ == "__main__":
    arquivos = ["locations.json", "locations_history.json"]
    for arquivo in arquivos:
        filtrar_enderecos(arquivo)
