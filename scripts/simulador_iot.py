import pandas as pd
import numpy as np
from pathlib import Path
import requests
import time
import json


# 1. CONFIGURACIÓN

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'

ruta_iot = DATA_DIR / 'Smart_Farming_Crop_Yield_2024.csv'
ruta_quimico = DATA_DIR / 'Crop_recommendation.csv'

URL_API = "http://localhost:5000/predecir"


# 2. MOTOR DE SIMULACIÓN

def generar_y_enviar_microbatch():
    print("Recolectando datos de los sensores en el campo...")
    df_iot = pd.read_csv(ruta_iot)
    df_quimico = pd.read_csv(ruta_quimico)

    np.random.seed(42)
    cultivos_originales = df_iot['crop_type'].unique()
    etiquetas_quimico = df_quimico['label'].unique()
    mapa_nutricional = {cultivo: np.random.choice(etiquetas_quimico) for cultivo in cultivos_originales}

    # Transformación: Escalar el IoT a 50,000 registros
    df_ampliado = df_iot.sample(500)

    # Añadimos ruido estadístico dinámico para que los datos cambien cada minuto
    ruido_temp = np.random.normal(0, 0.5, size=len(df_ampliado))
    ruido_hum = np.random.normal(0, 1.2, size=len(df_ampliado))
    df_ampliado['temperature_C'] = df_ampliado['temperature_C'] + ruido_temp
    df_ampliado['humidity_%'] = (df_ampliado['humidity_%'] + ruido_hum).clip(lower=0, upper=100)

    print(" Analizando niveles de nutrientes N, P, K...")
    lista_nutrientes = []
    for cultivo in df_ampliado['crop_type']:
        equivalente = mapa_nutricional[cultivo]
        fila_npk = df_quimico[df_quimico['label'] == equivalente].sample(1)
        lista_nutrientes.append(fila_npk[['N', 'P', 'K']].values[0])

    df_npk = pd.DataFrame(lista_nutrientes, columns=['N', 'P', 'K'])
    df_maestro = pd.concat([df_ampliado, df_npk], axis=1)

    # Limpiamos las columnas irrelevantes antes de enviar a la API
    columnas_irrelevantes = ['farm_id', 'sensor_id', 'timestamp', 'sowing_date', 'harvest_date', 'latitude',
                             'longitude', 'crop_disease_status']
    df_para_api = df_maestro.drop(columns=columnas_irrelevantes, errors='ignore')

    # Asegurar que no haya valores infinitos o NaN que rompan el JSON
    df_para_api = df_para_api.replace([np.inf, -np.inf], np.nan).fillna(0)
    payload = df_para_api.to_dict(orient='records')

    print(f"Enviando {len(payload)} registros a: {URL_API}")

    try:
        # Enviamos el POST a la API
        respuesta = requests.post(URL_API, json=payload)
        if respuesta.status_code == 200:
            print(" Se procesaron los registros con éxito")
        else:
            print(f"Error en la API: {respuesta.status_code} - {respuesta.text}")
    except Exception as e:
        print(f"No se pudo conectar a la API. Error: {e}")



# 3. EJECUCIÓN CONTINUA

if __name__ == '__main__':
    print(" INICIANDO SIMULADOR DE SENSORES IOT ")
    print("Presiona Ctrl+C en cualquier momento para detenerlo.\n")

    while True:
        generar_y_enviar_microbatch()
        print("Esperando 60 segundos para la siguiente lectura de sensores...\n")
        time.sleep(60)  # Pausa de 1 minuto