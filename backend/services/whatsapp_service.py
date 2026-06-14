import os
from twilio.rest import Client

def enviar_alerta_twilio(telefono_destino, riesgo, farm_id, cultivo, ndvi, humedad, accion):
    """
    Envía la alerta detallada de AgroSmart usando Twilio WhatsApp Sandbox.
    """
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    twilio_number = os.environ.get('TWILIO_PHONE_NUMBER')

    # Aseguramos el formato de WhatsApp
    destino_formateado = f"whatsapp:{telefono_destino}"

    # Aquí construimos el mensaje con el formato exacto que querías
    mensaje = (
        f"🚨 *ALERTA AGROSMART* 🚨\n"
        f"Se ha detectado un cambio en las condiciones del campo.\n\n"
        f"- *Nivel de Riesgo:* {riesgo}\n"
        f"- *Finca:* {farm_id}\n"
        f"- *Cultivo:* {cultivo}\n"
        f"- *Índice NDVI:* {ndvi}\n"
        f"- *Humedad del Suelo:* {humedad}%\n\n"
        f"🚜 *ACCIÓN INMEDIATA SUGERIDA:*\n"
        f"{accion}\n\n"
        f"⚠️ _Por favor, responda con la palabra *CONFIRMAR* para validar la ejecución._"
    )

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=mensaje,
            from_=twilio_number,
            to=destino_formateado
        )
        print(f"✅ Mensaje enviado con éxito. SID: {message.sid}")
        return True, message.sid

    except Exception as e:
        print(f"❌ Error al enviar mensaje por Twilio: {str(e)}")
        return False, str(e)