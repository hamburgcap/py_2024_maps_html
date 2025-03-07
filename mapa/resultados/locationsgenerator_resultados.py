import pandas as pd
import json
import requests
import tkinter as tk
from tkinter import filedialog
import time
import random
import os
import threading
import keyboard  # Biblioteca para capturar eventos de teclado
import datetime  # Certifique-se de importar o módulo no topo do script

api_key = "AIzaSyD6wxjknXJgG4-DxvO206GBFVNR5GI5wwM"
request_count = 0

def load_rda_file(file_path):
    """Carrega o arquivo Rda e retorna o dataframe correspondente."""
    import pyreadr
    result = pyreadr.read_r(file_path)  # Lê o arquivo Rda
    for key in result.keys():
        return result[key]  # Retorna o primeiro dataframe encontrado

def clean_address(address, filters):
    """Filtra endereços com base em múltiplos critérios e remove tudo após a 4ª vírgula."""
    if not any(f in address for f in filters):
        return None  # Ignora endereços que não contêm os filtros especificados
    cleaned = ','.join(address.split(',')[:8])
    return cleaned.strip(' ,')

def remove_last_segment(address):
    """Remove o último segmento do endereço baseado em vírgulas."""
    if ',' in address:  # Tenta remover segmentos separados por vírgula
        parts = address.rsplit(',', 1)
        return parts[0].strip() if len(parts) > 1 else address.strip()
    return address.strip()  # Se não houver nada para remover, retorna o endereço original

def get_geolocation(address, api_key, cidade, uf):  # Adicionado cidade e UF
    """Obtém a geolocalização para um endereço usando a API do Google Maps, com redução do endereço em caso de falha."""
    base_url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
    'key': api_key,
    'address': address,
    'region': 'br',
    'language': 'pt-BR',  # Resultados em português
    'components': f"locality:{cidade}|administrative_area:{uf}"
    }
    retry_interval = 5 * 60  # 5 minutos inicial
    max_retries = 5  # Número máximo de tentativas
    max_reductions = 20  # Limite máximo de reduções do endereço
    wait_between_reductions = random.randint(1, 3)  # Espera entre reduções (em segundos)

    reductions = 0
    while address and reductions <= max_reductions:
        for attempt in range(max_retries):
            print(f"\nTentativa {attempt + 1}/{max_retries} para o endereço: {address}")
            try:
                params['address'] = address
                response = requests.get(base_url, params=params, timeout=15)
                global request_count  # Permite acessar a variável global
                request_count += 1  # Incrementa o contador
                print(f"API Request #{request_count}: {response.url}")  # Loga a URL requisitada
                print(f"URL chamada: {response.url}")
                if response.status_code == 200:
                    data = response.json()
                    if 'results' in data and len(data['results']) > 0:
                        location = data['results'][0]['geometry']['location']
                        lat = location['lat']
                        lng = location['lng']
                        return lat, lng
                    else:
                        print(f"Endereço não encontrado: {address}")
                        break
                elif response.status_code == 403:
                    print(f"Erro HTTP 403 para o endereço: {address}. Verifique sua chave de API.")
                    return 0.00, 0.00
                else:
                    print(f"Erro HTTP {response.status_code} para o endereço: {address}")
            except requests.exceptions.RequestException as e:
                print(f"Erro na requisição: {e}. Aguardando {retry_interval // 60} minutos antes de tentar novamente...")
                time.sleep(retry_interval)
                retry_interval *= 2

        # Reduzir o endereço removendo o último segmento
        print(f"Reduzindo o endereço: {address}")
        address = remove_last_segment(address)
        reductions += 1
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] Endereço reduzido ({reductions}/{max_reductions}): {address}")

        if ',' not in address:  # Parar se restar apenas um segmento
            print("Endereço chegou a um único segmento. Parando a redução.")
            break

        print(f"Tentando novamente com endereço reduzido: {address}")
        time.sleep(wait_between_reductions)

    # Se todas as tentativas falharem, retornar 0.00, 0.00
    print(f"Falha ao obter coordenadas para o endereço: {address}. Definindo lat=0.00 e lng=0.00")
    return 0.00, 0.00

def open_file_dialog(title, filetypes):
    """Abre um seletor de arquivos para escolher o arquivo desejado."""
    root = tk.Tk()
    root.withdraw()  # Esconde a janela principal
    file_path = filedialog.askopenfilename(title=title, filetypes=filetypes)
    return file_path

