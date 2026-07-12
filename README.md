# AgroSmartTech_MLOps

Proyecto académico de **MLOps** orientado a la optimización de alertas predictivas agrícolas para **AGROSMART TECH S.A.C.**

Este repositorio reúne el ciclo completo de vida de una solución de analítica y Machine Learning aplicada al agro:

- exploración y preparación de datos,
- entrenamiento de modelos,
- serialización de artefactos,
- exposición de predicciones mediante API,
- visualización ejecutiva en frontend,
- integración con mensajería WhatsApp,
- y despliegue en **Google Cloud Run** con apoyo de **GitHub Actions**.

---

## 1. Resumen ejecutivo

El sistema fue diseñado para centralizar la lectura de datos agrícolas y convertirlos en decisiones operativas. La solución combina:

1. **Modelo Guardián**: identifica el nivel de riesgo o estado sanitario de la parcela.
2. **Modelo Agrónomo**: propone una recomendación de fertilizante o manejo agronómico.
3. **Frontend ejecutivo**: presenta métricas, alertas y paneles de acción para supervisión en tiempo real.
4. **Backend de inferencia**: expone las predicciones y registra resultados en servicios de almacenamiento analítico.

La arquitectura está orientada a que un usuario técnico o agrónomo pueda observar rápidamente el estado del campo y tomar acciones a partir de resultados de Machine Learning.

---

## 2. Objetivo del proyecto

El objetivo principal es construir una plataforma que permita:

- monitorizar condiciones agrícolas con datos IoT y satelitales,
- predecir riesgos de plagas o estrés de cultivo,
- sugerir recomendaciones de manejo,
- visualizar el resultado en un dashboard moderno,
- y activar alertas por WhatsApp en caso de eventos críticos.

Este enfoque busca reducir tiempos de reacción, mejorar la trazabilidad de decisiones y simular un flujo MLOps realista con despliegue continuo.

---

## 3. Alcance funcional

### 3.1 Backend

El backend está implementado con **Flask** y expone endpoints para:

- recibir registros de sensores y parcelas,
- ejecutar predicciones con modelos serializados en `.pkl`,
- guardar predicciones en **BigQuery**,
- enviar alertas por WhatsApp,
- recibir y procesar webhooks,
- y exponer histórico para el dashboard.

### 3.2 Frontend

El frontend está desarrollado con **React + Vite** y se encarga de:

- mostrar indicadores ejecutivos,
- representar la evolución de variables,
- visualizar alertas críticas,
- facilitar acciones rápidas de notificación,
- y presentar la distribución de estado de sectores.

### 3.3 Persistencia y analítica

Los modelos entrenados se almacenan como artefactos en `models/` y los resultados operativos pueden persistirse en BigQuery. Esto permite separar:

- entrenamiento offline,
- inferencia online,
- visualización,
- y almacenamiento histórico.

---

## 4. Arquitectura general

```text
Datos (CSV / IoT / simulador)
        ↓
Preprocesamiento y entrenamiento
        ↓
Modelos serializados (.pkl)
        ↓
API Flask en backend/app.py
        ↓
BigQuery + Webhooks WhatsApp
        ↓
Frontend React (dashboard ejecutivo)
        ↓
Despliegue en Google Cloud Run
```

### ¿Por qué se hacen estas conexiones?

- **CSV / datasets**: permiten entrenar y validar los modelos con históricos agrícolas.
- **Flask API**: centraliza la inferencia y desacopla el backend del frontend.
- **BigQuery**: conserva trazabilidad de predicciones, útil para auditoría y análisis posterior.
- **WhatsApp**: canal operativo de notificación rápida para emergencias.
- **React frontend**: permite al ejecutivo ver el estado sin entrar al backend.
- **Cloud Run**: facilita despliegue serverless, escalable y sencillo de mantener.
- **GitHub Actions**: automatiza build, push y despliegue continuo.

---

## 5. Tecnologías utilizadas

### 5.1 Backend / Data Science

