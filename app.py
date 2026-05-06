from flask import Flask, request, jsonify
import joblib
import pandas as pd
from pathlib import Path

# Inicializamos el servidor de Flask
app = Flask(__name__)

# Configuramos las rutas universales para encontrar los modelos
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / 'models'

# Cargar los datos en la memoria del servidor
try:
    modelo_guardian = joblib.load(MODELS_DIR / 'guardian_rf.pkl')
    preprocesador = joblib.load(MODELS_DIR / 'preprocesador_guardian.pkl')
    print(" Modelos de IA cargados correctamente.")
except Exception as e:
    print(f" Error al cargar los modelos: {e}")


# Ruta 1: Un endpoint de prueba para saber si el servidor está activo
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "proyecto": "AgroSmart Tech",
        "estado": "Activo",
        "mensaje": "El Guardián está monitoreando."
    })


# Ruta 2: El endpoint principal que recibirá datos de los sensores
@app.route('/predecir', methods=['POST'])
def predecir():
    try:
        # 1. Recibimos los datos del sensor en formato JSON
        datos_json = request.get_json()

        # 2. Convertimos el JSON a un DataFrame (lo que entiende la IA)
        df_nuevo = pd.DataFrame([datos_json])

        # 3. Pasamos los datos crudos por el preprocesador (escalado y encoding)
        datos_procesados = preprocesador.transform(df_nuevo)

        # 4. El Guardián toma la decisión
        prediccion = modelo_guardian.predict(datos_procesados)

        # 5. Devolvemos la respuesta al agricultor
        return jsonify({
            "estado_riesgo": prediccion[0],
            "status": "success"
        })

    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 400


# Arrancamos el servidor en el puerto 5000
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
