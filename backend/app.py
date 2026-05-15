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

# Diccionario global para mantener los modelos en memoria
sistemas_ia = {}

# Inicializamos el cliente de BigQuery
bq_client = bigquery.Client()
PROJECT_ID = "agrosmart-tech-mlops"
TABLE_ID = f"{PROJECT_ID}.agrosmart_data.predicciones_iot"


def cargar_recursos():
    """Carga los modelos Random Forest, preprocesadores y codificadores"""
    try:
        # Carga Guardián (Riesgo)
        sistemas_ia['modelo_guardian'] = joblib.load(MODELS_DIR / 'guardian_rf.pkl')
        sistemas_ia['pre_guardian'] = joblib.load(MODELS_DIR / 'preprocesador_guardian.pkl')
        sistemas_ia['le_guardian'] = joblib.load(MODELS_DIR / 'label_encoder_guardian.pkl')

        # Carga Agrónomo (Fertilizante)
        sistemas_ia['modelo_agronomo'] = joblib.load(MODELS_DIR / 'agronomo_rf.pkl')
        sistemas_ia['pre_agronomo'] = joblib.load(MODELS_DIR / 'preprocesador_agronomo.pkl')
        sistemas_ia['le_agronomo'] = joblib.load(MODELS_DIR / 'label_encoder_agronomo.pkl')

        logging.info("Sistemas IA cargados correctamente.")
    except Exception as e:
        logging.error(f"Error crítico al cargar modelos: {e}")


cargar_recursos()


def guardar_en_bigquery(datos_json_lista, riesgos, recomendaciones):
    try:
        filas = []
        if not isinstance(datos_json_lista, list):
            datos_json_lista = [datos_json_lista]

        timestamp_ahora = datetime.datetime.utcnow().isoformat()

        for i, dato in enumerate(datos_json_lista):
            fila = {
                "fecha_hora": timestamp_ahora,
                "temperatura": round(float(dato.get('temperature_C', 0)), 2),
                "humedad": round(float(dato.get('humidity_%', 0)), 2),
                "ph": round(float(dato.get('soil_pH', 0)), 2),
                "ndvi": round(float(dato.get('NDVI_index', 0)), 2),
                "riesgo_enfermedad": str(riesgos[i]),
                "recomendacion": str(recomendaciones[i])  # <-- NUEVA COLUMNA
            }
            filas.append(fila)

        errors = bq_client.insert_rows_json(TABLE_ID, filas)
        if errors: logging.error(f"Errores BQ: {errors}")
    except Exception as e:
        logging.error(f"Error conexión BQ: {e}")


@app.route('/predecir', methods=['POST'])
def predecir():
    try:
        datos_json = request.get_json()
        df_nuevo = pd.DataFrame(datos_json) if isinstance(datos_json, list) else pd.DataFrame([datos_json])

        # 1. Predicción Guardián (Riesgo)
        proc_g = sistemas_ia['pre_guardian'].transform(df_nuevo)
        pred_g = sistemas_ia['modelo_guardian'].predict(proc_g)
        riesgos = sistemas_ia['le_guardian'].inverse_transform(pred_g)

        # 2. Predicción Agrónomo (Fertilizante)
        proc_a = sistemas_ia['pre_agronomo'].transform(df_nuevo)
        pred_a = sistemas_ia['modelo_agronomo'].predict(proc_a)
        recoms = sistemas_ia['le_agronomo'].inverse_transform(pred_a)

        # 3. Guardar ambos en BigQuery
        guardar_en_bigquery(datos_json, riesgos, recoms)

        return jsonify({
            "estado_riesgo": riesgos.tolist(),  # Cambiamos 'riesgo' por 'estado_riesgo'
            "status": "success",
            "registros_procesados": len(riesgos)  # Esto es lo que lee el simulador
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/datos-dashboard', methods=['GET'])
def datos_dashboard():
    try:
        query = f"SELECT * FROM `{TABLE_ID}` ORDER BY fecha_hora DESC LIMIT 20"
        results = bq_client.query(query).result()

        historico = []
        for row in results:
            historico.append({
                "fecha": row.fecha_hora.strftime('%H:%M:%S'),
                "temp": row.temperatura,
                "hum": row.humedad,
                "ph": row.ph,
                "ndvi": row.ndvi,
                "diagnostico": row.riesgo_enfermedad,
                "recomendacion": getattr(row, 'recomendacion', 'Revisión técnica')
            })
        return jsonify(historico[::-1])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/', methods=['GET'])
def home(): return jsonify({"status": "AgroSmart Live"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)