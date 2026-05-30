import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import SearchBar from '../components/SearchBar';
import WeatherCard from '../components/WeatherCard';
import ForecastGrid from '../components/ForecastGrid';
import YouTubePanel from '../components/YouTubePanel';
import ErrorBanner from '../components/ErrorBanner';
import { Loader2, CloudAlert, RefreshCw, Sparkles } from 'lucide-react';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const serverUrl = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:5000' : '');

const fetcher = async (url) => {
  const res = await axios.get(url);
  return res.data;
};

export default function Home() {
  const [searchLocation, setSearchLocation] = useState('');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [offlineData, setOfflineData] = useState(null);

  // Check initial offline state and load local storage fallback
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    setIsOffline(!navigator.onLine);

    // Retrieve offline backup
    const backup = localStorage.getItem('lastFetchedWeather');
    if (backup) {
      try {
        setOfflineData(JSON.parse(backup));
      } catch (e) {
        console.error('Error parsing offline weather cache:', e);
      }
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // 1. Fetch Current Weather via SWR
  const currentWeatherUrl = gpsCoords 
    ? `${serverUrl}/api/weather/current?lat=${gpsCoords.lat}&lon=${gpsCoords.lon}`
    : searchLocation 
      ? `${serverUrl}/api/weather/current?location=${encodeURIComponent(searchLocation)}`
      : null;

  const { 
    data: weather, 
    error: weatherError, 
    isValidating: weatherValidating,
    mutate: mutateWeather 
  } = useSWR(currentWeatherUrl, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  // 2. Fetch Forecast via SWR
  const forecastUrl = gpsCoords
    ? `${serverUrl}/api/weather/forecast?lat=${gpsCoords.lat}&lon=${gpsCoords.lon}`
    : searchLocation
      ? `${serverUrl}/api/weather/forecast?location=${encodeURIComponent(searchLocation)}`
      : null;

  const { 
    data: forecastPayload, 
    error: forecastError, 
    isValidating: forecastValidating 
  } = useSWR(forecastUrl, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  // 3. Fetch YouTube Videos
  const resolvedCityName = weather?.city || '';
  const youtubeUrl = resolvedCityName
    ? `${serverUrl}/api/youtube?location=${encodeURIComponent(resolvedCityName)}`
    : null;

  const { 
    data: youtubeVideos, 
    error: youtubeError 
  } = useSWR(youtubeUrl, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });

  // Handle successful data loading and store in offline localStorage
  useEffect(() => {
    if (weather && forecastPayload) {
      const payloadToCache = {
        weather,
        forecast: forecastPayload.forecast,
        youtube: youtubeVideos || [],
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem('lastFetchedWeather', JSON.stringify(payloadToCache));
      setOfflineData(payloadToCache);
    }
  }, [weather, forecastPayload, youtubeVideos]);

  // Synchronize internal error state from SWR exceptions
  useEffect(() => {
    if (weatherError) {
      const errRes = weatherError.response?.data;
      setErrorMsg(errRes?.message || 'Failed to retrieve current weather data. Please verify your input.');
    } else if (forecastError) {
      setErrorMsg('Failed to load weather forecast coordinates.');
    } else {
      setErrorMsg('');
    }
  }, [weatherError, forecastError]);

  const handleSearchSubmit = (query) => {
    setGpsCoords(null);
    setSearchLocation(query);
  };

  const handleGPSTrigger = (lat, lon) => {
    setSearchLocation('');
    setGpsCoords({ lat, lon });
  };

  const isLoading = weatherValidating || forecastValidating;
  
  // Decide which data to render: active fetched, or offline backup
  const renderWeather = weather || (isOffline ? offlineData?.weather : null);
  const renderForecast = forecastPayload?.forecast || (isOffline ? offlineData?.forecast : null);
  const renderVideos = youtubeVideos || (isOffline ? offlineData?.youtube : null);

  return (
    <div className="min-h-screen pb-12">
      {/* Error Banners */}
      <ErrorBanner message={errorMsg} onClose={() => setErrorMsg('')} />
      
      {/* Offline Alert Badge */}
      {isOffline && (
        <div className="mx-auto max-w-4xl px-4 mt-2">
          <div className="flex items-center gap-2 p-3 text-amber-200 bg-amber-950/70 border border-amber-500/20 rounded-2xl text-xs font-semibold backdrop-blur-sm justify-center">
            <CloudAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Serving cached offline weather details. Last saved: {offlineData?.cachedAt ? new Date(offlineData.cachedAt).toLocaleString() : 'Never'}</span>
          </div>
        </div>
      )}

      {/* Input query field */}
      <SearchBar 
        onSearch={handleSearchSubmit} 
        onUseLocation={handleGPSTrigger} 
        isLoading={isLoading} 
      />

      {/* Main dashboard view */}
      {isLoading && !renderWeather && (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Resolving geolocated climate metrics...</p>
        </div>
      )}

      {/* Renders if there is weather data available */}
      {renderWeather ? (
        <div className="mt-4 animate-in fade-in duration-300">
          <WeatherCard weather={renderWeather} />
          
          {/* AI Weather Narrator Briefing Card */}
          <div className="w-full max-w-2xl mx-auto px-4 mt-6">
            {isLoading ? (
              <div className="glass-panel rounded-3xl p-6 border border-purple-500/25 shadow-xl backdrop-blur-md animate-pulse">
                <div className="flex items-center space-x-2.5 mb-3.5">
                  <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <Sparkles className="w-5 h-5 text-purple-400/60 animate-spin-slow" />
                  </div>
                  <div className="h-4 bg-slate-800 rounded w-48"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-full"></div>
                  <div className="h-3 bg-slate-800 rounded w-11/12"></div>
                  <div className="h-3 bg-slate-800 rounded w-4/5"></div>
                </div>
              </div>
            ) : (
              renderWeather.aiNarrative && (
                <div className="glass-panel rounded-3xl p-6 border border-purple-500/30 shadow-2xl backdrop-blur-md hover-scale transition duration-300 relative overflow-hidden group">
                  <div className="absolute -right-20 -top-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500"></div>
                  
                  <div className="flex items-center space-x-2.5 mb-3">
                    <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-xl shadow-md shadow-purple-500/20">
                      <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <h4 className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 uppercase">
                      AI Weather Narrator
                    </h4>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed italic relative z-10 dark:text-slate-200">
                    "{renderWeather.aiNarrative}"
                  </p>
                </div>
              )
            )}
          </div>
          
          {renderForecast && <ForecastGrid forecastData={renderForecast} />}
          
          {renderVideos && (
            <YouTubePanel videos={renderVideos} cityName={renderWeather.city} />
          )}
        </div>
      ) : (
        !isLoading && (
          <div className="flex flex-col items-center justify-center h-80 text-center px-4 mt-12">
            <div className="bg-slate-900/40 p-6 rounded-full border border-slate-800/80 mb-4">
              <RefreshCw className="w-10 h-10 text-slate-500 animate-pulse-slow" />
            </div>
            <h3 className="text-xl font-bold text-slate-200">No Climate Metrics Loaded</h3>
            <p className="text-slate-400 text-sm max-w-sm mt-1">
              Input a city name, ZIP code, GPS coordinates, or landmark to search current conditions and historic summaries!
            </p>
          </div>
        )
      )}
    </div>
  );
}
