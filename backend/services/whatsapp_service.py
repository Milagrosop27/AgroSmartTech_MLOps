import os
from twilio.rest import Client


def enviar_alerta_twilio(telefono_destino, diagnostico, recomendacion):
    """
    Envía la alerta de AgroSmart usando Twilio WhatsApp Sandbox.
    """
    # 1. Cargar credenciales desde variables de entorno
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    twilio_number = os.environ.get('TWILIO_PHONE_NUMBER')

    # El destino debe tener el formato 'whatsapp:+51999999999'
    destino_formateado = f"whatsapp:{telefono_destino}"

    # 2. Armar el mensaje amigable
    mensaje = (
        f"🚨 *Alerta AgroSmart Tech* 🚨\n\n"
        f"📋 *Diagnóstico:* {diagnostico}\n"
        f"💡 *Acción:* {recomendacion}\n\n"
        f"🚜 Por favor, tome las medidas necesarias en el lote."
    )

    try:
        # 3. Inicializar cliente y enviar
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