- Python 3.9+ (recomendado)
- Flask 3.1.3
- flask-cors 6.0.2
- pandas 3.0.2
- numpy 2.4.4
- scikit-learn 1.8.0
- imbalanced-learn 0.14.1
- joblib 1.5.3
- gunicorn 26.0.0
- requests 2.33.1
- Google Cloud BigQuery

### 5.2 Frontend

- React 19.2.x
- React DOM 19.2.x
- Vite 8.x
- React Router DOM 7.x
- Recharts 3.x
- Lucide React 1.x
- Axios 1.x
- Tailwind CSS 4.x

### 5.3 DevOps / Cloud

- Docker
- Docker Compose
- Google Cloud Run
- Artifact Registry
- GitHub Actions
- GitHub Secrets / variables de entorno

### 5.4 Desarrollo y documentación

- Jupyter Notebook
- pytest
- Visual Studio Code / PyCharm

---

## 6. Requisitos previos

### Recomendado

- **Python** 3.9 o superior
- **Node.js** 20 LTS o superior
- **npm** 10+ o equivalente
- **Git**
- **Docker** y Docker Compose
- Cuenta activa en **Google Cloud Platform**
- Proyecto con acceso a **BigQuery** y **Artifact Registry**

### Credenciales y permisos

Para ejecutar correctamente el backend y el despliegue se requiere:

- acceso a un proyecto de GCP,
- credenciales para BigQuery,
- permisos para escribir en Artifact Registry,
- y permisos de despliegue en Cloud Run.

---

## 7. Estructura del repositorio

