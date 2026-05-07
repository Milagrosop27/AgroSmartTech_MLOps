from flask import Flask, request, jsonify
import joblib
import pandas as pd
from pathlib import Path

# Inicializamos el servidor de Flask
app = Flask(__name__)

# Configuramos las rutas universales para encontrar los modelos
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / 'models'

# Cargar los datos en la memoria del servidor
try:
    # Modelo 1: El guardián
    modelo_guardian = joblib.load(MODELS_DIR / 'guardian_rf.pkl')
    preprocesador = joblib.load(MODELS_DIR / 'preprocesador_guardian.pkl')
    # Modelo 2: El Agrónomo
    modelo_agronomo = joblib.load(MODELS_DIR / 'agronomo_rf.pkl')
    preprocesador_agronomo = joblib.load(MODELS_DIR / 'preprocesador_agronomo.pkl')
    print(" Modelos de IA cargados correctamente.")
except Exception as e:
    print(f" Error al cargar los modelos: {e}")


# Ruta 1: Un endpoint de prueba para saber si el servidor está activo
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "proyecto": "AgroSmart Tech",
        "estado": "Activo",
        "mensaje": ["El Guardian esta monitoreando", "El Agronomo (Recomendacion de Fertilizante)"]
    })

# Ruta 2: Ventanilla del Guardián (Riesgos)
@app.route('/predecir', methods=['POST'])
def predecir():
    try:
        datos_json = request.get_json()
        df_nuevo = pd.DataFrame([datos_json])
        datos_procesados = preprocesador.transform(df_nuevo)
        prediccion = modelo_guardian.predict(datos_procesados)
        return jsonify({
            "estado_riesgo": prediccion[0],
            "status": "success"
        })
    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 400


# Ruta 3: Ventanilla del Agrónomo (Recomendación de Fertilizante)
@app.route('/recomendar_fertilizante', methods=['POST'])
def recomendar_fertilizante():
    try:
        datos_json = request.get_json()
        df_nuevo = pd.DataFrame([datos_json])
        datos_procesados = preprocesador_agronomo.transform(df_nuevo)
        prediccion = modelo_agronomo.predict(datos_procesados)
        return jsonify({
            "fertilizante_recomendado": prediccion[0],
            "status": "success"
        })
    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 400


# Arrancamos el servidor en el puerto 5000
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
