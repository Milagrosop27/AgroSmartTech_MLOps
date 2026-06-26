import os
from google.cloud import bigquery
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore


CARPETA_BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_JSON = os.path.join(CARPETA_BACKEND, "firebase-credenciales.json")

# ========================================================
# 1. INICIALIZAR FIREBASE (Añadir esto en la parte superior)
# ========================================================
# Si ya tienes credenciales por defecto de Google Cloud, esto basta:
if not firebase_admin._apps:
    firebase_admin.initialize_app()


db_firestore = firestore.client(database_id="alertas-agrosmart")

_bq_client = None
AREAS_DISPONIBLES = ['H1', 'H2', 'H3', 'H4', 'H5']
estados_registro = {}

def obtener_bq_client():
    global _bq_client
    if _bq_client is None:
        try:
            _bq_client = bigquery.Client()
        except Exception as e:
            print(f"⚠️ No se pudo inicializar BigQuery: {e}")
            _bq_client = None
    return _bq_client


def actualizar_alerta_firestore(telefono):
    try:
        # Busca en la colección 'historial_alertas' buscando el número de teléfono
        # y limitamos a la alerta más reciente.
        alertas_ref = db_firestore.collection('historial_alertas')

        # Filtramos por el teléfono exacto
        query = alertas_ref.where('telefono', '==', telefono).order_by('fecha_hora',
                                                                       direction=firestore.Query.DESCENDING).limit(1)

        resultados = query.stream()

        actualizado = False
        for doc in resultados:
            # ¡Aquí está la magia! Cambiamos PENDING o TIMEOUT a SUCCESS
            doc.reference.update({'estado': 'SUCCESS'})
            print(f"✅ Firestore: Alerta {doc.id} actualizada a SUCCESS para {telefono}")
            actualizado = True

        if not actualizado:
            print(f"⚠️ No se encontraron alertas pendientes para el número {telefono}")

    except Exception as e:
        print(f"❌ Error al conectar con Firestore: {e}")


def procesar_mensaje_entrante(data):
    mensaje = data.get('Body', '').strip()
    numero = data.get('From', '').replace('whatsapp:', '')
    mensaje_upper = mensaje.upper()

    # CONFIRMAR tiene prioridad absoluta
    if 'CONFIRMAR' in mensaje_upper:
        # LLAMAMOS A LA NUEVA FUNCIÓN AQUÍ ANTES DE RETORNAR
        actualizar_alerta_firestore(numero)

        return {"status": "confirmado", "telefono": numero}

    # Verificar si ya está registrado
    if agricultor_existe(numero):
        if numero in estados_registro:
            del estados_registro[numero]

        if any(saludo in mensaje_upper for saludo in ['HOLA', 'BUENAS', 'HI', 'BUENOS']):
            return {
                "status": "ya_registrado",
                "respuesta": "✅ Ya estás registrado en AgroSmart. Recibirás alertas cuando haya novedades en tu área. 🌱"
            }
        return {"status": "ignorado"}

    # Flujo de registro paso a paso
    if numero not in estados_registro:
        estados_registro[numero] = {"paso": 1}
        return {
            "status": "registro_iniciado",
            "respuesta": "¡Bienvenido a AgroSmart! 🌱\nPor favor ingresa tu *nombre*:"
        }

    paso_actual = estados_registro[numero].get("paso")

    if paso_actual == 1:
        # Guardamos nombre y pedimos apellidos
        estados_registro[numero]["nombre"] = mensaje
        estados_registro[numero]["paso"] = 2
        return {
            "status": "registro_paso2",
            "respuesta": f"Gracias *{mensaje}*. Ahora ingresa tus *apellidos*:"
        }

    elif paso_actual == 2:
        # Guardamos apellidos y asignamos área automáticamente
        apellidos = mensaje
        nombre = estados_registro[numero].get("nombre", "Agricultor")

        area = asignar_area()

        if area is None:
            del estados_registro[numero]
            return {
                "status": "sin_area",
                "respuesta": "⚠️ Lo sentimos, todas las áreas están ocupadas. Contacta al administrador para más información."
            }

        registrar_agricultor_completo(numero, nombre, apellidos, area)
        del estados_registro[numero]

        return {
            "status": "registro_completo",
            "respuesta": f"✅ ¡Registro completado, *{nombre} {apellidos}*!\nÁrea asignada: *{area}* 🌿\nYa puedes recibir alertas de AgroSmart. 🌱"
        }

    return {"status": "ignorado"}


def agricultor_existe(numero):
    client = obtener_bq_client()
    if client is None:
        return False
    try:
        query = f"""
            SELECT COUNT(*) as total
            FROM `agrosmart-tech-mlops.agrosmart_data.agricultores`
            WHERE telefono = '{numero}'
            AND fecha_registro >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 72 HOUR)
        """
        resultado = client.query(query).result()
        return list(resultado)[0].total > 0
    except Exception as e:
        print(f"⚠️ Error verificando agricultor: {e}")
        return False


def asignar_area():
    client = obtener_bq_client()
    if client is None:
        return None
    try:
        query = """
            SELECT area
            FROM `agrosmart-tech-mlops.agrosmart_data.agricultores`
            WHERE area IS NOT NULL
            AND fecha_registro >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 72 HOUR)
            ORDER BY fecha_registro ASC
        """
        resultado = client.query(query).result()
        areas_usadas = [row.area for row in resultado]

        for area in AREAS_DISPONIBLES:
            if area not in areas_usadas:
                return area

        return None  # Todas ocupadas
    except Exception as e:
        print(f"⚠️ Error asignando área: {e}")
        return None


def registrar_agricultor_completo(numero, nombre, apellidos, area):
    client = obtener_bq_client()
    if client is None:
        print("⚠️ BigQuery no disponible.")
        return
    try:
        fila = {
            "telefono": numero,
            "nombre": nombre,
            "apellidos": apellidos,
            "area": area,
            "fecha_registro": datetime.utcnow().isoformat()
        }
        client.insert_rows_json(
            "agrosmart-tech-mlops.agrosmart_data.agricultores",
            [fila]
        )
        print(f"✅ Agricultor registrado: {nombre} {apellidos} — {area} — {numero}")
    except Exception as e:
        print(f"⚠️ Error al registrar agricultor: {e}")