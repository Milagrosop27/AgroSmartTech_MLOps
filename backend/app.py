import joblib
import pandas as pd
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import deque
from services.whatsapp_service import enviar_plantilla_alerta
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

# Memoria temporal para guardar los números que han confirmado
confirmaciones_whatsapp = []

def cargar_recursos():
    """Carga los modelos Random Forest, preprocesadores y codificadores"""
    try:
        sistemas_ia['modelo_guardian'] = joblib.load(MODELS_DIR / 'guardian_rf.pkl')
        sistemas_ia['pre_guardian'] = joblib.load(MODELS_DIR / 'preprocesador_guardian.pkl')
        sistemas_ia['le_guardian'] = joblib.load(MODELS_DIR / 'label_encoder_guardian.pkl')

        sistemas_ia['modelo_agronomo'] = joblib.load(MODELS_DIR / 'agronomo_rf.pkl')
        sistemas_ia['pre_agronomo'] = joblib.load(MODELS_DIR / 'preprocesador_agronomo.pkl')
        sistemas_ia['le_agronomo'] = joblib.load(MODELS_DIR / 'label_encoder_agronomo.pkl')

        logging.info("Sistemas IA cargados correctamente.")
    except Exception as e:
        logging.error(f"Error crítico al cargar modelos: {e}")


cargar_recursos()

# --- SISTEMA EXPERTO BASADO EN REGLAS (IoT RIEGO) ---
def calcular_estado_riego(humedad, temperatura):
    if humedad < 30 and temperatura > 30:
        return "Activar Riego de Emergencia (Máx)"
    elif humedad < 40:
        return "Activar Riego Moderado (Goteo)"
    elif humedad > 70:
        return "Pausar Riego (Riesgo de hongos)"
    else:
        return "Humedad Óptima (No requiere riego)"


# MODIFICADO: Ahora extrae farm_id y crop_type del simulador
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
                "recomendacion": str(recomendaciones[i]),
                # NUEVAS COLUMNAS CAPTURADAS DINÁMICAMENTE DEL SIMULADOR:
                "farm_id": str(dato.get('farm_id', 'FARM_UNKNOWN')),
                "crop_type": str(dato.get('crop_type', 'No especificado'))
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

        # 3. Fusión de IA + IoT (Fertilizante + Riego)
        recoms_combinadas = []
        for i, row in df_nuevo.iterrows():
            humedad = float(row.get('humidity_%', 0))
            temperatura = float(row.get('temperature_C', 0))

            accion_riego = calcular_estado_riego(humedad, temperatura)
            accion_final = f"Aplicar {recoms[i]}. Además: {accion_riego}."
            recoms_combinadas.append(accion_final)

        # 4. Guardar en BigQuery (Mantiene el flujo estable)
        guardar_en_bigquery(datos_json, riesgos, recoms_combinadas)

        # EL RETURN SIGUE EXACTAMENTE IGUAL para no romper el simulador IoT
        return jsonify({
            "estado_riesgo": riesgos.tolist(),
            "status": "success",
            "registros_procesados": len(riesgos)
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
            # MODIFICADO: Agregamos farm_id y crop_type al JSON que React va a descargar
            historico.append({
                "fecha": row.fecha_hora.strftime('%H:%M:%S'),
                "temp": row.temperatura,
                "hum": row.humedad,
                "ph": row.ph,
                "ndvi": row.ndvi,
                "diagnostico": row.riesgo_enfermedad,
                "recomendacion": getattr(row, 'recomendacion', 'Revisión técnica'),
                "farm_id": getattr(row, 'farm_id', 'FARM_UNKNOWN'),
                "crop_type": getattr(row, 'crop_type', 'No especificado')
            })
        return jsonify(historico[::-1])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/', methods=['GET'])
def home(): return jsonify({"status": "AgroSmart Live"})


@app.route('/enviar-alerta-wa', methods=['POST'])
def despachar_alerta_whatsapp():
    try:
        data = request.get_json()

        telefono = data.get('telefono')
        riesgo = data.get('riesgo')
        farm_id = data.get('farm_id')
        cultivo = data.get('cultivo')
        ndvi = data.get('ndvi')
        humedad = data.get('humedad')
        accion = data.get('accion')

        if not all([telefono, riesgo, farm_id, cultivo, ndvi, str(humedad), accion]):
            return jsonify({"error": "Faltan datos para rellenar la plantilla de Meta"}), 400

        resultado = enviar_plantilla_alerta(telefono, riesgo, farm_id, cultivo, str(ndvi), str(humedad), accion)

        if resultado["success"]:
            return jsonify({"status": "success", "meta_id": resultado["meta_id"]}), 200
        else:
            return jsonify({"status": "error", "detalles": resultado}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/webhook', methods=['GET'])
def verificar_webhook():
    # Meta nos enviará un token que nosotros inventaremos
    TOKEN_SECRETO = "AgroSmart_Secreto_2026"

    modo = request.args.get('hub.mode')
    token = request.args.get('hub.verify_token')
    desafio = request.args.get('hub.challenge')

    if modo and token:
        if modo == 'subscribe' and token == TOKEN_SECRETO:
            logging.info("Webhook verificado por Meta exitosamente.")
            return desafio, 200
        else:
            return "Prohibido", 403
    return "Mala petición", 400


# 2. Ruta POST: Para recibir los clics de los agricultores
@app.route('/webhook', methods=['POST'])
def recibir_eventos_whatsapp():
    try:
        data = request.get_json()

        # Aquí llamamos a tu nuevo archivo de servicios para mantener app.py limpio
        from services.webhook_service import procesar_mensaje_entrante
        resultado = procesar_mensaje_entrante(data)

        # A Meta siempre hay que responderle rápido con un 200 OK, sino reintenta el envío
        return jsonify({"status": "recibido"}), 200

    except Exception as e:
        logging.error(f"Error en el webhook: {e}")
        return jsonify({"error": str(e)}), 500


# 1. Ruta para que Meta verifique tu servidor
@app.route('/webhook', methods=['GET'])
def verificar_webhook():
    TOKEN_SECRETO = "AgroSmart_Secreto_2026"  # Lo usaremos en Meta luego
    modo = request.args.get('hub.mode')
    token = request.args.get('hub.verify_token')
    desafio = request.args.get('hub.challenge')

    if modo and token:
        if modo == 'subscribe' and token == TOKEN_SECRETO:
            return desafio, 200
        else:
            return "Prohibido", 403
    return "Mala petición", 400


# 2. Ruta que recibe el clic de WhatsApp
@app.route('/webhook', methods=['POST'])
def recibir_eventos_whatsapp():
    try:
        data = request.get_json()
        from services.webhook_service import procesar_mensaje_entrante
        resultado = procesar_mensaje_entrante(data)

        # Si el servicio detectó el clic, guardamos el número en la memoria
        if resultado.get("status") == "confirmado":
            telefono = resultado.get("telefono")
            confirmaciones_whatsapp.append(telefono)

        return jsonify({"status": "recibido"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 3. Ruta para que React pregunte si hay confirmaciones (Polling)
@app.route('/api/confirmaciones', methods=['GET'])
def obtener_confirmaciones():
    global confirmaciones_whatsapp
    # Hacemos una copia de las confirmaciones actuales
    copia_confirmadas = list(confirmaciones_whatsapp)
    # Limpiamos la memoria para que React no confirme dos veces la misma acción
    confirmaciones_whatsapp.clear()

    return jsonify({"confirmadas": copia_confirmadas}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)