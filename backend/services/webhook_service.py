from google.cloud import bigquery
from datetime import datetime

_bq_client = None

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
    mensaje = data.get('Body', '').strip().upper()
    telefono = data.get('From', '').replace('whatsapp:', '')

    if telefono:
        registrar_agricultor_si_nuevo(telefono)

    if 'CONFIRMAR' in mensaje:
        return {"status": "confirmado", "telefono": telefono}

    return {"status": "ignorado"}


def registrar_agricultor_si_nuevo(numero):
    client = obtener_bq_client()
    if client is None:
        print("⚠️ BigQuery no disponible, no se registró el agricultor.")
        return

    try:
        query = f"""
            SELECT COUNT(*) as total 
            FROM `agrosmart-tech-mlops.agrosmart_data.agricultores`
            WHERE telefono = '{numero}'
        """
        resultado = client.query(query).result()
        total = list(resultado)[0].total

        if total == 0:
            fila = {
                "telefono": numero,
                "nombre": "Agricultor",
                "fecha_registro": datetime.utcnow().isoformat()
            }
            client.insert_rows_json(
                "agrosmart-tech-mlops.agrosmart_data.agricultores",
                [fila]
            )
            print(f"✅ Nuevo agricultor registrado: {numero}")

    except Exception as e:
        print(f"⚠️ Error al registrar agricultor: {e}")