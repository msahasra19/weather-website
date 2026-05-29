import React from 'react';

export default function ForecastGrid({ forecastData }) {
  if (!forecastData || forecastData.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-8">
      <h3 className="text-lg font-bold text-slate-200 mb-4 tracking-wide px-1">5-Day Weather Forecast</h3>
      
      {/* Responsive layout: row on desktop, column on mobile */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        {forecastData.map((day, idx) => (
          <div
            key={day.date + idx}
            className="flex-1 glass-panel rounded-2xl p-5 flex lg:flex-col items-center justify-between lg:justify-center text-center border border-slate-700/40 hover-scale transition duration-300 dark:glass-panel"
          >
            {/* Weekday name */}
            <div className="text-left lg:text-center shrink-0">
              <p className="text-sm font-semibold text-slate-100">{day.dayName}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{day.date.split('-').slice(1).join('/')}</p>
            </div>

            {/* Weather OWM icon */}
            <div className="flex items-center lg:flex-col justify-center my-1">
              <img
                src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                alt={day.description}
                className="w-12 h-12 drop-shadow-[0_2px_8px_rgba(59,130,246,0.2)]"
              />
              <span className="hidden lg:block text-[10px] text-slate-400 capitalize truncate max-w-[100px]">
                {day.description}
              </span>
            </div>

            {/* High / Low temperatures */}
            <div className="text-right lg:text-center shrink-0">
              <span className="text-base font-bold text-slate-100">{day.maxTemp}°</span>
              <span className="text-sm font-medium text-slate-400 ml-2">{day.minTemp}°</span>
              <span className="lg:hidden block text-[10px] text-slate-400 capitalize">
                {day.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
