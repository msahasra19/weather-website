import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between p-4 text-rose-100 bg-rose-950/75 border border-rose-500/30 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-rose-300 hover:text-white rounded-lg hover:bg-rose-900/40 transition cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
