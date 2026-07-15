import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
import joblib
from pathlib import Path
import shutil

# 1. CONFIGURACIÓN DE RUTAS UNIVERSALES
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'
MODELS_DIR = BASE_DIR / 'models'


def limpiar_carpeta_modelos():
    """Limpia y recrea el directorio de modelos para evitar conflictos con versiones anteriores."""
    if MODELS_DIR.exists():
        shutil.rmtree(MODELS_DIR)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

# 2. FUNCIONES DEL PIPELINE

def cargar_y_limpiar_datos():
    """Carga el dataset con Pandas y aplica las reglas de negocio para la limpieza inicial."""
    ruta_csv = DATA_DIR / 'Dataset_Smart_Farming_base.csv'
    df = pd.read_csv(ruta_csv)

    columnas_irrelevantes = [
        'farm_id', 'sensor_id', 'timestamp',
        'sowing_date', 'harvest_date',
        'latitude', 'longitude'
    ]
    existentes = [col for col in columnas_irrelevantes if col in df.columns]
    df = df.drop(columns=existentes)

    # Limpieza de espacios en blanco y estandarización de nulos en columnas de texto
    cols_texto = df.select_dtypes(include=['object', 'str']).columns
    for col in cols_texto:
        df[col] = df[col].astype(str).str.strip().replace({'': np.nan, 'nan': np.nan, 'None': np.nan})

    # Filtros de seguridad y relleno de valores
    df = df.dropna(subset=['crop_disease_status'])
    df['irrigation_type'] = df['irrigation_type'].fillna('Desconocido')

    return df

def entrenar_guardian(df):
    """Entrena el modelo clasificador para el estado de salud del cultivo."""

    # Columnas que el simulador IoT NO puede producir en tiempo real:
    # - yield_kg_per_hectare: fuga de datos (resultado posterior a la cosecha)
    # - pesticide_usage_ml, total_days, fertilizer_type: bitácora agrícola,
    #   no telemetría de sensores
    columnas_no_disponibles_en_iot = [
        'yield_kg_per_hectare', 'pesticide_usage_ml',
        'total_days', 'fertilizer_type'
    ]

    # Separación de características y variable objetivo
    X = df.drop(columns=['crop_disease_status'] + columnas_no_disponibles_en_iot)
    y = df['crop_disease_status']

    le_guardian = LabelEncoder()
    y_encoded = le_guardian.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.3, random_state=42, stratify=y_encoded
    )

    # fertilizer_type ya no está en X, así que sale de las categóricas también
    variables_categoricas = ['region', 'crop_type', 'irrigation_type']
    variables_numericas = [col for col in X.columns if col not in variables_categoricas]

    preprocesador = ColumnTransformer(transformers=[
        ('num', StandardScaler(), variables_numericas),
        ('cat', OneHotEncoder(handle_unknown='ignore'), variables_categoricas)
    ])
    X_train_processed = preprocesador.fit_transform(X_train)
    X_test_processed = preprocesador.transform(X_test)

    # Balanceo de clases en los datos de entrenamiento
    smote = SMOTE(random_state=42)
    X_resampled, y_resampled = smote.fit_resample(X_train_processed, y_train)

    # Configuración del Modelo (Escalable: Reemplazar aquí para probar otros algoritmos)
    modelo_guardian = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1  # Utiliza todos los núcleos del procesador para mayor velocidad
    )

    modelo_guardian.fit(X_resampled, y_resampled)

    # Evaluación
    y_pred = modelo_guardian.predict(X_test_processed)
    precision = accuracy_score(y_test, y_pred)
    print(f"Precision Modelo Guardian (Enfermedad): {precision * 100:.2f}%")

    # Exportación estándar
    joblib.dump(modelo_guardian, MODELS_DIR / 'guardian_rf.pkl')
    joblib.dump(preprocesador, MODELS_DIR / 'preprocesador_guardian.pkl')
    joblib.dump(le_guardian, MODELS_DIR / 'label_encoder_guardian.pkl')


def entrenar_agronomo(df):
    """Entrena el modelo de recomendación de fertilizantes óptimos."""

    # Filtro estricto: Solo entrenar con registros que tienen datos de fertilizante
    df_agronomo = df.dropna(subset=['fertilizer_type']).copy()

    columnas_agronomicas = ['N', 'P', 'K', 'soil_pH', 'soil_moisture_%', 'crop_type', 'region']

    X = df_agronomo[columnas_agronomicas]
    y = df_agronomo['fertilizer_type']

    le_agronomo = LabelEncoder()
    y_encoded = le_agronomo.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.3, random_state=42, stratify=y_encoded
    )

    variables_categoricas = ['region', 'crop_type']
    variables_numericas = ['N', 'P', 'K', 'soil_pH', 'soil_moisture_%']

    preprocesador_agronomo = ColumnTransformer(transformers=[
        ('num', StandardScaler(), variables_numericas),
        ('cat', OneHotEncoder(handle_unknown='ignore'), variables_categoricas)
    ])

    X_train_processed = preprocesador_agronomo.fit_transform(X_train)
    X_test_processed = preprocesador_agronomo.transform(X_test)

    # Configuración del Modelo
    modelo_agronomo = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )

    modelo_agronomo.fit(X_train_processed, y_train)

    # Evaluación
    y_pred = modelo_agronomo.predict(X_test_processed)
    precision = accuracy_score(y_test, y_pred)
    print(f"Precision Modelo Agronomo (Fertilizante): {precision * 100:.2f}%")

    # Exportación estándar
    joblib.dump(modelo_agronomo, MODELS_DIR / 'agronomo_rf.pkl')
    joblib.dump(preprocesador_agronomo, MODELS_DIR / 'preprocesador_agronomo.pkl')
    joblib.dump(le_agronomo, MODELS_DIR / 'label_encoder_agronomo.pkl')


# 3. EJECUCIÓN PRINCIPAL
if __name__ == '__main__':
    limpiar_carpeta_modelos()
    datos_limpios = cargar_y_limpiar_datos()
    entrenar_guardian(datos_limpios)
    entrenar_agronomo(datos_limpios)