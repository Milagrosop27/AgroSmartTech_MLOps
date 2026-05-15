import joblib
import pandas as pd
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from google.cloud import bigquery
import datetime
import os

# Inicializamos Flask
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- CONFIGURACIÓN DE RUTAS ---
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / 'models'

logging.info(f"Ruta raíz detectada: {BASE_DIR}")
logging.info(f"Buscando modelos en: {MODELS_DIR}")

# Diccionario global para mantener los modelos en memoria
sistemas_ia = {}


# Inicializamos el cliente de BigQuery
bq_client = bigquery.Client()
# FORMATO: proyecto.dataset.tabla
TABLE_ID = "agrosmart-tech-mlops.agrosmart_data.predicciones_iot"


def guardar_en_bigquery(datos_json_lista, predicciones_texto):
    try:
        filas = []
        # Aseguramos que si llega un solo diccionario, se convierta en lista
        if not isinstance(datos_json_lista, list):
            datos_json_lista = [datos_json_lista]

        timestamp_ahora = datetime.datetime.utcnow().isoformat()

        # Iteramos sobre los registros
        for i, dato in enumerate(datos_json_lista):
            fila = {
                "fecha_hora": timestamp_ahora,
                "temperatura": round(float(dato.get('temperature_C', 0)), 2),
                "humedad": round(float(dato.get('humidity_%', 0)), 2),
                "ph": round(float(dato.get('soil_pH', 0)), 2),
                "ndvi": round(float(dato.get('NDVI_index', 0)), 2),
                "riesgo_enfermedad": str(predicciones_texto[i])
            }
            filas.append(fila)

        # Insertamos los 100 de un solo golpe
        errors = bq_client.insert_rows_json(TABLE_ID, filas)

        if errors:
            logging.error(f"Errores al insertar en BigQuery: {errors}")
        else:
            logging.info(f"¡Éxito! {len(filas)} datos guardados en BigQuery masivamente.")

    except Exception as e:
        logging.error(f"Error en la conexión masiva con BigQuery: {e}")



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
        df_nuevo = pd.DataFrame(datos_json) if isinstance(datos_json, list) else pd.DataFrame([datos_json])

        # Predicción
        datos_procesados = sistemas_ia['pre_guardian'].transform(df_nuevo)
        prediccion_numerica = sistemas_ia['modelo_guardian'].predict(datos_procesados)
        prediccion_texto = sistemas_ia['le_guardian'].inverse_transform(prediccion_numerica)

        # MANDAR A BIGQUERY: Guardar el lote completo
        guardar_en_bigquery(datos_json, prediccion_texto)

        return jsonify({
            "estado_riesgo": prediccion_texto.tolist(),
            "status": "success",
            "registros_procesados": len(prediccion_texto)
        })
    except Exception as e:
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


# ruta 4: DASHBOARD 
@app.route('/datos-dashboard', methods=['GET'])
def datos_dashboard():
    try:
        # Definimos el ID del proyecto directamente para evitar fallos
        PROJECT_ID = "agrosmart-tech-mlops"
        QUERY_TABLE = f"{PROJECT_ID}.agrosmart_data.predicciones_iot"

        # Consultamos los últimos 20 registros para que el gráfico no esté vacío
        query = f"""
            SELECT fecha_hora, temperatura, humedad, ph, ndvi, riesgo_enfermedad 
            FROM `{QUERY_TABLE}` 
            ORDER BY fecha_hora DESC 
            LIMIT 20
        """

        query_job = bq_client.query(query)
        results = query_job.result()

        historico = []
        for row in results:
            historico.append({
                "fecha": row.fecha_hora.strftime('%H:%M:%S'),
                "temp": row.temperatura,
                "hum": row.humedad,
                "ph": row.ph,
                "ndvi": row.ndvi,
                "diagnostico": row.riesgo_enfermedad
            })

        # IMPORTANTE: Invertimos la lista para que el gráfico se dibuje
        # de izquierda (pasado) a derecha (presente)
        return jsonify(historico[::-1])

    except Exception as e:
        logging.error(f"Error al consultar BigQuery para el dashboard: {e}")
        return jsonify({"error": str(e)}), 500


# Arrancamos el servidor en el puerto 5000
if __name__ == '__main__':
    # host='0.0.0.0' es necesario para que servicios externos (o simuladores en otra IP) puedan conectarse
    app.run(host='0.0.0.0', port=5000)