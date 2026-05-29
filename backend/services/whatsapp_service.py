import os
import requests
import logging

# Configuración de logs
logging.basicConfig(level=logging.INFO)

WA_PHONE_NUMBER_ID = "1058650747340948"
WA_VERSION = "v25.0"

# RECOMENDACIÓN: Intenta leer desde las variables de entorno de Cloud Run.
# Si no existe, usa tu token actual como respaldo (fallback).
WA_ACCESS_TOKEN = os.environ.get(
    "WA_ACCESS_TOKEN",
    "EAAcQ5iEtdekBRhrXAhiYCpVkZA5EpcglGX93TTk6THfHAoLvSbjxN3J7hTVlR0tTZBXJ0WKQGSNZBygGZAQv12jrPJGmu9IPDHwaD7gPKlKZB8xvI4qMIV08U1UyjIRWKlVr3fqNoHpjKBnUng3VUhEZCbNJEZASPsKPZAqJ50gsuJR1kNLzGBIm0Wm8L6ZCHnIicZArHXxUQHOf74hajX1u20VXzrWds8BYjk68pxAd6vwq8aVExNnkq9lBHYhOWNlnMj7fJuwaoh1m4vMmpjjwSwzxEU"
)

def enviar_plantilla_alerta(telefono, riesgo, farm_id, cultivo, ndvi, humedad, accion):
    """
    Envía una plantilla de alerta de AgroSmart a través de la API de WhatsApp de Meta.
    Asegura que todos los parámetros sean strings para evitar el Error 400.
    """
    url_meta = f"https://graph.facebook.com/{WA_VERSION}/{WA_PHONE_NUMBER_ID}/messages"

    headers = {
        "Authorization": f"Bearer {WA_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    # Estructura del payload alineada con la plantilla aprobada 'alerta_agrosmart_v2'
    payload = {
        "messaging_product": "whatsapp",
        "to": str(telefono),
        "type": "template",
        "template": {
            "name": "alerta_agrosmart_v2",
            "language": {"code": "es"},
            "components": [{
                "type": "body",
                "parameters": [
                    {"type": "text", "text": str(riesgo)},   # {{1}}
                    {"type": "text", "text": str(farm_id)},  # {{2}}
                    {"type": "text", "text": str(cultivo)},  # {{3}}
                    {"type": "text", "text": str(ndvi)},     # {{4}}
                    {"type": "text", "text": str(humedad)},  # {{5}}
                    {"type": "text", "text": str(accion)}    # {{6}}
                ]
            }]
        }
    }

    try:
        response = requests.post(url_meta, json=payload, headers=headers)
        response_data = response.json()

        if response.status_code == 200:
            logging.info(f"WhatsApp enviado exitosamente a {telefono}")
            return {
                "success": True,
                "meta_id": response_data.get('messages', [{}])[0].get('id')
            }
        else:
            logging.error(f"Meta rechazó el mensaje: {response_data}")
            return {
                "success": False,
                "error": "Rechazado por Meta",
                "detalles": response_data
            }
    except Exception as e:
        logging.error(f"Error de conexión con la API de Meta: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }