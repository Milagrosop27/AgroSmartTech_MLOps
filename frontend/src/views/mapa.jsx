import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Mapa = () => {
  const [ndviPromedio, setNdviPromedio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Coordenadas reales extraídas del KML
  const coordenadasParcela = [
    [-13.04305294324663, -76.31179100658558],
    [-13.04582890386070, -76.31107067491148],
    [-13.04860255740165, -76.30799320564867],
    [-13.04706613195590, -76.30213688719574],
    [-13.04636212054815, -76.30213200456758],
    [-13.04440937468744, -76.30521948941461],
    [-13.04302162531410, -76.29922166366896],
    [-13.04058498852641, -76.29949140002071],
    [-13.04038546774208, -76.30274803968047],
    [-13.04030400066042, -76.30518229411322],
    [-13.04171675938103, -76.31071142740458],
    [-13.04305294324663, -76.31179100658558]
  ];

  // Límites extremos de tu fundo
  const bounds = [
    [-13.04860255740165, -76.31179100658558], // Esquina Suroeste (min_lat, min_lon)
    [-13.04030400066042, -76.29922166366896]  // Esquina Noreste (max_lat, max_lon)
  ];

  // El BBox exacto que espera Sentinel: [min_lon, min_lat, max_lon, max_lat]
  const bboxParaSentinel = [
    -76.31179100658558, // min_lon
    -13.04860255740165, // min_lat
    -76.29922166366896, // max_lon
    -13.04030400066042  // max_lat
  ];

  useEffect(() => {
    const obtenerMapaNDVI = async () => {
      try {
        // ⚠️ Asegúrate de poner aquí la URL de tu Cloud Run
        const apiUrl = 'https://agrosmart-api-940420015515.us-central1.run.app/api/satelite/ndvi';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bbox: bboxParaSentinel })
        });

        const data = await response.json();

        if (data.status === 'success') {
          setNdviPromedio(data.ndvi_promedio);
        } else {
          setError(data.error);
        }
      } catch (error) {
        console.error("Error obteniendo datos satelitales", error);
        setError("Error de red al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    obtenerMapaNDVI();
  }, []); // Se ejecuta solo una vez al cargar el componente

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-2 text-green-800">Monitoreo Satelital de Fundo</h1>
      <p className="text-gray-600 mb-4">
        Visualización del área seleccionada (~12 km²) en San Vicente de Cañete.
      </p>

      {/* Tarjeta de Resultados NDVI */}
      <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
        <h3 className="text-lg font-bold text-green-900">Salud del Cultivo (NDVI Sentinel-2)</h3>
        {loading ? (
          <p className="text-gray-600">📡 Conectando con satélite y calculando...</p>
        ) : error ? (
          <p className="text-red-600">❌ Error: {error}</p>
        ) : (
          <p className="text-xl font-semibold text-green-700">
            Índice Promedio: {ndviPromedio}
            <span className="text-sm font-normal text-gray-700 ml-2">
              ({ndviPromedio >= 0.5 ? 'Óptimo 🌿' : 'Requiere Atención ⚠️'})
            </span>
          </p>
        )}
      </div>

      <div className="border-4 border-green-600 rounded-lg overflow-hidden shadow-lg">
        <MapContainer bounds={bounds} style={{ height: '600px', width: '100%' }}>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri'
          />
          <Polygon positions={coordenadasParcela} color="#00FF00" weight={3} fillOpacity={0.1} />
        </MapContainer>
      </div>
    </div>
  );
};

export default Mapa;