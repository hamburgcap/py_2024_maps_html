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

def load_user_agents_from_csv():
    """Carrega a lista de User-Agents de um arquivo CSV na mesma pasta do script."""
    file_path = os.path.join(os.path.dirname(__file__), 'useragent.csv')
    try:
        df = pd.read_csv(file_path)
        if 'user_agent' in df.columns:
            return df['user_agent'].dropna().tolist()
        else:
            print("A coluna 'user_agent' não foi encontrada no arquivo CSV.")
    except FileNotFoundError:
        print(f"Arquivo 'useragent.csv' não encontrado na pasta: {file_path}")
    except Exception as e:
        print(f"Erro ao carregar o arquivo CSV: {e}")
    return []

def get_public_ip():
    """Obtém o endereço IP público usando um serviço externo."""
    try:
        response = requests.get('https://api.ipify.org?format=json', timeout=10)
        if response.status_code == 200:
            return response.json().get('ip')
    except requests.RequestException as e:
        print(f"Erro ao obter o IP público: {e}")
    return "IP desconhecido"

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
    cleaned = ','.join(address.split(',')[:4])
    return cleaned.replace("Brasil,", "").strip().strip(',')

def remove_last_segment(address):
    """Remove o último segmento do endereço baseado em vírgulas."""
    if ',' in address:  # Tenta remover segmentos separados por vírgula
        parts = address.rsplit(',', 1)
        return parts[0].strip() if len(parts) > 1 else address.strip()
    return address.strip()  # Se não houver nada para remover, retorna o endereço original

def get_geolocation(address, user_agents):
    """Obtém a geolocalização para um endereço usando a API Nominatim, com redução do endereço em caso de falha."""
    base_url = "https://nominatim.openstreetmap.org/search"
    params = {
        'format': 'json',
        'addressdetails': 0,
        'limit': 2  # Retorna até 2 resultados para maior precisão
    }
    retry_interval = 5 * 60  # 5 minutos inicial
    max_retries = 5  # Número máximo de tentativas
    max_reductions = 20  # Limite máximo de reduções do endereço
    wait_between_reductions = 20  # Espera de 10 segundos entre reduções do endereço

    reductions = 0
    while address and reductions <= max_reductions:
        for attempt in range(max_retries):
            headers = {'User-Agent': random.choice(user_agents)}
            current_ip = get_public_ip()
            print(f"\nTentativa {attempt + 1}/{max_retries} para o endereço: {address}")
            print(f"- User-Agent: {headers['User-Agent']}")
            print(f"- IP utilizado: {current_ip}")

            try:
                params['q'] = address
                response = requests.get(base_url, params=params, headers=headers, timeout=15)
                print(f"URL chamada: {response.url}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"Resposta do servidor: {data}")
                    if data:
                        lat = float(data[0]['lat'])
                        lon = float(data[0]['lon'])
                        return lat, lon
                    else:
                        print(f"Resposta vazia para o endereço: {address}")
                        break  # Tentar reduzir o endereço
                elif response.status_code == 403:
                    print(f"Erro HTTP 403 para o endereço: {address}. Mudando User-Agent e aguardando {retry_interval // 60} minutos...")
                    time.sleep(retry_interval)
                    retry_interval *= 2
                else:
                    print(f"Erro HTTP {response.status_code} para o endereço: {address}")
            except requests.exceptions.RequestException as e:
                print(f"Erro na requisição: {e}. Aguardando {retry_interval // 60} minutos antes de tentar novamente...")
                time.sleep(retry_interval)
                retry_interval *= 2

        # Reduzir o endereço removendo o último segmento
        print(f"Reduzindo o endereço: {address}")  # Adicionado log de redução
        address = remove_last_segment(address)
        reductions += 1
        print(f"Endereço reduzido ({reductions}/{max_reductions}): {address}")

        if ',' not in address:  # Parar se restar apenas um segmento
            print("Endereço chegou a um único segmento. Parando a redução.")
            break

        print(f"Tentando novamente com endereço reduzido: {address}")
        time.sleep(wait_between_reductions)  # Espera entre reduções do endereço

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
    if os.path.exists('locations.json'):
        try:
            with open('locations.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("Erro ao decodificar o arquivo locations.json. O arquivo pode estar corrompido.")
    return []

def save_progress(locations):
    """Salva o progresso atual no arquivo locations.json."""
    with open('locations.json', 'w', encoding='utf-8') as f:
        json.dump(locations, f, ensure_ascii=False, indent=4)
    print("Progresso salvo no arquivo locations.json")

def monitor_save_request(locations):
    """Monitor para salvar o progresso quando a tecla 'S' for pressionada."""
    while True:
        if keyboard.is_pressed('#'):
            save_progress(locations)
            time.sleep(30)  # Evita múltiplas salvagens consecutivas

def main():
    start_time = time.time()  # Início do timer

    # Carregar User-Agents do arquivo CSV
    user_agents = load_user_agents_from_csv()
    if not user_agents:
        print("Lista de User-Agents está vazia. Abortando...")
        return

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

    if 'google_query' not in df.columns or 'n_do_imovel' not in df.columns:
        print("As colunas necessárias ('google_query', 'n_do_imovel') não foram encontradas no arquivo.")
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

    # Processamento dos endereços
    filters = ['']  # Filtros personalizados para endereços
    for idx, (_, row) in enumerate(df.iterrows(), start=1):
        key = str(row['n_do_imovel'])
        address = clean_address(row['google_query'], filters)
        if not address:
            continue

        if key in existing_keys:
            print(f"\nPulando {idx}/{total_items}: n_do_imovel={key} já existe no arquivo.")
            completed += 1
            continue

        print(f"\nProcessando {idx}/{total_items}: {address}")
        lat, lng = get_geolocation(address, user_agents)
        completed += 1
        pending = total_items - completed

        if lat is not None and lng is not None:
            row_data = {k: str(v) for k, v in row.to_dict().items()}
            row_data.update({"lat": lat, "lng": lng, "name": address})
            locations.append(row_data)
            existing_keys.add(key)
            print(f"- Coordenadas encontradas: lat={lat}, lng={lng}")
        else:
            print("- Falha ao obter coordenadas")

        elapsed_time = time.time() - start_time
        remaining_time = estimate_remaining_time(start_time, completed, total_items, wait_time)
        print(f"Tempo passado: {format_elapsed_time(elapsed_time)}")
        print(f"Endereços processados: {completed}, Endereços pendentes: {pending}")
        print(f"Tempo estimado para conclusão: {remaining_time}")

        time.sleep(random.randint(10, 20))

    # Filtrar locations.json para manter apenas itens do df.Rda
    df_keys = set(df['n_do_imovel'].astype(str))
    locations = [loc for loc in locations if str(loc.get('n_do_imovel', 'NULL')) in df_keys]

    save_progress(locations)
    print(f"\nNúmero de itens no novo arquivo locations.json: {len(locations)}")
    print(f"\nExecução concluída: {format_elapsed_time(time.time() - start_time)}")
    print(f"\nNúmero de itens no df.Rda: {len(df)}")

if __name__ == "__main__":
    main()