def format_elapsed_time(elapsed_seconds):
    """Formata o tempo em horas, minutos e segundos."""
    hours = int(elapsed_seconds // 3600)
    minutes = int((elapsed_seconds % 3600) // 60)
    seconds = int(elapsed_seconds % 60)
    return f"{hours:02d}h:{minutes:02d}m:{seconds:02d}s"

def estimate_remaining_time(start_time, completed, total, wait_time):
    """Estima o tempo restante com base no progresso e tempo de espera."""
    if completed == 0:
        return "Calculando..."
    elapsed_time = time.time() - start_time
    avg_time_per_item = elapsed_time / completed
    remaining_items = total - completed
    estimated_time = remaining_items * (avg_time_per_item + wait_time)
    return format_elapsed_time(estimated_time)

def load_existing_locations():
    """Carrega locais já existentes no arquivo locations.json."""
    if os.path.exists('locations_resultados.json'):
        try:
            with open('locations_resultados.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("Erro ao decodificar o arquivo locations_resultados.json. O arquivo pode estar corrompido.")
    return []

def save_progress(locations):
    """Salva o progresso atual no arquivo locations_resultados.json."""
    with open('locations_resultados.json', 'w', encoding='utf-8') as f:
        json.dump(locations, f, ensure_ascii=False, indent=4)
    print("Progresso salvo no arquivo locations.json")

def save_history(locations):
    """Salva o histórico completo no arquivo locations_resultados_history.json."""
    with open('locations_resultados_history.json', 'w', encoding='utf-8') as f:
        json.dump(locations, f, ensure_ascii=False, indent=4)
    print("Histórico salvo no arquivo locations_resultados_history.json")

def monitor_save_request(locations):
    """Monitor para salvar o progresso quando a tecla '#' for pressionada."""
    while True:
        if keyboard.is_pressed('#'):
            save_progress(locations)  # Salva o progresso no locations.json
            save_history(locations)  # Salva o histórico no locations_history.json
            time.sleep(30)  # Evita múltiplas salvagens consecutivas

def save_request_count():
    """Salva o número total de requisições no arquivo request_count.json."""
    with open("request_count.json", "w") as f:
        json.dump({"total_requests": request_count}, f)

def load_request_count():
    """Carrega o número total de requisições do arquivo request_count.json."""
    global request_count
    if os.path.exists("request_count.json"):
        with open("request_count.json", "r") as f:
            data = json.load(f)
            request_count = data.get("total_requests", 0)

def main():
    start_time = time.time()  # Início do timer

    # Carregar locais já existentes
    existing_locations = load_existing_locations()
    print(f"Número de itens no locations.json: {len(existing_locations)}")
    existing_keys = {str(entry.get('n_do_imovel', 'NULL')) for entry in existing_locations}

    # Passo 1: Selecionar o arquivo Rda
    file_path = open_file_dialog("Selecione um arquivo Rda", [("Rda files", "*.Rda")])
    if not file_path:
        print("Nenhum arquivo selecionado.")
        return

    # Passo 2: Carregar o arquivo Rda
    df = load_rda_file(file_path).fillna('NULL')
    print(f"Número de itens no df.Rda: {len(df)}")

    if 'address' not in df.columns or 'n_do_imovel' not in df.columns:
        print("As colunas necessárias ('address', 'n_do_imovel') não foram encontradas no arquivo.")
        return

    total_items = len(df)
    locations = existing_locations.copy()
    wait_time = 15  # Tempo médio de espera entre requisições (em segundos)
    completed = 0

    # Iniciar o monitor de salvamento em uma thread separada
    threading.Thread(target=monitor_save_request, args=(locations,), daemon=True).start()

    # Identificar endereços existentes
    print("\nEndereços existentes no JSON e RDA que serão pulados:")
    skipped_count = sum(1 for _, row in df.iterrows() if str(row['n_do_imovel']) in existing_keys)
    print(f"Total de endereços a serem pulados: {skipped_count}")

    # Antes do loop, calcular o número total de itens a serem processados no Rda
    total_items_to_process = total_items - skipped_count  # Considerar itens do Rda que não estão no locations.json

    # Processamento dos endereços
    filters = ['']  # Filtros personalizados para endereços
    for idx, (_, row) in enumerate(df.iterrows(), start=1):
        key = str(row['n_do_imovel'])
        address = clean_address(row['address'], filters)

        if not address:
            continue  # Pula endereços que não atendem aos filtros

        if key in existing_keys:
            continue  # Pula endereços já existentes no locations.json

        print(f"\nProcessando {idx}/{total_items}: {address}")
        lat, lng = get_geolocation(address, api_key, row['cidade'], row['uf'])  # 🟨 Adicionado cidade e UF na chamada

        if lat is not None and lng is not None:
            row_data = {k: str(v) for k, v in row.to_dict().items()}
            row_data.update({"lat": lat, "lng": lng, "name": address})
            locations.append(row_data)
            existing_keys.add(key)
            print(f"- Coordenadas encontradas: lat={lat}, lng={lng}")
        else:
            print("- Falha ao obter coordenadas")

        # Incrementa completed após o processamento do item, independentemente do sucesso
        completed += 1

        # Recalcula pendentes
        pending = total_items_to_process - completed

        # Calcula o tempo estimado para conclusão com base no intervalo médio do tempo random
        average_wait_time = 1/30  # Média de 30 a 50 segundos
        remaining_time_seconds = pending * average_wait_time
        remaining_time_formatted = format_elapsed_time(remaining_time_seconds)

        elapsed_time = time.time() - start_time
        print(f"Tempo passado: {format_elapsed_time(elapsed_time)}")
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] Endereços processados: {completed}, Endereços pendentes: {pending}")
        print(f"Tempo estimado para conclusão: {remaining_time_formatted}")

        time.sleep(0.1)

    # Filtrar locations.json para manter apenas itens do df.Rda
    df_keys = set(df['n_do_imovel'].astype(str))

    # Salvar o histórico completo antes de filtrar
    save_history(locations)

    # Filtrar a lista principal
    locations = [loc for loc in locations if str(loc.get('n_do_imovel', 'NULL')) in df_keys]

    # Salvar progresso filtrado no arquivo locations.json
    save_progress(locations)

if __name__ == "__main__":
    load_request_count()  # Carrega o contador salvo
    main()
    save_request_count()  # Salva o contador atualizado
    print(f"\nTotal API Requests Made: {request_count}")
