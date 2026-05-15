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
MODELS_DIR = Path(__file__).parent.parent / 'models'
models = {}


def cargar_recursos():
    try:
        # --- CARGA MODELO 1: EL GUARDIÁN ---
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


@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "proyecto": "AgroSmart Tech",
        "estado": "Activo",
        "servicios": ["Guardian", "Agronomo"]
    })


@app.route('/predecir', methods=['POST'])
def predecir():
    try:
        entrada = request.get_json()

        # Creamos el diccionario completo con valores por defecto + datos del sensor
        datos_completos = {
            "region": "North", "crop_type": "Wheat", "irrigation_type": "Drip",
            "fertilizer_type": "Urea", "pesticide_usage_ml": 200, "total_days": 120,
            "yield_kg_per_hectare": 5000, "sunlight_hours": 8, "rainfall_mm": 150,
            "N": 40, "P": 30, "K": 20,
            # Aquí entran los datos reales del Dashboard:
            "temperature_C": entrada.get('temperatura', 25),
            "humidity_%": entrada.get('humedad', 60),
            "soil_pH": entrada.get('ph', 6.5),
            "soil_moisture_%": entrada.get('humedad', 60),  # Usamos humedad como proxy
            "NDVI_index": entrada.get('ndvi', 0.8)
        }

        df = pl.DataFrame([datos_completos]).to_pandas()

        # IMPORTANTE: Reordenar las columnas exactamente como se entrenaron
        orden_entrenamiento = [
            'region', 'crop_type', 'soil_moisture_%', 'soil_pH', 'temperature_C',
            'rainfall_mm', 'humidity_%', 'sunlight_hours', 'irrigation_type',
            'fertilizer_type', 'pesticide_usage_ml', 'total_days',
            'yield_kg_per_hectare', 'NDVI_index', 'N', 'P', 'K'
        ]
        df = df[orden_entrenamiento]

        proc = models['pre_guardian'].transform(df)
        pred = models['guardian'].predict(proc)
        label = models['le_guardian'].inverse_transform(pred)

        mapeo_riesgo = {
            "Severe": "Riesgo Crítico",
            "Moderate": "Riesgo Moderado",
            "Low": "Estado Óptimo"
        }
        resultado_es = mapeo_riesgo.get(label[0], label[0])

        return jsonify({
            "estado_riesgo": [resultado_es],
            "status": "success"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/recomendar_fertilizante', methods=['POST'])
def recomendar_fertilizante():
    try:
        entrada = request.get_json()

        # 1. Completamos el perfil de 17 columnas para el Agrónomo
        datos_completos = {
            "region": "North", "crop_type": "Wheat", "irrigation_type": "Drip",
            "fertilizer_type": "Urea", "pesticide_usage_ml": 200, "total_days": 120,
            "yield_kg_per_hectare": 5000, "sunlight_hours": 8, "rainfall_mm": 150,
            "N": 40, "P": 30, "K": 20,
            "temperature_C": entrada.get('temperatura', 25),
            "humidity_%": entrada.get('humedad', 60),
            "soil_pH": entrada.get('ph', 6.5),
            "soil_moisture_%": entrada.get('humedad', 60),
            "NDVI_index": entrada.get('ndvi', 0.8)
        }

        # 2. El orden debe ser IDÉNTICO al del entrenamiento
        orden_entrenamiento = [
            'region', 'crop_type', 'soil_moisture_%', 'soil_pH', 'temperature_C',
            'rainfall_mm', 'humidity_%', 'sunlight_hours', 'irrigation_type',
            'fertilizer_type', 'pesticide_usage_ml', 'total_days',
            'yield_kg_per_hectare', 'NDVI_index', 'N', 'P', 'K'
        ]

        df = pl.DataFrame([datos_completos]).to_pandas()
        df = df[orden_entrenamiento]

        # 3. Inferencia
        proc = models['pre_agronomo'].transform(df)
        pred = models['agronomo'].predict(proc)
        label = models['le_agronomo'].inverse_transform(pred)

        mapeo_fert = {
            "Inorganic": "Fertilizante Inorgánico",
            "Organic": "Abono Orgánico",
            "Urea": "Urea (Nitrógeno)",
            "DAP": "DAP (Fosfato)"
        }
        recomendacion_es = mapeo_fert.get(label[0], label[0])

        return jsonify({
            "fertilizante_recomendado": [recomendacion_es],
            "status": "success"
        })

    except Exception as e:
        print(f"Error en Agrónomo: {e}")
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

