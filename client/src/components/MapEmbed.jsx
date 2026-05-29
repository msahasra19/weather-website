import React from 'react';

export default function MapEmbed({ lat, lon, locationName }) {
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  // Clean coordinates check
  if (!lat || !lon) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 text-sm">
        GPS coordinates unavailable to load map
      </div>
    );
  }

  // 1. Google Maps Iframe Embed if key is configured
  if (googleKey && googleKey !== 'your_key' && googleKey.trim() !== '') {
    const googleEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${googleKey}&q=${lat},${lon}&zoom=11`;
    return (
      <iframe
        title={`Google Maps embed displaying ${locationName || 'Location'}`}
        className="w-full h-full border-0 select-none"
        loading="lazy"
        allowFullScreen
        src={googleEmbedUrl}
      />
    );
  }

  // 2. High-Fidelity Graceful Fallback: Keyless OpenStreetMap Iframe Embed
  // Calculate bounding box offset around coordinates
  const offset = 0.015;
  const minLon = lon - offset;
  const minLat = lat - offset;
  const maxLon = lon + offset;
  const maxLat = lat + offset;
  
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <div className="w-full h-full relative group">
      <iframe
        title={`OpenStreetMap embed displaying ${locationName || 'Location'}`}
        className="w-full h-full border-0"
        src={osmEmbedUrl}
      />
      <div className="absolute bottom-2 left-2 bg-slate-900/90 text-[10px] text-teal-400 font-semibold px-2 py-0.5 rounded border border-teal-500/20 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
        OpenStreetMap Free Layer
      </div>
    </div>
  );
}
