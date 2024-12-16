import pandas as pd
import json
import requests
import tkinter as tk
from tkinter import filedialog

def load_rda_file(file_path):
    """Carrega o arquivo Rda e retorna o dataframe correspondente."""
    import pyreadr
    result = pyreadr.read_r(file_path)  # Lê o arquivo Rda
    for key in result.keys():
        return result[key]  # Retorna o primeiro dataframe encontrado

def clean_address(address):
    """Filtra endereços contendo 'Curitiba', remove tudo após a 4ª vírgula e elimina 'Brasil'."""
    if 'PR,CURITIBA' not in address:
        return None  # Ignora endereços que não contêm Curitiba
    cleaned = ','.join(address.split(',')[:4])
    return cleaned.replace("Brasil", "").strip().strip(',')

def get_geolocation(address):
    """Obtém a geolocalização para um endereço usando uma API open-source (ex. Nominatim)."""
    base_url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': address,
        'format': 'json',
        'addressdetails': 0,
        'limit': 2  # Retorna até 2 resultados para maior precisão
    }
    headers = {
        'User-Agent': 'geo-fetch-script/1.0 (contact: your_email@example.com)'
    }
    response = requests.get(base_url, params=params, headers=headers)
    print(f"URL chamada: {response.url}")  # Mostra a URL exata para debug
    if response.status_code == 200 and response.json():
        for result in response.json():
            try:
                lat = float(result['lat'])
                lon = float(result['lon'])
                return lat, lon  # Retorna o primeiro resultado válido
            except (KeyError, ValueError):
                continue  # Ignora se houver erro nos dados
    print(f"Resposta vazia ou erro para o endereço: {address}")
    return None, None

def open_file_dialog():
    """Abre um seletor de arquivos para escolher o arquivo Rda."""
    root = tk.Tk()
    root.withdraw()  # Esconde a janela principal
    file_path = filedialog.askopenfilename(title="Selecione um arquivo Rda", filetypes=[("Rda files", "*.Rda")])
    return file_path

def main():
    # Passo 1: Selecionar o arquivo Rda
    file_path = open_file_dialog()
    if not file_path:
        print("Nenhum arquivo selecionado.")
        return

    # Passo 2: Carregar o arquivo Rda
    df = load_rda_file(file_path)
    if 'google_query' not in df.columns:
        print("A coluna 'google_query' não foi encontrada no arquivo.")
        return

    # Passo 3: Limpar endereços e obter coordenadas somente para 'Curitiba'
    addresses = df['google_query'].apply(clean_address).dropna()
    locations = []
    for address in addresses:
        print(f"Processando: {address}")
        lat, lng = get_geolocation(address)
        if lat is not None and lng is not None:
            locations.append({"lat": lat, "lng": lng, "name": address})
        else:
            print(f"Não foi possível encontrar coordenadas para: {address}")

    # Passo 4: Salvar resultados em JSON
    with open('locations.json', 'w', encoding='utf-8') as f:
        json.dump(locations, f, ensure_ascii=False, indent=4)

    print("Arquivo 'locations.json' criado com sucesso!")

if __name__ == "__main__":
    main()
