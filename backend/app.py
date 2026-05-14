import joblib
import polars as pl
import xgboost as xgb
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# Inicializamos el servidor de Flask
app = Flask(__name__)
CORS(app)

# Configuramos las rutas universales para encontrar los modelos
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = Path(__file__).parent.parent / 'models'
models = {}

def cargar_recursos():
    try:
        # --- CARGA MODELO 1: EL GUARDIÁN ---
        # Cargamos el modelo desde JSON (Formato nativo de XGBoost)
        mod_guardian = xgb.XGBClassifier()
        mod_guardian.load_model(MODELS_DIR / 'guardian_xgb.json')

        models['guardian'] = mod_guardian
        models['pre_guardian'] = joblib.load(MODELS_DIR / 'preprocesador_guardian.pkl')
        models['le_guardian'] = joblib.load(MODELS_DIR / 'label_encoder_guardian.pkl')

        # --- CARGA MODELO 2: EL AGRÓNOMO ---
        mod_agronomo = xgb.XGBClassifier()
        mod_agronomo.load_model(MODELS_DIR / 'agronomo_xgb.json')

        models['agronomo'] = mod_agronomo
        models['pre_agronomo'] = joblib.load(MODELS_DIR / 'preprocesador_agronomo.pkl')
        models['le_agronomo'] = joblib.load(MODELS_DIR / 'label_encoder_agronomo.pkl')

        print("Todos los modelos y encoders cargados correctamente.")
    except Exception as e:
        print(f" Error al cargar recursos: {e}")

# Ejecutamos la carga al iniciar
cargar_recursos()


# Ruta 1: Un endpoint de prueba para saber si el servidor está activo
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "proyecto": "AgroSmart Tech",
        "estado": "Activo",
        "motor": "XGBoost + Polars",
        "servicios": ["Monitoreo de Riesgo (Guardian)", "Recomendacion de Fertilizante (Agronomo)"]
    })

# Ruta 2: Ventanilla del Guardián (Riesgos)
@app.route('/predecir', methods=['POST'])
def predecir():
    try:
        datos_json = request.get_json()

        # Si es un solo diccionario, lo metemos en una lista para que Polars lo lea bien
        if not isinstance(datos_json, list):
            datos_json = [datos_json]

        # Ahora creamos el DataFrame de forma veloz
        df_nuevo = pl.DataFrame(datos_json).to_pandas()

        # Llamamos al preprocesador desde el diccionario models
        datos_procesados = models['pre_guardian'].transform(df_nuevo)
        prediccion = models['guardian'].predict(datos_procesados)

        return jsonify({
            "estado_riesgo": prediccion.tolist(),  # Devolvemos todo en formato lista JSON
            "status": "success",
            "registros_procesados": len(prediccion)
        })
    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 400


# Ruta 3: Ventanilla del Agrónomo (Recomendación de Fertilizante)
@app.route('/recomendar_fertilizante', methods=['POST'])
def recomendar_fertilizante():
    try:
        datos_json = request.get_json()
        df_nuevo = pl.DataFrame(datos_json).to_pandas()

        # 1. Preprocesamiento
        datos_proc = models['pre_agronomo'].transform(df_nuevo)

        # 2. Predicción
        preds_numericas = models['agronomo'].predict(datos_proc)

        # 3. Traducción (Urea, DAP, etc.)
        preds_texto = models['le_agronomo'].inverse_transform(preds_numericas)

        return jsonify({
            "fertilizante_recomendado": preds_texto.tolist(),
            "status": "success",
            "total": len(preds_texto)
        })
    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 400


# Arrancamos el servidor en el puerto 5000
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

