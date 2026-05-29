import pandas as pd
import numpy as np
from pathlib import Path
import requests
import time
import logging

# Configuración de logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# 1. CONFIGURACIÓN
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'

RUTA_DATASET_BASE = DATA_DIR / 'Dataset_Smart_Farming_base.csv'

# URL para producción en Google Cloud Run
URL_API = "https://agrosmart-api-940420015515.us-central1.run.app/predecir"
REGISTROS_POR_MINUTO = 50000


# 2. MOTOR DE SIMULACIÓN
def generar_y_enviar_microbatch():
    logging.info("Iniciando recolección de datos desde el dataset unificado...")

    try:
        df_base = pd.read_csv(RUTA_DATASET_BASE)
    except FileNotFoundError as e:
        logging.error(f"Archivo no encontrado: {e}")
        return

    # Extraemos 50,000 registros manteniendo la correlación real de las variables
    df_ampliado = df_base.sample(n=REGISTROS_POR_MINUTO, replace=True).reset_index(drop=True)

    # Inyección de ruido estadístico para simular variabilidad natural del clima en tiempo real
    np.random.seed(int(time.time()))
    ruido_temp = np.random.normal(0, 0.5, size=len(df_ampliado))
    ruido_hum = np.random.normal(0, 1.2, size=len(df_ampliado))

    df_ampliado['temperature_C'] = df_ampliado['temperature_C'] + ruido_temp
    df_ampliado['humidity_%'] = (df_ampliado['humidity_%'] + ruido_hum).clip(lower=0, upper=100)

    # Eliminamos variables identificadoras y la variable objetivo de enfermedades (la cual predecirá la IA)
    # Nota: Mantenemos 'fertilizer_type' en el envío porque el modelo Guardian lo necesita como input
    columnas_irrelevantes = [
        'sensor_id', 'timestamp', 'sowing_date',
        'harvest_date', 'latitude', 'longitude', 'crop_disease_status'
    ]
    df_para_api = df_ampliado.drop(columns=columnas_irrelevantes, errors='ignore')

    # Limpieza de valores anómalos para asegurar el formato JSON
    df_para_api = df_para_api.replace([np.inf, -np.inf], np.nan).fillna(0)
    payload = df_para_api.to_dict(orient='records')

    logging.info(f"Enviando lote de {len(payload)} registros correlacionados a {URL_API}...")

    # Transmisión a la API
    try:
        respuesta = requests.post(URL_API, json=payload, timeout=60)
        if respuesta.status_code == 200:
            datos_respuesta = respuesta.json()
            procesados = datos_respuesta.get('registros_procesados', 0)
            logging.info(f"Éxito: La API procesó {procesados} registros correctamente.")
        else:
            logging.error(f"Fallo en la API ({respuesta.status_code}): {respuesta.text}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Error de conexión con la API: {e}")


# 3. EJECUCIÓN CONTINUA
if __name__ == '__main__':
    logging.info("INICIANDO SIMULADOR IOT - 5000 REGISTROS POR ENVÍO")
    logging.info("Presiona Ctrl+C para detener la ejecución.")

    try:
        while True:
            generar_y_enviar_microbatch()
            logging.info("Ciclo completado. Esperando 15 segundos para el siguiente envío...")
            time.sleep(15)
    except KeyboardInterrupt:
        logging.info("Simulador detenido manualmente por el usuario.")