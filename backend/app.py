import joblib
import pandas as pd
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import deque
from backend.services.whatsapp_service import enviar_plantilla_alerta
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
bq_client = bigquery.Client()
PROJECT_ID = "agrosmart-tech-mlops"
TABLE_ID = f"{PROJECT_ID}.agrosmart_data.predicciones_iot"

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
    try:
        # Aseguramos que el input sea una lista
        if not isinstance(datos_json_lista, list):
            datos_json_lista = [datos_json_lista]

        # Normalizamos riesgos y recomendaciones para que siempre sean listas
        if not isinstance(riesgos, list):
            riesgos = [riesgos] * len(datos_json_lista)

        if not isinstance(recomendaciones, list):
            recomendaciones = [recomendaciones] * len(datos_json_lista)

        logging.info(f"Intentando insertar {len(datos_json_lista)} filas en {TABLE_ID}")

        filas = []
        timestamp_ahora = datetime.datetime.utcnow().isoformat()

        for i, dato in enumerate(datos_json_lista):
            fila = {
                "fecha_hora": timestamp_ahora,
                "temperatura": round(float(dato.get('temperature_C', 0)), 2),
                "humedad": round(float(dato.get('humidity_%', 0)), 2),
                "ph": round(float(dato.get('soil_pH', 0)), 2),
                "ndvi": round(float(dato.get('NDVI_index', 0)), 2),
                "riesgo_enfermedad": str(riesgos[i]),  # <-- EL [i] ES VITAL AQUÍ
                "recomendacion": str(recomendaciones[i]),  # <-- Y AQUÍ
                "farm_id": str(dato.get('farm_id', 'FARM_UNKNOWN')),
                "crop_type": str(dato.get('crop_type', 'No especificado'))
            }
            filas.append(fila)

        logging.info(f"Filas preparadas para BigQuery: {len(filas)}")

        # NUEVA LÓGICA DE FRAGMENTACIÓN (CHUNKING)
        chunk_size = 500  # Enviamos lotes de 500 en 500 para evitar errores por payload grande

        for i in range(0, len(filas), chunk_size):
            chunk = filas[i:i + chunk_size]
            logging.info(f"Insertando lote {i // chunk_size + 1} con {len(chunk)} filas...")

            errors = bq_client.insert_rows_json(TABLE_ID, chunk)

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

        # --- DISPARO AUTOMÁTICO DE WHATSAPP ---
        for i, riesgo in enumerate(riesgos):
            if riesgo == "Severe":  # Solo si el modelo detecta riesgo alto
                dato_iot = datos_json[i] if isinstance(datos_json, list) else datos_json
                farm_id = str(dato_iot.get('farm_id', 'FARM_UNKNOWN'))

                if debe_enviar_alerta(farm_id):
                    try:
                        # Asegúrate de poner el número real con formato internacional
                        # Ejemplo: "51999888777"
                        enviar_plantilla_alerta(
                            telefono="51906967430",
                            riesgo=str(riesgo),
                            farm_id=farm_id,
                            cultivo=str(dato_iot.get('crop_type', 'N/A')),
                            ndvi=str(dato_iot.get('NDVI_index', '0')),
                            humedad=str(dato_iot.get('humidity_%', '0')),
                            accion=recoms_combinadas[i]
                        )
                        logging.info(f"¡Alerta automática enviada para {farm_id}!")
                    except Exception as e:
                        logging.error(f"Error al enviar WA automático: {e}")

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
        # Agrupamos los miles de datos del mismo segundo en UN solo punto promediado
        # Ignoramos la data corrupta de pruebas anteriores que tenga corchetes '['
        query = f"""
            SELECT 
                fecha_hora,
                AVG(temperatura) AS temperatura,
                AVG(humedad) AS humedad,
                AVG(ph) AS ph,
                AVG(ndvi) AS ndvi,
                ANY_VALUE(riesgo_enfermedad) AS riesgo_enfermedad,
                ANY_VALUE(recomendacion) AS recomendacion,
                ANY_VALUE(farm_id) AS farm_id,
                ANY_VALUE(crop_type) AS crop_type
            FROM `{TABLE_ID}`
            WHERE riesgo_enfermedad NOT LIKE '%[%'
            GROUP BY fecha_hora
            ORDER BY fecha_hora DESC
            LIMIT 50
        """
        results = bq_client.query(query).result()

        historico = []
        for row in results:
            historico.append({
                "fecha": row.fecha_hora.strftime('%H:%M:%S'),
                "temp": round(row.temperatura, 2),
                "hum": round(row.humedad, 2),
                "ph": round(row.ph, 2),
                "ndvi": round(row.ndvi, 2),
                "diagnostico": row.riesgo_enfermedad,
                "recomendacion": row.recomendacion,
                "farm_id": row.farm_id,
                "crop_type": row.crop_type
            })

        response = jsonify(historico[::-1])
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
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
        from backend.services.webhook_service import procesar_mensaje_entrante
        resultado = procesar_mensaje_entrante(data)

        # Si el servicio detectó el clic, guardamos el número en la memoria
        if resultado.get("status") == "confirmado":
            telefono = resultado.get("telefono")
            confirmaciones_whatsapp.append(telefono)
            logging.info(f"¡Acción confirmada por el usuario {telefono}!")
        return jsonify({"status": "recibido"}), 200
    except Exception as e:
        logging.error(f"Error en el webhook POST: {e}")
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
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)