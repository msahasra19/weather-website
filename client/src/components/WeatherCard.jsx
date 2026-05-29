import React from 'react';
import { Wind, Droplets, Thermometer, Compass, Clock, MapPin } from 'lucide-react';
import MapEmbed from './MapEmbed';

// Custom Mapper from OpenWeatherMap icon codes to Lucide icons
const getWeatherIcon = (iconCode) => {
  const isNight = iconCode.endsWith('n');
  const code = iconCode.slice(0, 2);

  const iconStyle = "w-16 h-16 text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]";

  switch (code) {
    case '01': // Clear Sky
      return isNight 
        ? <Compass className={`${iconStyle} text-amber-200 drop-shadow-[0_0_12px_rgba(253,244,152,0.3)]`} />
        : <Compass className={`${iconStyle} text-amber-500 animate-spin-slow drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]`} />;
    case '02': // Few Clouds
    case '03': // Scattered Clouds
    case '04': // Broken Clouds
      return <Compass className={`${iconStyle} text-slate-300`} />;
    case '09': // Shower Rain
    case '10': // Rain
      return <Compass className={`${iconStyle} text-blue-400`} />;
    case '11': // Thunderstorm
      return <Compass className={`${iconStyle} text-purple-400`} />;
    case '13': // Snow
      return <Compass className={`${iconStyle} text-sky-200`} />;
    case '50': // Mist / Fog
      return <Compass className={`${iconStyle} text-teal-300`} />;
    default:
      return <Compass className={iconStyle} />;
  }
};

export default function WeatherCard({ weather }) {
  if (!weather) return null;

  const {
    city,
    country,
    temp,
    feelsLike,
    humidity,
    windSpeed,
    description,
    icon,
    lat,
    lon,
    timezone
  } = weather;

  // Calculate local time based on city timezone offset
  const getLocalTime = () => {
    try {
      const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
      const localDate = new Date(utc + (timezone * 1000));
      return localDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return new Date().toLocaleTimeString();
    }
  };

  const getLocalDate = () => {
    try {
      const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
      const localDate = new Date(utc + (timezone * 1000));
      return localDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return new Date().toLocaleDateString();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="glass-panel text-slate-100 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 border border-slate-700/40 dark:glass-panel">
        
        {/* Main Stats Segment */}
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-400 shrink-0" />
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">{city}</h2>
                <span className="text-xs bg-slate-800/80 text-teal-300 font-semibold px-2 py-0.5 rounded-full border border-teal-500/20">{country}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-slate-400 text-sm font-medium">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{getLocalDate()} | {getLocalTime()}</span>
              </div>
            </div>

            {/* Weather OWM Condition Icon */}
            <div className="flex flex-col items-center">
              <img 
                src={`https://openweathermap.org/img/wn/${icon}@2x.png`} 
                alt={description}
                className="w-16 h-16 drop-shadow-[0_4px_10px_rgba(59,130,246,0.3)] animate-pulse"
              />
              <span className="text-xs text-slate-400 font-medium capitalize mt-1">{description}</span>
            </div>
          </div>

          {/* Temperature Layout */}
          <div className="flex items-baseline space-x-2 mt-4">
            <span className="text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-50 via-slate-100 to-slate-300">
              {Math.round(temp)}
            </span>
            <span className="text-3xl font-light text-slate-400">°C</span>
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/60">
            <div className="flex flex-col items-center p-3 bg-slate-950/20 rounded-2xl border border-slate-800/30">
              <Thermometer className="w-5 h-5 text-rose-400 mb-1.5" />
              <span className="text-xs text-slate-400 font-semibold">Feels Like</span>
              <span className="text-sm font-bold text-slate-100 mt-0.5">{Math.round(feelsLike)}°C</span>
            </div>

            <div className="flex flex-col items-center p-3 bg-slate-950/20 rounded-2xl border border-slate-800/30">
              <Droplets className="w-5 h-5 text-blue-400 mb-1.5" />
              <span className="text-xs text-slate-400 font-semibold">Humidity</span>
              <span className="text-sm font-bold text-slate-100 mt-0.5">{humidity}%</span>
            </div>

            <div className="flex flex-col items-center p-3 bg-slate-950/20 rounded-2xl border border-slate-800/30">
              <Wind className="w-5 h-5 text-teal-400 mb-1.5" />
              <span className="text-xs text-slate-400 font-semibold">Wind Speed</span>
              <span className="text-sm font-bold text-slate-100 mt-0.5">{windSpeed} m/s</span>
            </div>
          </div>
        </div>

        {/* Embedded Map Block */}
        <div className="relative h-64 border-t border-slate-800/40">
          <MapEmbed lat={lat} lon={lon} locationName={city} />
        </div>

      </div>
    </div>
  );
}
