import joblib
import pandas as pd
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from backend.services.whatsapp_service import enviar_alerta_twilio
from twilio.twiml.messaging_response import MessagingResponse
import logging
from google.cloud import bigquery
import datetime
import os
import time
import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    RUTA_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), "firebase-credenciales.json")

    # Si el archivo existe (estas en tu PC local)
    if os.path.exists(RUTA_JSON):
        cred = credentials.Certificate(RUTA_JSON)
        firebase_admin.initialize_app(cred)
    else:
        # Si NO existe (estas en Cloud Run), usa las credenciales automáticas de la nube
        firebase_admin.initialize_app()

db_firestore = firestore.client(database_id="alertas-agrosmart")


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- CONFIGURACION DE RUTAS ---
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / 'models'

sistemas_ia = {}

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


confirmaciones_whatsapp = []
control_alertas = {}

def cargar_recursos():
    """Carga los modelos Random Forest, preprocesadores y codificadores."""
    try:
        sistemas_ia['modelo_guardian'] = joblib.load(MODELS_DIR / 'guardian_rf.pkl')
        sistemas_ia['pre_guardian']    = joblib.load(MODELS_DIR / 'preprocesador_guardian.pkl')
        sistemas_ia['le_guardian']     = joblib.load(MODELS_DIR / 'label_encoder_guardian.pkl')

        sistemas_ia['modelo_agronomo'] = joblib.load(MODELS_DIR / 'agronomo_rf.pkl')
        sistemas_ia['pre_agronomo']    = joblib.load(MODELS_DIR / 'preprocesador_agronomo.pkl')
        sistemas_ia['le_agronomo']     = joblib.load(MODELS_DIR / 'label_encoder_agronomo.pkl')

        logging.info("Sistemas IA cargados correctamente.")
    except Exception as e:
        logging.error(f"Error critico al cargar modelos: {e}")


cargar_recursos()

def debe_enviar_alerta(farm_id):
    ahora = time.time()
    if farm_id not in control_alertas or (ahora - control_alertas[farm_id] > 3600):
        control_alertas[farm_id] = ahora
        return True
    return False

# --- SISTEMA EXPERTO BASADO EN REGLAS (IoT RIEGO) ---
def calcular_estado_riego(humedad, temperatura):
    if humedad < 30 and temperatura > 30:
        return "Activar Riego de Emergencia (Max)"
    elif humedad < 40:
        return "Activar Riego Moderado (Goteo)"
    elif humedad > 70:
        return "Pausar Riego (Riesgo de hongos)"
    else:
        return "Humedad Optima (No requiere riego)"

def _normalizar_lista(val):
    """
    Convierte la salida de los modelos a una lista plana de strings.
    Maneja numpy arrays, listas anidadas y valores escalares.
    """
    if hasattr(val, "tolist") and not isinstance(val, list):
        try:
            val = val.tolist()
        except Exception:
            pass

    if isinstance(val, (str, bytes)):
        return [str(val)]

    if not isinstance(val, (list, tuple)):
        return [str(val)]

    flat = []
    for el in val:
        if hasattr(el, "tolist") and not isinstance(el, list):
            try:
                el = el.tolist()
            except Exception:
                pass
        if isinstance(el, (list, tuple)):
            for sub in el:
                flat.append(str(sub))
        else:
            flat.append(str(el))
    return flat


