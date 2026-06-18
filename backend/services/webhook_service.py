from google.cloud import bigquery
from datetime import datetime

_bq_client = None

# Áreas disponibles en orden de asignación
AREAS_DISPONIBLES = ['H1', 'H2', 'H3', 'H4', 'H5']

# Estado temporal de registro por número (en memoria)
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


def procesar_mensaje_entrante(data):
    mensaje = data.get('Body', '').strip()
    numero = data.get('From', '').replace('whatsapp:', '')
    mensaje_upper = mensaje.upper()

    # CONFIRMAR tiene prioridad absoluta
    if 'CONFIRMAR' in mensaje_upper:
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