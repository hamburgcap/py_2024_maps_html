from flask import Flask, render_template_string
import folium
import webbrowser
import threading
import os

app = Flask(__name__)

@app.route("/")
def mapa():
    # Dados podem vir de um banco de dados ou API
    locations = [
        {"lat": -23.550520, "lng": -46.633308, "name": "São Paulo"},
        {"lat": -22.906847, "lng": -43.172897, "name": "Rio de Janeiro"},
        {"lat": -19.815702, "lng": -43.954198, "name": "Belo Horizonte"}
    ]

    # Crie o mapa com as coordenadas
    mapa = folium.Map(location=[-23.550520, -46.633308], zoom_start=5)

    for location in locations:
        folium.Marker(
            location=[location["lat"], location["lng"]],
            popup=f"<b>{location['name']}</b>"
        ).add_to(mapa)

    # Retorne o mapa como HTML
    return render_template_string(mapa._repr_html_())

def abrir_navegador():
    """Abre o navegador na URL do servidor Flask."""
    webbrowser.open("http://127.0.0.1:5000/")

if __name__ == "__main__":
    # Verifique se é o processo principal antes de abrir o navegador
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        threading.Timer(1, abrir_navegador).start()
    app.run(debug=True)
