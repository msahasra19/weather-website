import React from 'react';

const YoutubeIcon = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.387-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function YouTubePanel({ videos, cityName }) {
  if (!videos || videos.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-4 px-1">
        <YoutubeIcon className="w-5 h-5 text-red-600 animate-pulse shrink-0" />
        <h3 className="text-lg font-bold text-slate-200 tracking-wide">
          Explore {cityName || 'the city'} through Travel Videos
        </h3>
      </div>

      {/* Grid: 1 column on mobile, 3 columns on large screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {videos.slice(0, 3).map((video) => (
          <div
            key={video.id}
            className="glass-panel rounded-2xl overflow-hidden border border-slate-700/40 hover-scale transition duration-300 flex flex-col justify-between dark:glass-panel"
          >
            {/* Embedded Iframe Player */}
            <div className="relative aspect-video w-full bg-slate-950">
              <iframe
                title={video.title}
                src={`https://www.youtube.com/embed/${video.id}`}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>

            {/* Typography metadata */}
            <div className="p-4 flex-grow flex flex-col justify-between">
              <p 
                className="text-xs font-semibold text-slate-200 line-clamp-2 hover:text-blue-400 transition" 
                title={video.title}
                dangerouslySetInnerHTML={{ __html: video.title }}
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                  by {video.channelTitle}
                </span>
                <span className="text-[9px] bg-red-500/10 text-red-400 font-bold px-1.5 py-0.5 rounded-full border border-red-500/20 uppercase tracking-widest shrink-0">
                  4K UHD
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
