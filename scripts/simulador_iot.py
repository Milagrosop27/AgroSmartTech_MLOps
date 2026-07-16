"""
simulador_iot.py — AgroSmart Tech
Fase 3: Escala a 5 hectáreas / 50 subsectores geo-referenciados.

Cambios respecto a la versión anterior:
  - 50 zonas fijas (H1_S01 … H5_S10), cada una con crop_type propio.
  - Sesgo de zona: temperatura y humedad base distintas por hectárea.
  - Eliminación de Fuga de Datos (Data Leakage).
  - Adaptado a la BD actual (sin region).
  - 1 registro por zona por ciclo (50 registros/envío).
  - Ciclo cada 60 segundos.
"""
import numpy as np
import pandas as pd
from pathlib import Path
import requests
import time
import logging
import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# ---------------------------------------------------------------------------
# 1. CONFIGURACIÓN GENERAL
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'
RUTA_DATASET_BASE = DATA_DIR / 'Dataset_Smart_Farming_base.csv'

URL_API = "https://agrosmart-api-940420015515.us-central1.run.app/predecir"

INTERVALO_SEGUNDOS = 60  # Un ciclo por minuto
CHUNK_SIZE = 500  # Límite de seguridad

# ---------------------------------------------------------------------------
# 2. DEFINICIÓN DE ZONAS GEO-REFERENCIADAS
# ---------------------------------------------------------------------------
HECTAREAS_CONFIG = {
    "H1": {"crop_type": "Maíz", "temp_base": 22.0, "hum_base": 70.0},
    "H2": {"crop_type": "Trigo", "temp_base": 20.0, "hum_base": 65.0},
    "H3": {"crop_type": "Soja", "temp_base": 24.0, "hum_base": 70.0},
    "H4": {"crop_type": "Algodón", "temp_base": 26.0, "hum_base": 60.0},
    "H5": {"crop_type": "Arroz", "temp_base": 25.0, "hum_base": 80.0},
}

SECTORES_POR_HECTAREA = [f"S{str(i).zfill(2)}" for i in range(1, 11)]

ZONAS = []
for h_id, h_conf in HECTAREAS_CONFIG.items():
    for s_id in SECTORES_POR_HECTAREA:
        ZONAS.append({
            "hectarea_id": h_id,
            "sector_id": s_id,
            "farm_id": f"{h_id}_{s_id}",
            "crop_type": h_conf["crop_type"],
            "temp_base": h_conf["temp_base"],
            "hum_base": h_conf["hum_base"],
        })


# ---------------------------------------------------------------------------
# 3. MOTOR DE SIMULACIÓN
# ---------------------------------------------------------------------------

