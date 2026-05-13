from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
import joblib
import xgboost as xgb
import polars as pl
from pathlib import Path
import shutil


# 1. CONFIGURACIÓN DE RUTAS UNIVERSALES

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'
MODELS_DIR = BASE_DIR / 'models'


def limpiar_carpeta_modelos():
    if MODELS_DIR.exists():
        print(f" Limpiando carpeta de modelos en: {MODELS_DIR}")
        # Borra  el contenido y la carpeta misma
        shutil.rmtree(MODELS_DIR)

    # La vuelve a crear vacía para los nuevos archivos
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    print(" Carpeta /models lista y vacía para el nuevo entrenamiento.")

# 2. FUNCIONES DEL PIPELINE

def cargar_y_limpiar_datos():

    # -- carga

    ruta_csv = DATA_DIR / 'Dataset_Smart_Farming_base.csv'
    df = pl.read_csv(ruta_csv)

    # -- limpieza


    # 2. Eliminar columnas irrelevantes para la predicción
    columnas_irrelevantes = [
        'farm_id', 'sensor_id', 'timestamp',
        'sowing_date', 'harvest_date',
        'latitude', 'longitude'
    ]
    existentes = [col for col in columnas_irrelevantes if col in df.columns]
    df_limpio = (
        df.drop(existentes)
        # Reemplazar cadenas vacías por null (equivalente a NaN)
        .with_columns([
            pl.col(pl.String)
            .str.strip_chars()  # Quita espacios
            .replace("", None)  # Convierte "" en null (None)
        ])
        # Filtro de seguridad: Eliminar filas sin etiqueta
        .filter(pl.col("crop_disease_status").is_not_null())
        # Relleno de nulos
        .with_columns(
            pl.col("irrigation_type").fill_null("Desconocido")
        )
    )

    print(f" Datos limpios y listos. Filas totales: {len(df)}")

    return df_limpio



def entrenar_guardian(df):
    print("1. Entrenando al modelo Guardian (Monitoreo de Riesgo)")

    # 1. Separar características (X) y variable a predecir (y)
    X = df.drop("crop_disease_status").to_pandas()
    y = df.select("crop_disease_status").to_series().to_pandas()

    # XGBoost requiere que la variable objetivo sea numérica, así que codificamos las clases
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # 2. División Train/Test (70/30)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.3, random_state=42, stratify=y
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

    # 5. Entrenar el XGBoost
    modelo_guardian = xgb.XGBClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=6,
        random_state=42,
        eval_metric='mlogloss'
    )
    modelo_guardian.fit(X_resampled, y_resampled)

    # 6. Examen final y métricas
    y_pred = modelo_guardian.predict(X_test_processed)
    print(f" Nivel de precisión del modelo : {accuracy_score(y_test, y_pred) * 100:.2f}%")

    # 7. Exportación
    modelo_guardian.save_model(MODELS_DIR / 'guardian_xgb.json')
    joblib.dump(preprocesador, MODELS_DIR / 'preprocesador_guardian.pkl')
    joblib.dump(le, MODELS_DIR / 'label_encoder_guardian.pkl')
    print("Modelo Guardian (XGBoost) exportado.")


def entrenar_agronomo(df):
    print("2. Entrenando al modelo agronomo (Recomendación de Fertilizante)")

    # 1. Filtro: Solo usar filas donde sabemos qué fertilizante se aplicó
    df_agronomo = df.filter(pl.col("fertilizer_type").is_not_null())

    # 2. Seleccionar características (X) y variable a predecir (y)
    columnas_agronomicas = ['N', 'P', 'K', 'soil_pH', 'soil_moisture_%', 'crop_type', 'region']

    # Seleccionamos características y objetivo
    X_raw = df_agronomo.select(columnas_agronomicas).to_pandas()
    y_raw = df_agronomo.select("fertilizer_type").to_series().to_pandas()

    le_agronomo = LabelEncoder()
    y_encoded = le_agronomo.fit_transform(y_raw)

    # 3. División Train/Test (70/30)
    X_train, X_test, y_train, y_test = train_test_split(
        X_raw, y_encoded, test_size=0.3, random_state=42, stratify=y_encoded
    )

    # 4. Definir y aplicar preprocesamiento
    variables_categoricas = ['region', 'crop_type']
    variables_numericas = ['N', 'P', 'K', 'soil_pH', 'soil_moisture_%']

    preprocesador_agronomo = ColumnTransformer(transformers=[
        ('num', StandardScaler(), variables_numericas),
        ('cat', OneHotEncoder(handle_unknown='ignore'), variables_categoricas)
    ])

    X_train_processed = preprocesador_agronomo.fit_transform(X_train)
    X_test_processed = preprocesador_agronomo.transform(X_test)

    # 5. Entrenar el XGBoost
    modelo_agronomo = xgb.XGBClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=6,
        random_state=42,
        objective='multi:softprob',  # Ideal para clasificación multiclase
        eval_metric='mlogloss'
    )

    modelo_agronomo.fit(X_train_processed, y_train)

    # 6. Examen final y métricas
    y_pred = modelo_agronomo.predict(X_test_processed)
    precision = accuracy_score(y_test, y_pred)
    print(f" Nivel de precisiónl del modeo : {precision * 100:.2f}%")

    # 7. Exportación
    modelo_agronomo.save_model(MODELS_DIR / 'agronomo_xgb.json')
    joblib.dump(preprocesador_agronomo, MODELS_DIR / 'preprocesador_agronomo.pkl')
    joblib.dump(le_agronomo, MODELS_DIR / 'label_encoder_agronomo.pkl')
    print(" Modelo agronomo entrenado y exportado exitosamente.")

# 3. EJECUCIÓN PRINCIPAL

if __name__ == '__main__':
    print(" INICIANDO PIPELINE DE ENTRENAMIENTO MLOPS \n")
    limpiar_carpeta_modelos()
    datos_limpios = cargar_y_limpiar_datos()
    entrenar_guardian(datos_limpios)
    entrenar_agronomo(datos_limpios)
    print("\nPipeline Finalizado. Modelos actualizados en la carpeta /models.")