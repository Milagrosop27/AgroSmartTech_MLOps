import streamlit as st
import pandas as pd
import numpy as np
import requests
from pathlib import Path

# Configuración profesional
st.set_page_config(page_title="AgroSmart Tech Dashboard", page_icon="🚜", layout="wide")

st.markdown("""
    <style>
    [data-testid="stMetric"] {
        background-color: #1e2129; /* Fondo oscuro elegante */
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #333;
    }
    [data-testid="stMetricValue"] {
        color: #2ecc71; /* Verde brillante para los números */
    }
    </style>
    """, unsafe_allow_html=True)

st.title("🚜 AgroSmart Tech: Sistema de Control MLOps")
st.markdown("### Monitor de Inteligencia Artificial en Tiempo Real (Google Cloud Run)")

# --- RUTAS A LOS DATOS (Igual que en tu simulador) ---
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'
ruta_iot = DATA_DIR / 'Smart_Farming_Crop_Yield_2024.csv'
ruta_quimico = DATA_DIR / 'Crop_recommendation.csv'

URL_API = "https://agrosmart-api-940420015515.us-central1.run.app/predecir"

# --- SIDEBAR ---
st.sidebar.image("https://cdn-icons-png.flaticon.com/512/2316/2316517.png", width=100)
st.sidebar.header("Configuración de Sensores")
num_muestras = st.sidebar.select_slider("Cantidad de registros a procesar", options=[10, 50, 100, 500, 1000])

if st.sidebar.button("📡 Sincronizar y Predecir"):
    with st.spinner("Conectando con el cerebro en la nube..."):
        try:
            # 1. LEER LOS DATOS REALES (Tu motor infalible)
            df_iot = pd.read_csv(ruta_iot)
            df_quimico = pd.read_csv(ruta_quimico)

            # Tomar una muestra aleatoria
            df_muestra = df_iot.sample(n=num_muestras, replace=True).copy()

            # Mapear N,P,K
            np.random.seed(42)
            cultivos_originales = df_iot['crop_type'].unique()
            etiquetas_quimico = df_quimico['label'].unique()
            mapa_nutricional = {cultivo: np.random.choice(etiquetas_quimico) for cultivo in cultivos_originales}

            lista_nutrientes = []
            for cultivo in df_muestra['crop_type']:
                equivalente = mapa_nutricional[cultivo]
                fila_npk = df_quimico[df_quimico['label'] == equivalente].sample(1)
                lista_nutrientes.append(fila_npk[['N', 'P', 'K']].values[0])

            df_npk = pd.DataFrame(lista_nutrientes, columns=['N', 'P', 'K'], index=df_muestra.index)
            df_maestro = pd.concat([df_muestra, df_npk], axis=1)

            columnas_irrelevantes = ['farm_id', 'sensor_id', 'timestamp', 'sowing_date', 'harvest_date', 'latitude',
                                     'longitude', 'crop_disease_status']
            df_para_api = df_maestro.drop(columns=columnas_irrelevantes, errors='ignore')
            df_para_api = df_para_api.replace({np.nan: None})

            payload = df_para_api.to_dict(orient='records')

            # 2. Llamada real a Google Cloud
            res = requests.post(URL_API, json=payload)

            if res.status_code == 200:
                resultados = res.json()

                pred_riesgo = resultados.get("estado_riesgo", [])
                pred_fert = resultados.get("fertilizante_recomendado", [])

                # --- FILA 1: MÉTRICAS (KPIs) ---
                st.subheader("📌 Indicadores Clave de Desempeño")
                m1, m2, m3, m4 = st.columns(4)

                alertas_graves = pred_riesgo.count("Severe") + pred_riesgo.count("Moderate")
                fert_mas_comun = max(set(pred_fert), key=pred_fert.count) if pred_fert else "N/A"

                m1.metric("Total Analizado", f"{len(pred_riesgo)}", "Plantas")
                m2.metric("Estado de Alerta", f"{alertas_graves}", "Casos Críticos", delta_color="inverse")

                # Prevenir división por cero si no hay sanas
                porcentaje_sanas = int((pred_riesgo.count('Healthy') / len(pred_riesgo)) * 100) if len(
                    pred_riesgo) > 0 else 0
                m3.metric("Salud Promedio", f"{porcentaje_sanas}%", "Óptimo")
                m4.metric("Recomendación Top", fert_mas_comun)

                st.divider()

                # --- FILA 2: GRÁFICOS DINÁMICOS ---
                col_left, col_right = st.columns(2)

                with col_left:
                    st.markdown("#### 🛡️ Diagnóstico del 'Guardián' (Salud)")
                    df_r = pd.DataFrame({"Estado": pred_riesgo})
                    st.bar_chart(df_r["Estado"].value_counts(), color="#27ae60")

                with col_right:
                    st.markdown("#### 🧪 Diagnóstico del 'Agrónomo' (Nutrición)")
                    df_f = pd.DataFrame({"Tipo": pred_fert})
                    st.bar_chart(df_f["Tipo"].value_counts(), color="#2980b9")

                    
            else:
                st.error(f"Error {res.status_code} de Google Cloud: {res.text}")
        except Exception as e:
            st.error(f"Error de conexión interno: {e}")

else:
    st.info("👋 Bienvenida. Haz clic en el botón de la izquierda para iniciar el análisis IoT.")