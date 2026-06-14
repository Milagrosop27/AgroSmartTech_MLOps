def procesar_mensaje_entrante(data):
    # .strip().upper() ya limpia espacios y mayúsculas, lo cual es perfecto
    mensaje = data.get('Body', '').strip().upper()
    telefono = data.get('From', '').replace('whatsapp:', '')

    # Si el usuario escribe "confirmar" o "confirmar." o " confirmar ", lo captará
    if 'CONFIRMAR' in mensaje:
        return {"status": "confirmado", "telefono": telefono}

    return {"status": "ignorado"}