import pandas as pd
import numpy as np
from pathlib import Path

# 1. Configuración de rutas
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'

ruta_entrada = DATA_DIR / 'Smart_Farming_Crop_Yield_2024.csv'
ruta_salida = DATA_DIR / 'AgroSmart_Datos_Base.csv'

# 2. Carga del dataset original
df_base = pd.read_csv(ruta_entrada)

# 3. Limpieza y estandarización (Imputación de nulos)
df_base['irrigation_type'] = df_base['irrigation_type'].fillna('Drip')
df_base['crop_disease_status'] = df_base['crop_disease_status'].fillna('Healthy')

# 4. Reglas de negocio: Mapeo al portafolio de agroexportación
cultivos_empresa = ['Palta Hass', 'Arándanos', 'Espárragos', 'Uva de Exportación']
df_base['crop_type'] = np.random.choice(cultivos_empresa, size=len(df_base))

# 5. Generación masiva
multiplicador = 12000
df_ampliado = pd.concat([df_base] * multiplicador, ignore_index=True)

# 6. Inyección de variabilidad estadística (Humedad del suelo)
ruido = np.random.normal(0, 1.5, size=len(df_ampliado))
df_ampliado['soil_moisture_%'] = df_ampliado['soil_moisture_%'] + ruido
df_ampliado['soil_moisture_%'] = df_ampliado['soil_moisture_%'].clip(lower=0, upper=100)

# 7. Exportación al Data Lake local
df_ampliado.to_csv(ruta_salida, index=False)