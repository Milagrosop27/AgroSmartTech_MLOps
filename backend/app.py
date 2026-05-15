import joblib
import pandas as pd
import xgboost as xgb
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import deque

# Inicializamos Flask
app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN DE MODELOS ---
MODELS_DIR = Path(__file__).parent.parent / 'models'
models = {}
# Memoria persistente para el Dashboard (últimos 500 registros)
historico_datos = deque(maxlen=500)

ORDEN_ENTRENAMIENTO = [
    'region', 'crop_type', 'soil_moisture_%', 'soil_pH', 'temperature_C',
    'rainfall_mm', 'humidity_%', 'sunlight_hours', 'irrigation_type',
    'fertilizer_type', 'pesticide_usage_ml', 'total_days',
    'yield_kg_per_hectare', 'NDVI_index', 'N', 'P', 'K'
]


def cargar_recursos():
    try:
        # Carga Guardián
        models['guardian'] = xgb.XGBClassifier()
        models['guardian'].load_model(MODELS_DIR / 'guardian_xgb.json')
        models['pre_guardian'] = joblib.load(MODELS_DIR / 'preprocesador_guardian.pkl')
        models['le_guardian'] = joblib.load(MODELS_DIR / 'label_encoder_guardian.pkl')
        # Carga Agrónomo
        models['agronomo'] = xgb.XGBClassifier()
        models['agronomo'].load_model(MODELS_DIR / 'agronomo_xgb.json')
        models['pre_agronomo'] = joblib.load(MODELS_DIR / 'preprocesador_agronomo.pkl')
        models['le_agronomo'] = joblib.load(MODELS_DIR / 'label_encoder_agronomo.pkl')
        print("✅ Sistemas de IA cargados y listos.")
    except Exception as e:
        print(f"❌ Error crítico al cargar modelos: {e}")


cargar_recursos()


@app.route('/predecir', methods=['POST'])
def predecir():
    global historico_datos
    try:
        entrada = request.get_json()

        # Convertir a DataFrame (soporta un dict o una lista de dicts)
        df = pd.DataFrame(entrada) if isinstance(entrada, list) else pd.DataFrame([entrada])

        # Normalización básica de columnas del simulador
        if 'humidity_%' in df.columns and 'soil_moisture_%' not in df.columns:
            df['soil_moisture_%'] = df['humidity_%']

        # Asegurar todas las columnas necesarias
        for col in ORDEN_ENTRENAMIENTO:
            if col not in df.columns: df[col] = 0
        df = df[ORDEN_ENTRENAMIENTO]

        # Inferencia Vectorizada (Ambos modelos de una sola vez)
        proc_g = models['pre_guardian'].transform(df)
        preds_g = models['guardian'].predict(proc_g)
        labels_g = models['le_guardian'].inverse_transform(preds_g)

        proc_a = models['pre_agronomo'].transform(df)
        preds_a = models['agronomo'].predict(proc_a)
        labels_a = models['le_agronomo'].inverse_transform(preds_a)

        mapeos = {
            "riesgo": {"Severe": "Riesgo Crítico", "Moderate": "Riesgo Moderado", "Low": "Estado Óptimo"},
            "fert": {"Inorganic": "Inorgánico", "Organic": "Orgánico", "Urea": "Urea", "DAP": "DAP"}
        }

        # Guardar resultados en el histórico para el Dashboard
        for i in range(len(labels_g)):
            res_g = mapeos["riesgo"].get(labels_g[i], labels_g[i])
            res_a = mapeos["fert"].get(labels_a[i], labels_a[i])

            historico_datos.append({
                "fecha": pd.Timestamp.now().strftime("%H:%M:%S"),
                "diagnostico": res_g,
                "recomendacion": res_a,
                "temp": float(df.iloc[i]['temperature_C']),
                "hum": float(df.iloc[i]['humidity_%']),
                "ph": float(df.iloc[i]['soil_pH']),
                "ndvi": float(df.iloc[i]['NDVI_index'])
            })

        return jsonify({"status": "success", "procesados": len(labels_g)})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/datos-dashboard', methods=['GET'])
def get_dashboard():
    return jsonify(list(historico_datos))


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