def aplicar_sesgo_zona(zona: dict, df_base_row: pd.Series) -> dict:
    """Fuerza los valores para inducir estados en el modelo ML."""

    estado_target = np.random.choice(['Mild', 'Moderate', 'Severe'], p=[0.85, 0.10, 0.05])
    ruido_temp = float(np.random.normal(0, 0.5))
    ruido_hum = float(np.random.normal(0, 1.5))

    if estado_target == 'Mild':
        temperatura = zona["temp_base"] + ruido_temp
        humedad = zona["hum_base"] + ruido_hum
        ph = float(np.clip(df_base_row.get("soil_pH", 6.5) + np.random.normal(0, 0.1), 6.0, 7.0))
        ndvi = float(np.clip(df_base_row.get("NDVI_index", 0.8) + np.random.normal(0, 0.05), 0.7, 0.9))
        hum_suelo = float(np.clip(np.random.normal(80, 5), 70, 100))

    elif estado_target == 'Moderate':
        temperatura = zona["temp_base"] + 4.0 + ruido_temp
        humedad = zona["hum_base"] - 15.0 + ruido_hum
        ph = float(np.clip(df_base_row.get("soil_pH", 6.5) + np.random.normal(0, 0.2), 5.5, 7.5))
        ndvi = float(np.clip(df_base_row.get("NDVI_index", 0.5) + np.random.normal(0, 0.05), 0.4, 0.6))
        hum_suelo = float(np.clip(np.random.normal(40, 5), 30, 50))

    else:  # Severe
        temperatura = zona["temp_base"] + 8.0 + ruido_temp
        humedad = zona["hum_base"] - 25.0 + ruido_hum
        ph = float(np.clip(df_base_row.get("soil_pH", 6.5) + np.random.normal(0, 0.5), 4.0, 9.0))
        ndvi = float(np.clip(df_base_row.get("NDVI_index", 0.2) + np.random.normal(0, 0.05), 0.1, 0.3))
        hum_suelo = float(np.clip(np.random.normal(15, 3), 5, 25))


    campos_agronomicos = [
        "N", "P", "K",
        "rainfall_mm",
        "sunlight_hours",
        "irrigation_type"
    ]

    registro = {}
    for campo in campos_agronomicos:
        if campo in df_base_row.index:
            val = df_base_row[campo]
            if isinstance(val, (np.integer, np.int64)):
                val = int(val)
            elif isinstance(val, (np.floating, np.float64)):
                val = float(val)
            if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
                val = 0
            registro[campo] = val

    # Valores forzados (Dinámicos)
    registro["temperature_C"] = round(float(temperatura), 2)
    registro["humidity_%"] = round(float(np.clip(humedad, 0, 100)), 2)
    registro["soil_pH"] = round(ph, 2)
    registro["NDVI_index"] = round(ndvi, 3)
    registro["soil_moisture_%"] = round(hum_suelo, 2)

    # Identificadores y Contexto
    registro["farm_id"] = zona["farm_id"]
    registro["crop_type"] = zona["crop_type"]
    registro["timestamp"] = datetime.datetime.now().isoformat()

    return registro

def generar_y_enviar_microbatch(df_base: pd.DataFrame) -> None:
    logging.info(f"Generando microbatch para {len(ZONAS)} zonas geo-referenciadas...")
    np.random.seed(int(time.time()))

    filas_base = df_base.sample(n=len(ZONAS), replace=True).reset_index(drop=True)

    payload = []
    for i, zona in enumerate(ZONAS):
        registro = aplicar_sesgo_zona(zona, filas_base.iloc[i])
        payload.append(registro)

    logging.info(f"Ejemplo registro → farm_id: {payload[0]['farm_id']}, "
                 f"temp: {payload[0]['temperature_C']}°C, "
                 f"N: {payload[0]['N']}, P: {payload[0]['P']}, K: {payload[0]['K']}")

    # Envío a la API
    for start in range(0, len(payload), CHUNK_SIZE):
        chunk = payload[start:start + CHUNK_SIZE]
        try:
            respuesta = requests.post(URL_API, json=chunk, timeout=60)
            if respuesta.status_code == 200:
                datos = respuesta.json()
                procesados = datos.get("registros_procesados", len(chunk))
                logging.info(f"API procesó {procesados} registros correctamente.")
            else:
                logging.error(f"Error API ({respuesta.status_code}): {respuesta.text}")
        except requests.exceptions.RequestException as e:
            logging.error(f"Error de conexión con la API: {e}")


# ---------------------------------------------------------------------------
# 4. EJECUCIÓN CONTINUA
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.info("=" * 60)
    logging.info("INICIANDO SIMULADOR IOT — AGROSMART TECH FASE 3")
    logging.info("=" * 60)

    try:
        df_base = pd.read_csv(RUTA_DATASET_BASE)
        logging.info(f"Dataset base cargado: {len(df_base)} filas disponibles.")
    except FileNotFoundError as e:
        logging.critical(f"Dataset no encontrado: {e}")
        raise SystemExit(1)

    try:
        while True:
            generar_y_enviar_microbatch(df_base)
            time.sleep(INTERVALO_SEGUNDOS)
    except KeyboardInterrupt:
        logging.info("Simulador detenido manualmente.")