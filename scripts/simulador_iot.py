"""
simulador_iot.py — AgroSmart Tech
Fase 3: Escala a 5 hectáreas / 50 subsectores geo-referenciados.

Cambios respecto a la versión anterior:
  - 50 zonas fijas (H1_S01 … H5_S10), cada una con crop_type propio.
  - Sesgo de zona: temperatura y humedad base distintas por hectárea.
  - farm_id incluido en cada registro del payload.
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

INTERVALO_SEGUNDOS = 60   # Un ciclo por minuto
CHUNK_SIZE         = 500  # Límite de seguridad para payload (no se alcanzará con 50)

# ---------------------------------------------------------------------------
# 2. DEFINICIÓN DE ZONAS GEO-REFERENCIADAS
#
# Estructura: { hectarea_id, sector_id, farm_id, crop_type,
#               temp_base, hum_base }
#
# temp_base / hum_base simulan condiciones micro-climáticas distintas por zona
# (H1 = zona costera más húmeda, H5 = zona interior más cálida y seca).
# ---------------------------------------------------------------------------
HECTAREAS_CONFIG = {
    "H1": {"crop_type": "Maíz",      "temp_base": 22.0, "hum_base": 72.0},
    "H2": {"crop_type": "Trigo",     "temp_base": 24.5, "hum_base": 65.0},
    "H3": {"crop_type": "Papa",      "temp_base": 18.0, "hum_base": 78.0},
    "H4": {"crop_type": "Quinua",    "temp_base": 15.5, "hum_base": 60.0},
    "H5": {"crop_type": "Espárrago", "temp_base": 28.0, "hum_base": 50.0},
}

SECTORES_POR_HECTAREA = [f"S{str(i).zfill(2)}" for i in range(1, 11)]  # S01 … S10

# Construimos el catálogo completo de 50 zonas
ZONAS = []
for h_id, h_conf in HECTAREAS_CONFIG.items():
    for s_id in SECTORES_POR_HECTAREA:
        ZONAS.append({
            "hectarea_id": h_id,
            "sector_id":   s_id,
            "farm_id":     f"{h_id}_{s_id}",   # Ej: "H1_S01"
            "crop_type":   h_conf["crop_type"],
            "temp_base":   h_conf["temp_base"],
            "hum_base":    h_conf["hum_base"],
        })

# ---------------------------------------------------------------------------
# 3. MOTOR DE SIMULACIÓN
# ---------------------------------------------------------------------------

def aplicar_sesgo_zona(zona: dict, df_base_row: pd.Series) -> dict:
    """
    Toma una fila del dataset base y la ajusta con el sesgo micro-climático
    de la zona específica.

    El sesgo se compone de:
      - Diferencia entre la temp/hum base de la zona y la media global del dataset.
      - Ruido gaussiano pequeño para simular variabilidad natural instante a instante.
    """
    # Ruido instante-a-instante
    ruido_temp = float(np.random.normal(0, 0.4))
    ruido_hum  = float(np.random.normal(0, 1.0))
    ruido_ph   = float(np.random.normal(0, 0.05))
    ruido_ndvi = float(np.random.normal(0, 0.01))

    # Temperatura y humedad con sesgo de zona
    temperatura = round(zona["temp_base"] + ruido_temp, 2)
    humedad     = round(float(np.clip(zona["hum_base"] + ruido_hum, 0, 100)), 2)

    # El resto de variables las tomamos del dataset base con ruido leve
    ph   = round(float(np.clip(df_base_row.get("soil_pH",  6.5) + ruido_ph,  4.0, 9.0)), 2)
    ndvi = round(float(np.clip(df_base_row.get("NDVI_index", 0.5) + ruido_ndvi, 0.0, 1.0)), 3)

    # Variables agronómicas del dataset base (sin modificar para mantener correlación real)
    campos_agronomicos = [
        "total_days", "P", "region", "N", "irrigation_type",
        "rainfall_mm", "soil_moisture_%", "sunlight_hours", "K",
        "yield_kg_per_hectare", "fertilizer_type", "pesticide_usage_ml",
    ]
    registro = {}
    for campo in campos_agronomicos:
        if campo in df_base_row.index:
            val = df_base_row[campo]

            # Convertir tipos de numpy/pandas a tipos nativos de Python
            if isinstance(val, (np.integer, np.int64)):
                val = int(val)
            elif isinstance(val, (np.floating, np.float64)):
                val = float(val)

            # Evitar NaN / Inf
            if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
                val = 0

            registro[campo] = val

    # Sobreescribimos con valores geo-referenciados
    registro["temperature_C"]  = temperatura
    registro["humidity_%"]     = humedad
    registro["soil_pH"]        = ph
    registro["NDVI_index"]     = ndvi
    registro["farm_id"]        = zona["farm_id"]
    registro["crop_type"]      = zona["crop_type"]
    registro["timestamp"]      = datetime.datetime.now().isoformat()

    return registro


def generar_y_enviar_microbatch(df_base: pd.DataFrame) -> None:
    """
    Genera un microbatch de exactamente 50 registros (uno por zona)
    y lo envía a la API de AgroSmart.
    """
    logging.info(f"Generando microbatch para {len(ZONAS)} zonas geo-referenciadas...")

    np.random.seed(int(time.time()))

    # Muestreamos 50 filas del dataset base (una por zona, con reemplazo)
    filas_base = df_base.sample(n=len(ZONAS), replace=True).reset_index(drop=True)

    payload = []
    for i, zona in enumerate(ZONAS):
        registro = aplicar_sesgo_zona(zona, filas_base.iloc[i])
        payload.append(registro)

    logging.info(f"Ejemplo registro → farm_id: {payload[0]['farm_id']}, "
                 f"temp: {payload[0]['temperature_C']}°C, "
                 f"hum: {payload[0]['humidity_%']}%, "
                 f"crop: {payload[0]['crop_type']}")

    # Envío a la API (en chunks si fuera necesario, aunque con 50 no aplica)
    for start in range(0, len(payload), CHUNK_SIZE):
        chunk = payload[start:start + CHUNK_SIZE]
        try:
            respuesta = requests.post(URL_API, json=chunk, timeout=60)
            if respuesta.status_code == 200:
                datos = respuesta.json()
                procesados = datos.get("registros_procesados", len(chunk))
                logging.info(f"✅ API procesó {procesados} registros correctamente.")
            else:
                logging.error(f"❌ Error API ({respuesta.status_code}): {respuesta.text}")
        except requests.exceptions.RequestException as e:
            logging.error(f"❌ Error de conexión con la API: {e}")


# ---------------------------------------------------------------------------
# 4. EJECUCIÓN CONTINUA
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.info("=" * 60)
    logging.info("INICIANDO SIMULADOR IOT — AGROSMART TECH FASE 3")
    logging.info(f"  Hectáreas : {len(HECTAREAS_CONFIG)}")
    logging.info(f"  Sectores  : {len(ZONAS)} zonas (10 por hectárea)")
    logging.info(f"  Intervalo : {INTERVALO_SEGUNDOS} segundos por ciclo")
    logging.info("  Presiona Ctrl+C para detener.")
    logging.info("=" * 60)

    # Carga del dataset base (una sola vez)
    try:
        df_base = pd.read_csv(RUTA_DATASET_BASE)
        logging.info(f"Dataset base cargado: {len(df_base)} filas disponibles.")
    except FileNotFoundError as e:
        logging.critical(f"Dataset no encontrado: {e}")
        raise SystemExit(1)

    try:
        while True:
            generar_y_enviar_microbatch(df_base)
            logging.info(f"Ciclo completado. Próximo envío en {INTERVALO_SEGUNDOS}s...")
            time.sleep(INTERVALO_SEGUNDOS)
    except KeyboardInterrupt:
        logging.info("Simulador detenido manualmente.")