import joblib
import pandas as pd
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Inicializamos Flask
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- CONFIGURACIÓN DE RUTAS ---
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / 'models'

logging.info(f"Ruta raíz detectada: {BASE_DIR}")
logging.info(f"Buscando modelos en: {MODELS_DIR}")

# Diccionario global para mantener los modelos en memoria
sistemas_ia = {}


def cargar_recursos():
    """Carga los modelos Random Forest, preprocesadores y codificadores desde los .pkl"""
    try:
        # Carga Guardián (Riesgo de Enfermedad)
        sistemas_ia['modelo_guardian'] = joblib.load(MODELS_DIR / 'guardian_rf.pkl')
        sistemas_ia['pre_guardian'] = joblib.load(MODELS_DIR / 'preprocesador_guardian.pkl')
        sistemas_ia['le_guardian'] = joblib.load(MODELS_DIR / 'label_encoder_guardian.pkl')

        # Carga Agrónomo (Recomendación de Fertilizante)
        sistemas_ia['modelo_agronomo'] = joblib.load(MODELS_DIR / 'agronomo_rf.pkl')
        sistemas_ia['pre_agronomo'] = joblib.load(MODELS_DIR / 'preprocesador_agronomo.pkl')
        sistemas_ia['le_agronomo'] = joblib.load(MODELS_DIR / 'label_encoder_agronomo.pkl')

        logging.info("Modelos Random Forest y preprocesadores cargados correctamente.")
    except Exception as e:
        logging.error(f"Error crítico al cargar los modelos: {e}")


# Ejecutar carga al iniciar el servidor
cargar_recursos()


# Ruta 1: Un endpoint de prueba para saber si el servidor está activo
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "proyecto": "AgroSmart Tech",
        "estado": "Activo",
        "arquitectura": "Stateless API con Flask",
        "mensaje": "El Guardian y el Agronomo están listos para recibir datos."
    })


# Ruta 2: Ventanilla del Guardián (Riesgos)
@app.route('/predecir', methods=['POST'])
def predecir():
    try:
        datos_json = request.get_json()

        # Convertir a DataFrame masivo
        df_nuevo = pd.DataFrame(datos_json) if isinstance(datos_json, list) else pd.DataFrame([datos_json])

        # Transformación y Predicción Vectorizada
        datos_procesados = sistemas_ia['pre_guardian'].transform(df_nuevo)
        prediccion_numerica = sistemas_ia['modelo_guardian'].predict(datos_procesados)

        # Decodificar números a las etiquetas originales (ej. "Mild", "Severe")
        prediccion_texto = sistemas_ia['le_guardian'].inverse_transform(prediccion_numerica)

        return jsonify({
            "estado_riesgo": prediccion_texto.tolist(),
            "status": "success",
            "registros_procesados": len(prediccion_texto)
        })
    except Exception as e:
        logging.error(f"Error en /predecir: {e}")
        return jsonify({"error": str(e), "status": "failed"}), 400


# Ruta 3: Ventanilla del Agrónomo (Recomendación de Fertilizante)
@app.route('/recomendar_fertilizante', methods=['POST'])
def recomendar_fertilizante():
    try:
        datos_json = request.get_json()

        # Convertir a DataFrame masivo
        df_nuevo = pd.DataFrame(datos_json) if isinstance(datos_json, list) else pd.DataFrame([datos_json])

        # Transformación y Predicción Vectorizada
        datos_procesados = sistemas_ia['pre_agronomo'].transform(df_nuevo)
        prediccion_numerica = sistemas_ia['modelo_agronomo'].predict(datos_procesados)

        # Decodificar números a las etiquetas originales (ej. "Organic", "Urea")
        prediccion_texto = sistemas_ia['le_agronomo'].inverse_transform(prediccion_numerica)

        return jsonify({
            "fertilizante_recomendado": prediccion_texto.tolist(),
            "status": "success",
            "registros_procesados": len(prediccion_texto)
        })
    except Exception as e:
        logging.error(f"Error en /recomendar_fertilizante: {e}")
        return jsonify({"error": str(e), "status": "failed"}), 400


# Arrancamos el servidor en el puerto 5000
if __name__ == '__main__':
    # host='0.0.0.0' es necesario para que servicios externos (o simuladores en otra IP) puedan conectarse
    app.run(host='0.0.0.0', port=5000)