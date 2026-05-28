import logging


def procesar_mensaje_entrante(data):
    try:
        if data.get("object") == "whatsapp_business_account":
            for entry in data.get("entry", []):
                for change in entry.get("changes", []):
                    value = change.get("value", {})

                    if "messages" in value:
                        for msg in value["messages"]:
                            # ¿El mensaje es un clic de botón?
                            if msg.get("type") == "button":
                                boton_text = msg.get("button", {}).get("text")
                                telefono_agricultor = msg.get("from")

                                # Si es nuestro botón, confirmamos
                                if boton_text == "Ejecutar Acción":
                                    logging.info(f"✅ ACCIÓN CONFIRMADA por {telefono_agricultor}")
                                    return {"status": "confirmado", "telefono": telefono_agricultor}

        return {"status": "ignorado"}
    except Exception as e:
        logging.error(f"Error procesando webhook: {e}")
        return {"status": "error"}