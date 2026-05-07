# AgroSmartTech_MLOps

Proyecto universitario para el curso de **Desarrollo de Aplicaciones con DevOps**.  
Este repositorio implementa una arquitectura **MLOps** para optimizar alertas predictivas agrícolas en **AGROSMART TECH S.A.C.**

## 📌 Descripción

El sistema integra modelos de Machine Learning para apoyar decisiones agrícolas mediante predicciones orientadas a:

- **Recomendación de cultivo** (modelo agrónomo)
- **Monitoreo/alertas de riesgo** (modelo guardián)

La solución incluye:
- Preparación y análisis de datos
- Entrenamiento de modelos
- Persistencia de artefactos (`.pkl`)
- Exposición de predicciones vía API con FastAPI

---

## 🧱 Estructura del proyecto

```text
AgroSmartTech_MLOps/
├── README.md
├── requirements.txt
├── backend/
│   └── app.py
├── data/
│   ├── Crop_recommendation.csv
│   ├── Dataset_Smart_Farming_base.csv
│   └── Smart_Farming_Crop_Yield_2024.csv
├── models/
│   ├── agronomo_rf.pkl
│   ├── guardian_rf.pkl
│   ├── preprocesador_agronomo.pkl
│   └── preprocesador_guardian.pkl
├── notebook/
│   ├── 01_exploracion.ipynb
│   ├── 02_procesamiento.ipynb
│   ├── 03_entrenamiento_guardian.ipynb
│   └── 04_entrenamiento_agronomo.ipynb
├── scripts/
│   └── generar_dataset.py
└── tests/
    └── test_api.py
```

---

## ⚙️ Requisitos

- Python 3.9+ (recomendado)
- pip
- Dependencias del archivo `requirements.txt`

---

## 🚀 Instalación

1. Clonar el repositorio:
```bash
git clone <URL_DEL_REPOSITORIO>
cd AgroSmartTech_MLOps
```

2. Crear y activar entorno virtual:

**Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

**Linux/Mac:**
```bash
python -m venv .venv
source .venv/bin/activate
```

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

---

## ▶️ Ejecución de la API

Desde la raíz del proyecto:

```bash
uvicorn backend.app:app --reload
```

La API estará disponible en:

- `http://127.0.0.1:8000`
- Documentación Swagger: `http://127.0.0.1:8000/docs`
- Documentación ReDoc: `http://127.0.0.1:8000/redoc`

---

## 🔌 Endpoints (referencia)

> Ajusta esta sección según los nombres exactos definidos en `backend/app.py`.

Ejemplo de endpoints esperados:

- `GET /` → estado general del servicio
- `POST /predict/agronomo` → recomendación de cultivo
- `POST /predict/guardian` → alerta/predicción de riesgo

### Ejemplo de request (genérico)

```json
{
  "nitrogeno": 90,
  "fosforo": 42,
  "potasio": 43,
  "temperatura": 20.8,
  "humedad": 82.0,
  "ph": 6.5,
  "lluvia": 202.9
}
```

### Ejemplo de respuesta (genérica)

```json
{
  "prediccion": "rice",
  "confianza": 0.93
}
```

---

## 🧠 Modelos y artefactos

En `models/` se almacenan:

- `agronomo_rf.pkl`: modelo de recomendación agrícola
- `guardian_rf.pkl`: modelo de alertas/monitoreo
- `preprocesador_agronomo.pkl`: pipeline de preprocesamiento del agrónomo
- `preprocesador_guardian.pkl`: pipeline de preprocesamiento del guardián

---

## 🧪 Pruebas

Ejecutar pruebas con:

```bash
pytest -q
```

Archivo principal de pruebas:
- `tests/test_api.py`

---

## 📊 Flujo de trabajo (MLOps académico)

1. Exploración de datos (`notebook/01_exploracion.ipynb`)
2. Procesamiento (`notebook/02_procesamiento.ipynb`)
3. Entrenamiento modelo guardián (`notebook/03_entrenamiento_guardian.ipynb`)
4. Entrenamiento modelo agrónomo (`notebook/04_entrenamiento_agronomo.ipynb`)
5. Exportación de modelos a `models/`
6. Despliegue de inferencia en API (`backend/app.py`)

---

## 🛠️ Tecnologías usadas

- Python
- FastAPI
- scikit-learn
- pandas / numpy
- pytest
- Uvicorn

---

## 📌 Mejoras futuras

- Dockerización del servicio
- Pipeline CI/CD (GitHub Actions)
- Versionado de modelos y datos (MLflow/DVC)
- Monitoreo de drift y performance en producción
- Autenticación y control de acceso a la API

---

## 👥 Autores

Proyecto desarrollado para fines académicos en el curso de Desarrollo de Aplicaciones con DevOps.

---

