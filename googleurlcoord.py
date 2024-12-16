from geopy.geocoders import Nominatim

def get_coordinates_with_geopy(address):
    # Ajustar e limpar o endereço
    clean_address = address.replace(',', ', ').replace('  ', ' ').strip()
    print(f"Endereço formatado: {clean_address}")

    try:
        # Inicializar o geolocalizador
        geolocator = Nominatim(user_agent="geoapi_explorer")
        location = geolocator.geocode(clean_address)

        if location:
            return location.latitude, location.longitude
        else:
            return "Coordenadas não encontradas para o endereço."
    except Exception as e:
        return f"Erro: {e}"

# Endereço fornecido
address = "RN,NATAL,RUA AEROPORTO DE CONGONHAS"
coordinates = get_coordinates_with_geopy(address)

print(f"Coordenadas: {coordinates}")
