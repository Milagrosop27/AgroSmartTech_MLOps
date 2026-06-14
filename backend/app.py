import joblib
import pandas as pd
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import deque
from backend.services.whatsapp_service import enviar_alerta_twilio
from twilio.twiml.messaging_response import MessagingResponse
import logging
from google.cloud import bigquery
import datetime
import os
import time

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
PROJECT_ID = "agrosmart-tech-mlops"
TABLE_ID = f"{PROJECT_ID}.agrosmart_data.predicciones_iot"

bq_client = None

def obtener_bq_client():
    global bq_client
    if bq_client is None:
        try:
            bq_client = bigquery.Client()
            logging.info("Cliente de BigQuery inicializado correctamente.")
        except Exception as e:
            logging.error(f"No se pudo inicializar BigQuery: {e}")
            bq_client = None
    return bq_client


# Memoria temporal para guardar los números que han confirmado
confirmaciones_whatsapp = []
control_alertas = {}

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

def debe_enviar_alerta(farm_id):
    ahora = time.time()
    # Si nunca se ha enviado o hace más de 1 hora (3600 seg) que se envió
    if farm_id not in control_alertas or (ahora - control_alertas[farm_id] > 3600):
        control_alertas[farm_id] = ahora
        return True
    return False

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

def guardar_en_bigquery(datos_json_lista, riesgos, recomendaciones):
    client = obtener_bq_client()
    if client is None:
        logging.error("BigQuery no disponible. No se pueden guardar los datos.")
        return

    try:
        if not isinstance(datos_json_lista, list):
            datos_json_lista = [datos_json_lista]

        if not isinstance(riesgos, list):
            riesgos = [riesgos] * len(datos_json_lista)

        if not isinstance(recomendaciones, list):
            recomendaciones = [recomendaciones] * len(datos_json_lista)

        logging.info(f"Intentando insertar {len(datos_json_lista)} filas en {TABLE_ID}")

        filas = []
        timestamp_ahora = datetime.datetime.utcnow().isoformat()

        for i, dato in enumerate(datos_json_lista):
            riesgo = riesgos[i] if i < len(riesgos) else "Desconocido"
            recomendacion = recomendaciones[i] if i < len(recomendaciones) else "Sin recomendación"

            fila = {
                "fecha_hora": timestamp_ahora,
                "temperatura": round(float(dato.get('temperature_C', 0)), 2),
                "humedad": round(float(dato.get('humidity_%', 0)), 2),
                "ph": round(float(dato.get('soil_pH', 0)), 2),
                "ndvi": round(float(dato.get('NDVI_index', 0)), 2),
                "riesgo_enfermedad": str(riesgo),
                "recomendacion": str(recomendacion),
                "farm_id": str(dato.get('farm_id', 'FARM_UNKNOWN')),
                "crop_type": str(dato.get('crop_type', 'No especificado'))
            }
            filas.append(fila)

        logging.info(f"Filas preparadas para BigQuery: {len(filas)}")

        chunk_size = 500

        for i in range(0, len(filas), chunk_size):
            chunk = filas[i:i + chunk_size]
            logging.info(f"Insertando lote {i // chunk_size + 1} con {len(chunk)} filas...")

            errors = client.insert_rows_json(TABLE_ID, chunk)

            if errors:
                logging.error(f"Error parcial en BigQuery para el lote {i // chunk_size + 1}: {errors}")
            else:
                logging.info(f"Lote {i // chunk_size + 1} insertado con éxito.")

    except Exception as e:
        logging.error(f"Error CRÍTICO en conexión BQ: {e}")