def guardar_en_bigquery(datos_json_lista, riesgos, recomendaciones):
    client = obtener_bq_client()
    if client is None:
        logging.error("BigQuery no disponible. No se pueden guardar los datos.")
        return

    try:
        if not isinstance(datos_json_lista, list):
            datos_json_lista = [datos_json_lista]

        riesgos        = _normalizar_lista(riesgos)
        recomendaciones = _normalizar_lista(recomendaciones)

        logging.info(f"Guardando {len(datos_json_lista)} registros en {TABLE_ID}.")

        filas = []
        timestamp_ahora = datetime.datetime.utcnow().isoformat()

        for i, dato in enumerate(datos_json_lista):
            riesgo       = riesgos[i]        if i < len(riesgos)         else "Desconocido"
            recomendacion = recomendaciones[i] if i < len(recomendaciones) else "Sin recomendacion"

            fila = {
                "fecha_hora":       timestamp_ahora,
                "temperatura":      round(float(dato.get('temperature_C', 0)), 2),
                "humedad":          round(float(dato.get('humidity_%', 0)), 2),
                "ph":               round(float(dato.get('soil_pH', 0)), 2),
                "ndvi":             round(float(dato.get('NDVI_index', 0)), 2),
                "riesgo_enfermedad": str(riesgo),
                "recomendacion":    str(recomendacion),
                "farm_id":          str(dato.get('farm_id', 'FARM_UNKNOWN')),
                "crop_type":        str(dato.get('crop_type', 'No especificado'))
            }
            filas.append(fila)

        if filas:
            logging.info(f"Ejemplo fila[0]: {filas[0]}")

        chunk_size = 500
        for start in range(0, len(filas), chunk_size):
            chunk = filas[start:start + chunk_size]
            logging.info(f"Insertando lote {start // chunk_size + 1} con {len(chunk)} filas...")
            errors = client.insert_rows_json(TABLE_ID, chunk)
            if errors:
                logging.error(f"Error en lote {start // chunk_size + 1}: {errors}")
            else:
                logging.info(f"Lote {start // chunk_size + 1} insertado con exito.")

    except Exception as e:
        logging.error(f"Error en guardar_en_bigquery: {e}")


