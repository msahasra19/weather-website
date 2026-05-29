import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

// Component to dynamically change map view
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Fix standard Vite Leaflet marker asset bug by using a beautiful inline neon SVG marker
const customSVGIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <!-- Glow Ring -->
      <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-45"></span>
      <!-- Main Marker SVG -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 28px; height: 28px; color: #3b82f6; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));">
        <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
      </svg>
    </div>
  `,
  className: 'custom-svg-marker',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

export default function WeatherMap({ lat, lon }) {
  const position = [lat, lon];

  return (
    <MapContainer 
      center={position} 
      zoom={10} 
      style={{ height: '100%', width: '100%', minHeight: '300px' }}
      zoomControl={false}
    >
      <ChangeView center={position} zoom={10} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={customSVGIcon}>
        <Popup>
          <span className="font-semibold text-slate-900">Current Forecast Target</span>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
