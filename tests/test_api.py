import requests

print("Iniciando pruebas de la API de AgroSmart Tech")

url_guardian = 'http://127.0.0.1:5000/predecir'
datos_sensor = {
    "region": "Andina", "crop_type": "Papa", "irrigation_type": "Goteo",
    "fertilizer_type": "Orgánico", "soil_pH": 6.5, "soil_moisture_%": 45.0,
    "temperature_C": 18.5, "humidity_%": 70.0, "N": 20.0, "P": 15.0, "K": 25.0,
    "rainfall_mm": 120.0, "sunlight_hours": 6.5, "pesticide_usage_ml": 0.0,
    "NDVI_index": 0.65, "yield_kg_per_hectare": 25000.0, "total_days": 90
}

respuesta_guardian = requests.post(url_guardian, json=datos_sensor)
print("   Diagnóstico:", respuesta_guardian.json())


url_agronomo = 'http://127.0.0.1:5000/recomendar_fertilizante'
datos_suelo = {
    "region": "Andina", "crop_type": "Papa",
    "N": 10.0, "P": 15.0, "K": 20.0,
    "soil_pH": 6.0, "soil_moisture_%": 40.0
}

respuesta_agronomo = requests.post(url_agronomo, json=datos_suelo)
print("   Receta:", respuesta_agronomo.json())

print("Pruebas de la API completadas")