```text
AgroSmartTech_MLOps/
├── backend/
│   ├── app.py
│   └── services/
├── data/
│   ├── AgroSmart_Datos_Base.csv
│   ├── AgroSmart_Datos_Sinteticos_Base.csv
│   ├── Crop_recommendation.csv
│   ├── Crop-recommendation-dataset.csv
│   ├── Dataset_Smart_Farming_base.csv
│   └── Smart_Farming_Crop_Yield_2024.csv
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── services/
│   │   └── views/
│   └── package.json
├── models/
│   ├── agronomo_rf.pkl
│   ├── guardian_rf.pkl
│   ├── label_encoder_agronomo.pkl
│   ├── label_encoder_guardian.pkl
│   ├── preprocesador_agronomo.pkl
│   └── preprocesador_guardian.pkl
├── notebook/
│   ├── 01_exploracion.ipynb
│   ├── 02_procesamiento.ipynb
│   ├── 03_entrenamiento_guardian.ipynb
│   └── 04_entrenamiento_agronomo.ipynb
├── scripts/
│   ├── entrenar_modelos.py
│   ├── generar_dataset.py
│   ├── simulador_iot.py
│   ├── dashboard.py
│   └── eda.py
├── tests/
│   └── test_api.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## 8. Metodología de trabajo

El proyecto sigue una combinación de **CRISP-DM** y prácticas de **MLOps**.

### 8.1 CRISP-DM aplicado

1. **Entendimiento del negocio**
   - definición del problema agrícola,
   - identificación de alertas y recomendaciones.

2. **Entendimiento de los datos**
   - exploración de variables meteorológicas, edáficas y productivas,
   - análisis de calidad, distribuciones y correlaciones.

3. **Preparación de datos**
   - limpieza,
   - manejo de nulos,
   - codificación de variables categóricas,
   - separación de atributos numéricos y categóricos.

4. **Modelado**
   - entrenamiento con Random Forest,
   - balanceo de clases con SMOTE para el modelo guardián.

5. **Evaluación**
   - uso de accuracy como métrica base,
   - verificación de consistencia de predicciones.

6. **Despliegue**
   - exportación de modelos,
   - integración con Flask,
   - despliegue en Cloud Run.

### 8.2 Enfoque MLOps

Se incorporan elementos propios de MLOps:

- versionado de datasets y modelos,
- separación entre entrenamiento e inferencia,
- consumo de datos por API,
- observabilidad mediante dashboard,
- automatización de despliegue,
- y alertas operativas.

---

## 9. Descripción del backend

El archivo principal `backend/app.py` implementa la API Flask y organiza el sistema en las siguientes funciones:

### 9.1 Carga de recursos

Al iniciar, el backend carga:

- `guardian_rf.pkl`
- `preprocesador_guardian.pkl`
- `label_encoder_guardian.pkl`
- `agronomo_rf.pkl`
- `preprocesador_agronomo.pkl`
- `label_encoder_agronomo.pkl`

Esto evita recargar los modelos en cada petición y mejora el rendimiento.

### 9.2 Predicción `/predecir`

Recibe un lote JSON con variables de sensores y realiza:

- predicción del nivel de riesgo con el modelo guardián,
- predicción de fertilizante o recomendación con el modelo agrónomo,
- cálculo de una regla de riego,
- persistencia en BigQuery,
- y envío automático de alertas por WhatsApp cuando el riesgo es `Severe`.

### 9.3 Dashboard `/datos-dashboard`

Devuelve el histórico más reciente para el frontend. Esta ruta es la base del panel ejecutivo y permite que React muestre métricas resumidas, series temporales y sectores afectados.

### 9.4 Webhooks y confirmaciones

El backend expone rutas para:

- verificación de webhook de WhatsApp,
- recepción de eventos entrantes,
- confirmación de acciones,
- y consulta de confirmaciones por polling.

---

## 10. Descripción del frontend

El frontend en `frontend/` se construyó con React y Vite para mostrar una interfaz rápida y modular.

### Componentes principales

- `App.jsx`: orquesta rutas, estado global y lógica de carga.
- `layouts/MainLayout.jsx`: contiene barra lateral y estructura principal.
- `context/AppContext.jsx`: comparte el estado global.
- `views/overview.jsx`: dashboard ejecutivo de KPIs, emergencias y estado de sectores.
- `views/guardian.jsx`: vista de diagnóstico.
- `views/alerts.jsx`: historial de alertas.

### ¿Por qué se usa React Router?

Porque la solución requiere varias pantallas funcionales:

- tablero ejecutivo,
- guardián,
- alertas,
- y vistas auxiliares.

### ¿Por qué se usa Recharts?

Porque permite construir gráficos rápidos de línea, área y anillo/donut para interpretar:

- evolución de telemetría,
- distribución de estados,
- y proporción de sectores.

### ¿Por qué se usa Tailwind CSS?

Porque facilita:

- rapidez de maquetado,
- consistencia visual,
- y diseño responsive sin escribir grandes hojas CSS manuales.

---

## 11. Entrenamiento de modelos

El script `scripts/entrenar_modelos.py` realiza el entrenamiento de los modelos del proyecto.

### 11.1 Modelo Guardián

Objetivo: clasificar el estado de salud o riesgo del cultivo.

Proceso:

- carga del dataset,
- limpieza,
- eliminación de columnas irrelevantes,
- codificación de variables categóricas,
- escalado de variables numéricas,
- balanceo con SMOTE,
- entrenamiento con RandomForestClassifier,
- exportación del modelo y preprocesador.

### 11.2 Modelo Agrónomo

Objetivo: recomendar un fertilizante o tratamiento.

Proceso:

- filtrado de registros con `fertilizer_type`,
- selección de variables agronómicas,
- separación train/test,
- preprocesamiento combinado (numérico + categórico),
- entrenamiento con RandomForestClassifier,
- exportación de artefactos.

---

## 12. Simulador IoT y flujo de datos

El script `scripts/simulador_iot.py` simula el envío de microbatches de datos al backend.

### Propósito

Permite probar el comportamiento del sistema sin depender de sensores reales.

### Flujo

1. lee el dataset base,
2. genera muestras con ruido estadístico,
3. limpia valores anómalos,
4. envía los registros a la API `/predecir`,
5. repite el ciclo cada cierto intervalo.

### ¿Por qué es importante?

Porque reproduce el comportamiento de un sistema IoT real y habilita pruebas de:

- inferencia online,
- guardado de resultados,
- alertas automáticas,
- y visualización del dashboard.

---

## 13. Integración con WhatsApp

La comunicación con WhatsApp se usa como canal operativo para alertas críticas.

### Servicios involucrados

- `backend/services/whatsapp_service.py`
- `backend/services/webhook_service.py`

### Finalidad

Cuando el modelo detecta riesgo alto, el backend puede:

- construir una plantilla de mensaje,
- enviar la alerta al número configurado,
- y registrar la acción para trazabilidad.

Esto transforma el modelo en una herramienta útil para el usuario final, no solo en un generador de predicciones.

---

## 14. Despliegue en Google Cloud Run

El proyecto contempla despliegue en **Cloud Run** para exponer el backend como servicio administrado.

### Motivo del uso de Cloud Run

- escalado automático,
- despliegue sencillo de contenedores,
- integración natural con Artifact Registry,
- y compatibilidad con GitHub Actions.

### Flujo de despliegue

1. GitHub Actions construye la imagen Docker.
2. La imagen se publica en Artifact Registry.
3. Cloud Run despliega el contenedor.
4. El frontend consume la API desplegada.

---

## 15. CI/CD

El repositorio incluye workflows en `.github/workflows/` para automatizar procesos.

### Objetivo del pipeline

- validar cambios,
- construir artefactos,
- publicar imágenes,
- y desplegar automáticamente el servicio.

Esto reduce intervención manual y mejora la consistencia entre entornos.

### 15.1 Estructura del pipeline (build, test, deploy)

El pipeline definido en `.github/workflows/ci.yml` sigue la lógica clásica de integración continua y despliegue continuo:

1. **Build**
   - descarga del repositorio con `actions/checkout`,
   - construcción de la imagen Docker a partir del `Dockerfile` raíz,
   - validación de que el contenedor se puede generar sin errores.

2. **Test**
   - ejecución de validaciones mínimas durante el proceso de CI,
   - verificación de que el proyecto puede construirse de forma reproducible,
   - ejecución de pruebas automáticas cuando se incorporen en el workflow o mediante `pytest`.

3. **Deploy**
   - autenticación contra Google Cloud con un service account almacenado en GitHub Secrets,
   - autenticación de Docker con Artifact Registry,
   - publicación de la imagen en `us-central1-docker.pkg.dev`,
   - despliegue del servicio en **Google Cloud Run**.

Esta estructura permite que cada cambio aprobado en la rama principal se convierta en una nueva versión del backend desplegada de forma automática.

### 15.2 Archivos de configuración utilizados

El proyecto usa varios archivos de configuración que sostienen el flujo de desarrollo, pruebas y despliegue:

- `.github/workflows/ci.yml` → pipeline de CI/CD con build, push y deploy.
- `Dockerfile` → define la imagen base del backend, instala dependencias y lanza `gunicorn`.
- `docker-compose.yml` → facilita la ejecución local del backend en un entorno similar al contenedor.
- `requirements.txt` → fija las dependencias Python del backend y del entrenamiento.
- `frontend/package.json` → declara scripts, dependencias y herramientas del frontend React/Vite.
- `frontend/eslint.config.js` → reglas de calidad de código para React.
- `frontend/vite.config.js` → configuración del bundler y servidor de desarrollo.
- `frontend/tailwind.config.js` y `frontend/postcss.config.js` → soporte para estilos utilitarios.

En otros proyectos con pipelines más extensos, estos mismos conceptos suelen complementarse con archivos como `Jenkinsfile` o `.gitlab-ci.yml`. En este repositorio, la automatización equivalente se implementa con **GitHub Actions**.

### 15.3 Logs de ejecución y simulación de errores

Durante el desarrollo y la validación del sistema se generan logs para observar el comportamiento del backend, del simulador IoT y del pipeline. Estos registros son útiles para detectar fallos y verificar si el flujo de datos está funcionando correctamente.

#### Ejemplos de logs esperados

- **Carga de modelos**
  - `Sistemas IA cargados correctamente.`
  - `Error crítico al cargar modelos: ...` si los artefactos `.pkl` faltan o están corruptos.

- **Predicción y persistencia**
  - `Errores BQ: ...` cuando BigQuery rechaza una inserción.
  - `¡Alerta automática enviada para FARM000X!` cuando el riesgo es `Severe`.

- **Webhook y WhatsApp**
  - `¡Acción confirmada por el usuario ...!` cuando llega una confirmación.
  - `Error en el webhook POST: ...` ante payloads inválidos.

- **Frontend y dashboard**
  - `Datos recibidos de API: ...` para verificar la respuesta del endpoint `/datos-dashboard`.
  - `Error conectando con la API: ...` si el backend no está disponible.

#### Simulación de errores frecuentes

Para validar robustez, se suelen simular estos escenarios:

1. **Falta de modelos en `models/`**
   - el backend no puede cargar recursos y lo registra en logs.

2. **Falla de conectividad con BigQuery**
   - la API continúa, pero se reporta el error en consola/log.

3. **Backend no disponible**
   - el frontend muestra el último registro cacheado o estados vacíos controlados.

4. **Payload incompleto o inválido**
   - el endpoint responde con error controlado y mensaje descriptivo.

Estos logs forman parte de la evidencia técnica del proyecto, ya que muestran tanto la operación normal como los mecanismos de recuperación ante fallos.

---

## 16. Instalación y ejecución local

### 16.1 Backend

Crear entorno virtual e instalar dependencias:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Ejecutar la API:

```powershell
python -m backend.app
```

o con variable de entorno para puerto:

```powershell
$env:PORT=8080
python -m backend.app
```

### 16.2 Frontend

Instalar dependencias:

```powershell
cd frontend
npm install
```

Levantar la aplicación:

```powershell
npm run dev
```

### 16.3 Pruebas

```powershell
pytest -q
```

---

## 17. Variables y rutas relevantes

### Backend

- `GET /` → estado general del servicio
- `POST /predecir` → inferencia y registro
- `GET /datos-dashboard` → histórico para el frontend
- `POST /enviar-alerta-wa` → envío manual de alerta por WhatsApp
- `GET /webhook` → verificación de webhook
- `POST /webhook` → recepción de eventos
- `GET /api/confirmaciones` → confirmaciones de WhatsApp

### Frontend

- `frontend/src/App.jsx`
- `frontend/src/views/overview.jsx`
- `frontend/src/layouts/MainLayout.jsx`
- `frontend/src/context/AppContext.jsx`

---

## 18. Buenas prácticas y consideraciones

- No versionar `node_modules/`.
- Mantener `models/` bajo control de versionado solo si el equipo lo necesita; en caso contrario, almacenarlos en artefactos o storage externo.
- Verificar que las credenciales de GCP estén correctamente configuradas para BigQuery y Cloud Run.
- Validar que los datasets tengan el mismo esquema esperado por los preprocesadores.
- Probar el flujo completo localmente antes de desplegar.

---

## 19. Mejoras futuras

- Migrar a MLflow para tracking de experimentos.
- Añadir DVC para versionado de datos.
- Implementar monitoreo de drift y calidad de predicciones.
- Añadir autenticación y roles en el dashboard.
- Reforzar pruebas automáticas de API y frontend.
- Incluir almacenamiento persistente para alertas y confirmaciones.

---

## 20. Conclusión

AgroSmartTech_MLOps representa una solución de aprendizaje aplicada a la agricultura con enfoque MLOps. El sistema combina modelos de Machine Learning, backend de inferencia, almacenamiento analítico, notificaciones por WhatsApp y un dashboard ejecutivo para apoyar decisiones en campo.

La estructura del proyecto permite evolucionar desde una fase académica hacia una solución productiva, ya que separa claramente entrenamiento, despliegue, visualización y automatización.

---

## 21. Autores

Proyecto desarrollado con fines académicos.
