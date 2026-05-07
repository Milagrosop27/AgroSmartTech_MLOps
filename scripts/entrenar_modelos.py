import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
import joblib
from pathlib import Path


# 1. CONFIGURACIÓN DE RUTAS UNIVERSALES

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'
MODELS_DIR = BASE_DIR / 'models'

# 2. FUNCIONES DEL PIPELINE

def cargar_y_limpiar_datos():

    # -- carga

    ruta_csv = DATA_DIR / 'Dataset_Smart_Farming_base.csv'
    df = pd.read_csv(ruta_csv)

    # -- limpieza

    # 1. Reemplazar cadenas vacías por NaN
    df.replace(r'^\s*$', np.nan, regex=True, inplace=True)

    # 2. Eliminar columnas irrelevantes para la predicción
    columnas_irrelevantes = [
        'farm_id', 'sensor_id', 'timestamp',
        'sowing_date', 'harvest_date',
        'latitude', 'longitude'
    ]
    # Usamos errors='ignore' por si alguna columna ya no existe
    df = df.drop(columns=columnas_irrelevantes, errors='ignore')

    # 3. Filtro de seguridad: Forzamos la eliminación de filas sin etiqueta de enfermedad
    df = df.dropna(subset=['crop_disease_status'])

    # 4. Filtro de seguridad: Forzamos el relleno del tipo de riego
    df['irrigation_type'] = df['irrigation_type'].fillna('Desconocido')

    print(f" Datos limpios y listos. Filas totales: {len(df)}")

    return df



def entrenar_guardian(df):
    print("1. Entrenando al modelo Guardian (Monitoreo de Riesgo)")

    # 1. Separar características (X) y variable a predecir (y)
    X = df.drop(columns=['crop_disease_status'])
    y = df['crop_disease_status']

    # 2. División Train/Test (70/30)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )

    # 3. Definir y aplicar preprocesamiento
    variables_categoricas = ['region', 'crop_type', 'irrigation_type', 'fertilizer_type']
    variables_numericas = [col for col in X.columns if col not in variables_categoricas]

    preprocesador = ColumnTransformer(transformers=[
        ('num', StandardScaler(), variables_numericas),
        ('cat', OneHotEncoder(handle_unknown='ignore'), variables_categoricas)
    ])

    X_train_processed = preprocesador.fit_transform(X_train)
    X_test_processed = preprocesador.transform(X_test)

    # 4. Aplicar SMOTE para balancear clases
    smote = SMOTE(random_state=42)
    X_resampled, y_resampled = smote.fit_resample(X_train_processed, y_train)

    # 5. Entrenar el Random Forest
    modelo_guardian = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    modelo_guardian.fit(X_resampled, y_resampled)

    # 6. Examen final y métricas
    y_pred = modelo_guardian.predict(X_test_processed)
    precision = accuracy_score(y_test, y_pred)
    print(f" Nivel de precisión del modelo : {precision * 100:.2f}%")

    # 7. Exportación
    joblib.dump(modelo_guardian, MODELS_DIR / 'guardian_rf.pkl')
    joblib.dump(preprocesador, MODELS_DIR / 'preprocesador_guardian.pkl')
    print(" Modelo guardian entrenado y exportado exitosamente.")


def entrenar_agronomo(df):
    print("2. Entrenando al modelo agronomo (Recomendación de Fertilizante)")

    # 1. Filtro: Solo usar filas donde sabemos qué fertilizante se aplicó
    df_agronomo = df.dropna(subset=['fertilizer_type']).copy()

    # 2. Seleccionar características (X) y variable a predecir (y)
    y_agronomo = df_agronomo['fertilizer_type']
    columnas_agronomicas = ['N', 'P', 'K', 'soil_pH', 'soil_moisture_%', 'crop_type', 'region']
    X_agronomo = df_agronomo[columnas_agronomicas]

    # 3. División Train/Test (70/30)
    X_train, X_test, y_train, y_test = train_test_split(
        X_agronomo, y_agronomo, test_size=0.3, random_state=42, stratify=y_agronomo
    )

    # 4. Definir y aplicar preprocesamiento
    variables_categoricas = ['region', 'crop_type']
    variables_numericas = ['N', 'P', 'K', 'soil_pH', 'soil_moisture_%']

    preprocesador = ColumnTransformer(transformers=[
        ('num', StandardScaler(), variables_numericas),
        ('cat', OneHotEncoder(handle_unknown='ignore'), variables_categoricas)
    ])

    X_train_processed = preprocesador.fit_transform(X_train)
    X_test_processed = preprocesador.transform(X_test)

    # 5. Entrenar el Random Forest
    modelo_agronomo = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    modelo_agronomo.fit(X_train_processed, y_train)

    # 6. Examen final y métricas
    y_pred = modelo_agronomo.predict(X_test_processed)
    precision = accuracy_score(y_test, y_pred)
    print(f" Nivel de precisión del modelo : {precision * 100:.2f}%")

    # 7. Exportación
    joblib.dump(modelo_agronomo, MODELS_DIR / 'agronomo_rf.pkl')
    joblib.dump(preprocesador, MODELS_DIR / 'preprocesador_agronomo.pkl')
    print(" Modelo agronomo entrenado y exportado exitosamente.")

# 3. EJECUCIÓN PRINCIPAL

if __name__ == '__main__':
    print(" INICIANDO PIPELINE DE ENTRENAMIENTO MLOPS \n")
    datos_limpios = cargar_y_limpiar_datos()
    entrenar_guardian(datos_limpios)
    entrenar_agronomo(datos_limpios)
    print("\nPipeline Finalizado. Modelos actualizados en la carpeta /models.")