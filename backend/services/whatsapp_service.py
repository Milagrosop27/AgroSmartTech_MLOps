import requests
import logging

WA_PHONE_NUMBER_ID = "1058650747340948"
WA_ACCESS_TOKEN = "EAAcQ5iEtdekBRi3Hk5nZCrhb2yGrnb4Xg7ZBKLSjezr1xPJZBJsR3SLTYtEQLdi1NNCZCV9ZA6L0hZBIfSHUY8vFOGwljGr87q12iw7Y7g5EWrTbesxVUHi7art6MDJW1rjbeSejqRjY9iqGVTpx1v46WGMrrge6VlQ5GpH81hOlrPmMPlmJWPqtuZAz2jQhZA08l8f0azDvxJ2grKorZAV17refZC0JdFkCXiZCulb2HwtZAMiGDUIodWoZCr2PJ1kmPrmOin5nkyqTknuhZCFrrZAZCDLj6eGl"
WA_VERSION = "v25.0"

def enviar_plantilla_alerta(telefono, riesgo, farm_id, cultivo, ndvi, humedad, accion):
    url_meta = f"https://graph.facebook.com/{WA_VERSION}/{WA_PHONE_NUMBER_ID}/messages"

    headers = {
        "Authorization": f"Bearer {WA_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    # Mapa de parámetros siguiendo el orden de tu plantilla
    # {{1}}: Riesgo, {{2}}: FarmID, {{3}}: Cultivo, {{4}}: NDVI, {{5}}: Humedad, {{6}}: Acción
    payload = {
        "messaging_product": "whatsapp",
        "to": telefono,
        "type": "template",
        "template": {
            "name": "alerta_agrosmart_v2",
            "language": {"code": "es"},
            "components": [{
                "type": "body",
                "parameters": [
                    {"type": "text", "text": riesgo},   # {{1}}
                    {"type": "text", "text": farm_id},  # {{2}}
                    {"type": "text", "text": cultivo},  # {{3}}
                    {"type": "text", "text": ndvi},     # {{4}}
                    {"type": "text", "text": humedad},  # {{5}}
                    {"type": "text", "text": accion}    # {{6}}
                ]
            }]
        }
    }

    try:
        response = requests.post(url_meta, json=payload, headers=headers)
        response_data = response.json()

        if response.status_code == 200:
            return {"success": True, "meta_id": response_data.get('messages', [{}])[0].get('id')}
        else:
            logging.error(f"Meta rechazó el mensaje: {response_data}")
            return {"success": False, "error": "Rechazado por Meta", "detalles": response_data}
    except Exception as e:
        return {"success": False, "error": str(e)}