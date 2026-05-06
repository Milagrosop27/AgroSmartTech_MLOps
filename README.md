#  AgroSmart Tech: MLOps para Predicción de Enfermedades en Cultivos Agrícolas

AgroSmart Tech es una solución de Machine Learning diseñada para predecir el nivel de riesgo de enfermedades en cultivos agrícolas basándose en datos de sensores IoT (humedad, temperatura, niveles de nitrógeno, ph, etc.). 

Este proyecto implementa un ciclo de vida de **MLOps** completo: desde la generación de datos y entrenamiento del modelo, hasta la creación de una API REST para inferencias en tiempo real.

---

## Características Principales

* **Procesamiento y Balanceo:** Limpieza automática de datos y manejo de clases minoritarias mediante técnicas de oversampling (**SMOTE**).
* **Modelo Predictivo ("El Guardián"):** Entrenamiento de un modelo `RandomForestClassifier` alcanzando un **98.20% de precisión global** y un 100% de efectividad (recall) en la detección de casos severos.
* **API REST:** Despliegue local mediante un servidor **Flask** que recibe datos en formato JSON y devuelve diagnósticos en tiempo real.

---

## Tecnologías Utilizadas

* **Lenguaje:** Python 3.13
* **Análisis de Datos:** Pandas, NumPy
* **Machine Learning:** Scikit-Learn, Imbalanced-Learn
* **Backend / API:** Flask, Requests
* **Entorno:** PyCharm, Entornos Virtuales (.venv)

---

## Estructura del Proyecto

```text
AgroSmartTech_MLOps/
├── data/                       # Archivos CSV (No versionado)
├── models/                     # Modelos empaquetados en .pkl
│   ├── guardian_rf.pkl
│   └── preprocesador_guardian.pkl
├── scripts/                    # Scripts misceláneos y de generación
│   └── generar_dataset.py
├── app.py                      # Servidor backend de Flask (API)
├── test_api.py                 # Script cliente para simular sensores IoT
├── 03_entrenamiento.ipynb      # Notebook con el pipeline de entrenamiento
├── requirements.txt            # Dependencias y librerías del proyecto
└── README.md                   # Documentación del proyecto

Instrucciones de Uso Local
Sigue estos pasos para levantar "El Guardián" en tu máquina local:

**1. Clonar el repositorio y configurar el entorno**
```bash
git clone [https://github.com/Ethel/AgroSmartTech_MLOps.git](https://github.com/Ethel/AgroSmartTech_MLOps.git)
cd AgroSmartTech_MLOps
python -m venv .venv
source .venv/bin/activate  # En Mac/Linux

2. Instalar las dependencias

Bash
pip install -r requirements.txt

3. Iniciar el servidor web (API)

Bash
python app.py
El servidor se iniciará en http://127.0.0.1:5000

4. Realizar una prueba de diagnóstico
En una nueva terminal, ejecuta el script de simulación para enviar un paquete de datos JSON al servidor:

Bash
python test_api.py

Deberías recibir una respuesta con el diagnóstico del nivel de riesgo de enfermedad para el cultivo.

