import requests

# --- CREDENCIALES DE META (Las llenaremos en el Paso 3) ---
WA_PHONE_NUMBER_ID = "1058650747340948"
WA_ACCESS_TOKEN = "TOKEN"
WA_VERSION = "v25.0"


def enviar_plantilla_alerta(telefono, riesgo, recomendacion):
    """
    Se comunica con la API de Meta para despachar un mensaje de plantilla.
    """
    url_meta = f"https://graph.facebook.com/{WA_VERSION}/{WA_PHONE_NUMBER_ID}/messages"

    headers = {
        "Authorization": f"Bearer {WA_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    # Estructura exigida por Meta para mensajes de plantilla
    payload = {
        "messaging_product": "whatsapp",
        "to": telefono,
        "type": "template",
        "template": {
            "name": "agrosmart_alert",  # Crearemos esta plantilla en Meta
            "language": {
                "code": "es_PE"
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": riesgo},
                        {"type": "text", "text": recomendacion}
                    ]
                }
            ]
        }
    }

    try:
        response = requests.post(url_meta, json=payload, headers=headers)
        response_data = response.json()

        if response.status_code == 200:
            return {"success": True, "meta_id": response_data.get('messages', [{}])[0].get('id')}
        else:
            return {"success": False, "error": "Rechazado por Meta", "detalles": response_data}

    except Exception as e:
        return {"success": False, "error": str(e)}