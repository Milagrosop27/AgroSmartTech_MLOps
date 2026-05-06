import requests

# La dirección de tu Guardián
url = 'http://127.0.0.1:5000/predecir'

# Los nombres de estas variables AHORA SÍ coinciden exactamente con tu CSV original
datos_sensor = {
    "region": "Andina",
    "crop_type": "Papa",
    "irrigation_type": "Goteo",
    "fertilizer_type": "Orgánico",
    "soil_pH": 6.5,
    "soil_moisture_%": 45.0,
    "temperature_C": 18.5,
    "humidity_%": 70.0,
    "N": 20.0,               # Nitrógeno
    "P": 15.0,               # Fósforo
    "K": 25.0,               # Potasio
    "rainfall_mm": 120.0,    # Lluvia
    "sunlight_hours": 6.5,   # Horas de sol
    "pesticide_usage_ml": 0.0, # Uso de pesticida
    "NDVI_index": 0.65,      # Índice de vegetación
    "yield_kg_per_hectare": 25000.0, # Rendimiento esperado
    "total_days": 90         # Días de cultivo
}

print("Enviando datos exactos del sensor al servidor...")

respuesta = requests.post(url, json=datos_sensor)

print("\n Diagnóstico del Guardián:")
print(respuesta.json())