@app.route('/predecir', methods=['POST'])
def predecir():
    try:
        datos_json = request.get_json()
        df_nuevo = pd.DataFrame(datos_json) if isinstance(datos_json, list) else pd.DataFrame([datos_json])

        required_columns = [
            'total_days', 'P', 'region', 'N', 'irrigation_type', 'rainfall_mm',
            'soil_moisture_%', 'sunlight_hours', 'K', 'yield_kg_per_hectare',
            'fertilizer_type', 'pesticide_usage_ml'
        ]
        for col in required_columns:
            if col not in df_nuevo.columns:
                if col in ('region', 'irrigation_type', 'fertilizer_type'):
                    df_nuevo[col] = 'Unknown'
                else:
                    df_nuevo[col] = 0

        # Prediccion Guardian (riesgo de enfermedad)
        proc_g  = sistemas_ia['pre_guardian'].transform(df_nuevo)
        pred_g  = sistemas_ia['modelo_guardian'].predict(proc_g)
        riesgos = sistemas_ia['le_guardian'].inverse_transform(pred_g)

        # Prediccion Agronomo (recomendacion de fertilizante)
        proc_a = sistemas_ia['pre_agronomo'].transform(df_nuevo)
        pred_a = sistemas_ia['modelo_agronomo'].predict(proc_a)
        recoms = sistemas_ia['le_agronomo'].inverse_transform(pred_a)

        # Fusion IA + reglas IoT (fertilizante + estado de riego)
        recoms_combinadas = []
        for i, row in df_nuevo.iterrows():
            humedad     = float(row.get('humidity_%', 0))
            temperatura = float(row.get('temperature_C', 0))
            accion_riego = calcular_estado_riego(humedad, temperatura)
            recoms_combinadas.append(f"Aplicar {recoms[i]}. Ademas: {accion_riego}.")

        guardar_en_bigquery(datos_json, riesgos, recoms_combinadas)

        logging.info(f"Procesadas {len(riesgos)} predicciones.")

        return jsonify({
            "estado_riesgo":       riesgos.tolist(),
            "status":              "success",
            "registros_procesados": len(riesgos)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/datos-dashboard', methods=['GET'])
def datos_dashboard():
    """
    Retorna el historico de predicciones desde BigQuery.

    Parametros opcionales (query string):
      - minutos  : ventana temporal en minutos (default 1440 = 24h)
      - hectarea : filtra por hectarea, ej. ?hectarea=H1
                   Si se omite, devuelve todas las hectareas.
      - sector   : filtra por sector especifico dentro de la hectarea,
                   ej. ?hectarea=H1&sector=S03
                   Si se omite, devuelve todos los sectores de la hectarea.

    Logica de filtrado:
      - Sin parametros           → todos los farm_id
      - ?hectarea=H1             → farm_id LIKE 'H1_%'  (los 10 sectores de H1)
      - ?hectarea=H1&sector=S03  → farm_id = 'H1_S03'  (un sector exacto)
    """
    try:
        logging.info(f"/datos-dashboard solicitado desde {request.remote_addr}")

        client = obtener_bq_client()
        if client is None:
            return jsonify([])

        minutos_historico = request.args.get('minutos',   default=1440, type=int)
        hectarea          = request.args.get('hectarea',  default=None, type=str)
        sector            = request.args.get('sector',    default=None, type=str)

        # --- Construccion del filtro de zona ---
        # Se usa parametros posicionales de BigQuery (@param) para evitar SQL injection.
        filtro_zona  = ""
        query_params = []

        if hectarea and sector:
            # Sector exacto: farm_id = 'H1_S03'
            farm_id_exacto = f"{hectarea.upper()}_{sector.upper()}"
            filtro_zona    = "AND farm_id = @farm_id"
            query_params.append(
                bigquery.ScalarQueryParameter("farm_id", "STRING", farm_id_exacto)
            )
            logging.info(f"Filtro aplicado: sector exacto → {farm_id_exacto}")

        elif hectarea:
            # Todos los sectores de la hectarea: farm_id LIKE 'H1_%'
            prefijo     = f"{hectarea.upper()}_"
            filtro_zona = "AND STARTS_WITH(farm_id, @prefijo)"
            query_params.append(
                bigquery.ScalarQueryParameter("prefijo", "STRING", prefijo)
            )
            logging.info(f"Filtro aplicado: hectarea → {prefijo}*")

        else:
            logging.info("Sin filtro de zona: retornando todas las hectareas.")

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
            AND fecha_hora >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @minutos MINUTE)
            {filtro_zona}
            ORDER BY fecha_hora DESC
            LIMIT 500
        """

        # Agregamos el parametro de minutos al inicio de la lista
        query_params.insert(0,
            bigquery.ScalarQueryParameter("minutos", "INT64", minutos_historico)
        )

        job_config = bigquery.QueryJobConfig(query_parameters=query_params)
        results    = client.query(query, job_config=job_config).result()

        historico = []
        for row in results:
            historico.append({
                "fecha":              row.fecha_hora.strftime('%H:%M:%S'),
                "temperature_C":      round(float(row.temperatura), 2),
                "humidity_%":         round(float(row.humedad), 2),
                "soil_pH":            round(float(row.ph), 2),
                "NDVI_index":         round(float(row.ndvi), 2),
                "diagnostico":        str(row.riesgo_enfermedad),
                "recomendacion":      str(row.recomendacion),
                "farm_id":            str(row.farm_id),
                "crop_type":          str(row.crop_type),
                "crop_disease_status": str(row.riesgo_enfermedad)
            })

        response = jsonify(historico[::-1])
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        logging.info(f"Dashboard: retornando {len(historico)} registros.")
        return response

    except Exception as e:
        logging.error(f"Error en dashboard: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/zonas', methods=['GET'])
def obtener_zonas():
    """
    Devuelve el catalogo de hectareas y sectores activos en BigQuery.

    React lo usa para construir el selector de hectareas/sectores
    sin necesidad de hardcodear los IDs en el frontend.

    Respuesta ejemplo:
    {
      "hectareas": ["H1", "H2", "H3", "H4", "H5"],
      "sectores_por_hectarea": {
        "H1": ["H1_S01", "H1_S02", ...],
        ...
      }
    }
    """
    try:
        client = obtener_bq_client()
        if client is None:
            return jsonify({"error": "BigQuery no disponible"}), 500

        # Consultamos los farm_id distintos presentes en la ultima hora
        # para evitar mostrar zonas sin actividad reciente
        query = f"""
            SELECT DISTINCT farm_id
            FROM `{TABLE_ID}`
            WHERE farm_id != 'FARM_UNKNOWN'
            AND fecha_hora >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 120 MINUTE)
            ORDER BY farm_id
        """
        results = client.query(query).result()

        sectores_por_hectarea = {}
        for row in results:
            fid = str(row.farm_id)
            # farm_id tiene formato "H1_S01"
            partes = fid.split("_")
            if len(partes) == 2:
                h_id = partes[0]
                if h_id not in sectores_por_hectarea:
                    sectores_por_hectarea[h_id] = []
                sectores_por_hectarea[h_id].append(fid)

        hectareas = sorted(sectores_por_hectarea.keys())

        logging.info(f"/api/zonas: {len(hectareas)} hectareas activas.")
        return jsonify({
            "hectareas":              hectareas,
            "sectores_por_hectarea":  sectores_por_hectarea
        })

    except Exception as e:
        logging.error(f"Error en /api/zonas: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "AgroSmart Live"})


@app.route('/enviar-alerta-wa', methods=['POST'])
def despachar_alerta_whatsapp():
    try:
        data = request.get_json()

        telefono = data.get('telefono')
        riesgo   = data.get('riesgo')
        farm_id  = data.get('farm_id')
        cultivo  = data.get('cultivo')
        ndvi     = data.get('ndvi')
        humedad  = data.get('humedad')
        accion   = data.get('accion')

        if not all([telefono, riesgo, accion]):
            return jsonify({"error": "Faltan datos obligatorios (telefono, riesgo o accion)"}), 400

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
            # =======================================================
            # 2. CREAR LA ALERTA EN FIRESTORE COMO "PENDING"
            # =======================================================
            try:
                nueva_alerta = {
                    "telefono": telefono,
                    "farm_id": farm_id,
                    "cultivo": cultivo,
                    "diagnostico": riesgo, # Llamado diagnostico para que React lo lea en los gráficos
                    "accion": accion,
                    "estado": "Esperando",
                    "fecha_hora": firestore.SERVER_TIMESTAMP
                }
                db_firestore.collection('historial_alertas').add(nueva_alerta)
                logging.info(f"✅ Firestore: Alerta PENDING registrada para {telefono}")
            except Exception as e:
                logging.error(f"❌ Error al guardar alerta en Firestore: {e}")
            # =======================================================

            return jsonify({"status": "success", "sid": mensaje_o_error}), 200
        else:
            return jsonify({"status": "error", "detalles": mensaje_o_error}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/webhook', methods=['POST'])
def recibir_eventos_whatsapp():
    try:
        data = request.form
        from backend.services.webhook_service import procesar_mensaje_entrante

        resultado = procesar_mensaje_entrante(data)
        resp = MessagingResponse()

        if resultado.get("status") == "confirmado":
            telefono = resultado.get("telefono")
            confirmaciones_whatsapp.append(telefono)
            logging.info(f"Accion confirmada por el usuario {telefono}.")

            try:
                alertas_ref = db_firestore.collection('historial_alertas')
                # Buscamos los documentos de este teléfono que estén esperando confirmación
                docs = alertas_ref.where('telefono', '==', telefono).where('estado', '==', 'Esperando').stream()

                for doc in docs:
                    # Actualizamos el estado al valor que tu React use para el botón verde (ej: "Realizado")
                    doc.reference.update({'estado': 'Realizado'})
                    logging.info(f"✅ Firestore actualizado a 'Realizado' para el doc {doc.id}")

            except Exception as e:
                logging.error(f"❌ Error al actualizar estado en Firestore desde Webhook: {e}")

        elif resultado.get("respuesta"):
            resp.message(resultado["respuesta"])

        return str(resp), 200

    except Exception as e:
        logging.error(f"Error en el webhook POST: {e}")
        return str(MessagingResponse()), 500


@app.route('/api/confirmaciones', methods=['GET'])
def obtener_confirmaciones():
    global confirmaciones_whatsapp
    copia_confirmadas = list(confirmaciones_whatsapp)
    confirmaciones_whatsapp.clear()
    return jsonify({"confirmadas": copia_confirmadas}), 200

@app.route('/api/agricultores', methods=['GET'])
def obtener_agricultores():
    try:
        client = obtener_bq_client()
        if client is None:
            return jsonify([]), 500

        query = """
            SELECT telefono, nombre, apellidos, area, fecha_registro
            FROM `agrosmart-tech-mlops.agrosmart_data.agricultores`
            WHERE fecha_registro >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 72 HOUR)
            ORDER BY area ASC, fecha_registro ASC
        """
        results = client.query(query).result()

        agricultores = []
        for row in results:
            agricultores.append({
                "telefono": row.telefono,
                "nombre": row.nombre,
                "apellidos": row.apellidos or '',
                "area": row.area or 'Sin área',
                "fecha_registro": row.fecha_registro.isoformat() if row.fecha_registro else None
            })

        logging.info(f"/api/agricultores: {len(agricultores)} registrados.")
        return jsonify(agricultores), 200

    except Exception as e:
        logging.error(f"Error en /api/agricultores: {e}")
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)