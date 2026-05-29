import React, { useState } from 'react';
import { Search, Navigation, Loader2 } from 'lucide-react';

export default function SearchBar({ onSearch, onUseLocation, isLoading }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  const handleGPSClick = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onUseLocation(latitude, longitude);
      },
      (error) => {
        console.error('Error fetching GPS geolocation:', error);
        alert(`Could not retrieve location: ${error.message}. Please input a city manually.`);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mt-6">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3.5 bg-slate-950/40 border border-slate-700/60 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-transparent transition text-sm shadow-inner dark:bg-slate-950/40"
            placeholder="Search city, ZIP, landmark (e.g. Eiffel Tower) or GPS (17.3850,78.4867)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-grow md:flex-grow-0 flex items-center justify-center space-x-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover-scale transition text-sm shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={handleGPSClick}
            disabled={isLoading}
            className="flex items-center justify-center p-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-2xl hover-scale transition cursor-pointer disabled:opacity-50"
            title="Use current location coordinates"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
