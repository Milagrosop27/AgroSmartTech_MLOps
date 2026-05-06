import pandas as pd
import numpy as np
from pathlib import Path

# Configuración de Rutas
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'

ruta_iot = DATA_DIR / 'Smart_Farming_Crop_Yield_2024.csv'
ruta_quimico = DATA_DIR / 'Crop_recommendation.csv'
ruta_maestro = DATA_DIR / 'Dataset_Smart_Farming_base.csv'

# Lectura de archivos
df_iot = pd.read_csv(ruta_iot)
df_quimico = pd.read_csv(ruta_quimico)


# Mapeo Inteligente
np.random.seed(42)

# Obtenemos los cultivos originales únicos de tu dataset IoT
cultivos_originales = df_iot['crop_type'].unique()
# Obtenemos las etiquetas del dataset químico
etiquetas_quimico = df_quimico['label'].unique()

# Creamos un "puente" interno: A cada cultivo original le asignamos una etiqueta química equivalente.
# Esto asegura que un mismo cultivo siempre reciba niveles de NPK consistentes.
mapa_nutricional = {cultivo: np.random.choice(etiquetas_quimico) for cultivo in cultivos_originales}


# Transformación: Escalar el IoT de 500 a 2500 registros
df_ampliado = pd.concat([df_iot] * 5, ignore_index=True)

# Añadimos ruido estadístico para simular sensores reales
ruido_temp = np.random.normal(0, 0.3, size=len(df_ampliado))
ruido_hum = np.random.normal(0, 0.8, size=len(df_ampliado))
df_ampliado['temperature_C'] = df_ampliado['temperature_C'] + ruido_temp
df_ampliado['humidity_%'] = (df_ampliado['humidity_%'] + ruido_hum).clip(lower=0, upper=100)

# Generamos IDs únicos para los 2500 sensores
df_ampliado['sensor_id'] = [f"SNS-2026-{i:04d}" for i in range(1, 2501)]

# EL CRUCE (Data Merging)
print("Extrayendo niveles de nutrientes N, P, K...")

lista_nutrientes = []
for cultivo in df_ampliado['crop_type']:
    # Buscamos el equivalente químico usando nuestro diccionario puente
    equivalente = mapa_nutricional[cultivo]

    # Extraemos 1 fila de nutrientes (N, P, K) de ese equivalente
    fila_npk = df_quimico[df_quimico['label'] == equivalente].sample(1)
    lista_nutrientes.append(fila_npk[['N', 'P', 'K']].values[0])

# Convertimos la lista extraída en columnas
df_npk = pd.DataFrame(lista_nutrientes, columns=['N', 'P', 'K'])

# Unimos horizontalmente manteniendo original
df_maestro = pd.concat([df_ampliado, df_npk], axis=1)

# Carga (Exportar el resultado)
df_maestro.to_csv(ruta_maestro, index=False)
print(f" Dataset Maestro fusionado guardado en: {ruta_maestro.name}")
print(f" Dimensiones finales: {df_maestro.shape[0]} filas x {df_maestro.shape[1]} columnas.")
print(f" Cultivos conservados intactos: {', '.join(cultivos_originales)}")