@app.route('/predecir', methods=['POST'])
def predecir():
    try:
        datos_json = request.get_json()
        df_nuevo = pd.DataFrame(datos_json) if isinstance(datos_json, list) else pd.DataFrame([datos_json])

        # Aseguramos que todas las columnas esperadas por los preprocesadores existan.
        # Si faltan, las rellenamos con valores por defecto (numéricos = 0, categóricos = 'Unknown').
        required_columns = [
            'total_days','P','region','N','irrigation_type','rainfall_mm','soil_moisture_%',
            'sunlight_hours','K','yield_kg_per_hectare','fertilizer_type','pesticide_usage_ml'
        ]

        for col in required_columns:
            if col not in df_nuevo.columns:
                # Suponemos tipo categórico para columnas que contienen texto
                if col in ('region', 'irrigation_type', 'fertilizer_type'):
                    df_nuevo[col] = 'Unknown'
                else:
                    df_nuevo[col] = 0

        # 1. Predicción Guardián (Riesgo)
        proc_g = sistemas_ia['pre_guardian'].transform(df_nuevo)
        pred_g = sistemas_ia['modelo_guardian'].predict(proc_g)
        riesgos = sistemas_ia['le_guardian'].inverse_transform(pred_g).tolist()

        # 2. Predicción Agrónomo (Fertilizante)
        proc_a = sistemas_ia['pre_agronomo'].transform(df_nuevo)
        pred_a = sistemas_ia['modelo_agronomo'].predict(proc_a)
        recoms = sistemas_ia['le_agronomo'].inverse_transform(pred_a).tolist()

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

        # NOTA: El WhatsApp SOLO se envía cuando el usuario hace clic en el dashboard
        # NO se envía automáticamente desde /predecir
        # El flujo es: Simulador → /predecir (procesa y guarda) → Dashboard muestra → Usuario hace clic → /enviar-alerta-wa

        logging.info(f"Procesadas {len(riesgos)} predicciones. WhatsApp se enviará cuando el usuario lo solicite desde el dashboard.")

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
        logging.info(f"/datos-dashboard solicitado desde {request.remote_addr}")

        client = obtener_bq_client()
        if client is None:
            return jsonify([])

        # 👉 SIN GROUP BY - Trae TODOS los registros individuales
        minutos_historico = request.args.get('minutos', default=1440, type=int)

        query = f"""
            SELECT 
                fecha_hora,
                temperatura,
                humedad,
                ph,
                ndvi,
                riesgo_enfermedad,
                recomendacion,
                farm_id,
                crop_type
            FROM `{TABLE_ID}`
            WHERE riesgo_enfermedad NOT LIKE '%[%'
            AND fecha_hora >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {minutos_historico} MINUTE)
            ORDER BY fecha_hora DESC
            LIMIT 500
        """
        results = client.query(query).result()

        historico = []
        for row in results:
            historico.append({
                "fecha": row.fecha_hora.strftime('%H:%M:%S'),
                "temperature_C": round(float(row.temperatura), 2),
                "humidity_%": round(float(row.humedad), 2),
                "soil_pH": round(float(row.ph), 2),
                "NDVI_index": round(float(row.ndvi), 2),
                "diagnostico": str(row.riesgo_enfermedad),
                "recomendacion": str(row.recomendacion),
                "farm_id": str(row.farm_id),
                "crop_type": str(row.crop_type),
                "crop_disease_status": str(row.riesgo_enfermedad)
            })

        response = jsonify(historico[::-1])
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        logging.info(f"Dashboard: Retornando {len(historico)} registros individuales")
        return response

    except Exception as e:
        logging.error(f"Error en dashboard: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def home(): return jsonify({"status": "AgroSmart Live"})


@app.route('/enviar-alerta-wa', methods=['POST'])
def despachar_alerta_whatsapp():
    try:
        data = request.get_json()

        # 1. Extraer los datos
        telefono = data.get('telefono')
        riesgo = data.get('riesgo')
        farm_id = data.get('farm_id')
        cultivo = data.get('cultivo')
        ndvi = data.get('ndvi')
        humedad = data.get('humedad')
        accion = data.get('accion')

        # 2. Validar que lo esencial exista
        if not all([telefono, riesgo, accion]):
            return jsonify({"error": "Faltan datos obligatorios (teléfono, riesgo o acción)"}), 400

        # 3. Preparar el mensaje (diagnóstico consolidado)
        diagnostico_completo = f"Riesgo {riesgo} en {cultivo} (Parcela: {farm_id}). Humedad al {humedad}%, Vigor NDVI: {ndvi}."

        # 4. Llamar a la función UNA SOLA VEZ
        exito, mensaje_o_error = enviar_alerta_twilio(
            telefono_destino=telefono,
            riesgo=riesgo,
            farm_id=farm_id,
            cultivo=cultivo,
            ndvi=str(ndvi),
            humedad=str(humedad),
            accion=accion
        )

        if exito:
            return jsonify({"status": "success", "sid": mensaje_o_error}), 200
        else:
            return jsonify({"status": "error", "detalles": mensaje_o_error}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

#1. Twilio webhook
@app.route('/webhook', methods=['POST'])
def recibir_eventos_whatsapp():
    try:
        # 1. Twilio envía los datos como Formulario, no como JSON
        data = request.form
        from backend.services.webhook_service import procesar_mensaje_entrante

        resultado = procesar_mensaje_entrante(data)

        # 2. Si el servicio detectó el "CONFIRMAR"
        if resultado.get("status") == "confirmado":
            telefono = resultado.get("telefono")
            confirmaciones_whatsapp.append(telefono)
            logging.info(f"¡Acción confirmada por el usuario {telefono}!")

        # 3. Responderle a Twilio en su idioma (XML) para que no marque error
        resp = MessagingResponse()
        return str(resp), 200

    except Exception as e:
        logging.error(f"Error en el webhook POST: {e}")
        # Siempre devolver TwiML a Twilio aunque falle
        return str(MessagingResponse()), 500

# 2. Ruta para que React pregunte si hay confirmaciones (Polling)
@app.route('/api/confirmaciones', methods=['GET'])
def obtener_confirmaciones():
    global confirmaciones_whatsapp
    # Hacemos una copia de las confirmaciones actuales
    copia_confirmadas = list(confirmaciones_whatsapp)
    # Limpiamos la memoria para que React no confirme dos veces la misma acción
    confirmaciones_whatsapp.clear()

    return jsonify({"confirmadas": copia_confirmadas}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)