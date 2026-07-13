import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, ImageOverlay } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Mapa = () => {
  const [ndviImage, setNdviImage] = useState(null);

  // 1. Tus coordenadas reales extraídas del KML de Google Earth
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

  // 2. Límites extremos de tu fundo (Suroeste y Noreste)
  // Esto servirá para encuadrar la cámara y luego para pegar la foto del satélite
  const bounds = [
    [-13.04860255740165, -76.31179100658558], // Esquina Suroeste
    [-13.04030400066042, -76.29922166366896]  // Esquina Noreste
  ];

  useEffect(() => {
    // Aquí haremos la petición al backend de Flask en el próximo paso

    const obtenerMapaNDVI = async () => {
      try {
        const response = await fetch('URL_DE_TU_API/api/satelite/ndvi');
        const data = await response.json();
        setNdviImage(data.url_imagen_ndvi);
      } catch (error) {
        console.error("Error obteniendo datos satelitales", error);
      }
    };
    obtenerMapaNDVI();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-2 text-green-800">Monitoreo Satelital de Fundo</h1>
      <p className="text-gray-600 mb-4">
        Visualización del Índice de Vegetación (NDVI) para el área seleccionada (~12 km²).
      </p>

      <div className="border-4 border-green-600 rounded-lg overflow-hidden shadow-lg">
        {/* Usamos 'bounds' directamente. Leaflet calculará el centro y el zoom ideal
          automáticamente para que tu polígono encaje perfecto en la pantalla.
        */}
        <MapContainer bounds={bounds} style={{ height: '600px', width: '100%' }}>

          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Source: Esri'
          />

          <Polygon positions={coordenadasParcela} color="#00FF00" weight={3} fillOpacity={0.1} />

          {ndviImage && (
            <ImageOverlay
              url={ndviImage}
              bounds={bounds}
              opacity={0.7}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default Mapa;