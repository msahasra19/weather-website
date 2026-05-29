import React, { useState } from 'react';
import axios from 'axios';
import { Download, FileJson, FileSpreadsheet, FileCode, FileText, FileDown, Loader2 } from 'lucide-react';

export default function ExportPanel({ onExportError }) {
  const [loadingFormat, setLoadingFormat] = useState(null);

  const triggerExport = async (format) => {
    setLoadingFormat(format);
    try {
      const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios({
        url: `${serverUrl}/api/export?format=${format}`,
        method: 'GET',
        responseType: 'blob' // Essential for receiving binary files like PDFs
      });

      // Construct a temporary blob file pointer
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const fileUrl = window.URL.createObjectURL(blob);
      
      // Determine file extension
      let extension = format;
      if (format === 'markdown') extension = 'md';

      const downloadLink = document.createElement('a');
      downloadLink.href = fileUrl;
      downloadLink.setAttribute('download', `weather_queries_export.${extension}`);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Garbage collect file handle
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error(`Export failed for format ${format}:`, err);
      if (onExportError) {
        onExportError(`Could not export history as ${format.toUpperCase()}. Please check if database is empty.`);
      }
    } finally {
      setLoadingFormat(null);
    }
  };

  const formats = [
    { type: 'json', label: 'JSON', icon: FileJson, color: 'hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30' },
    { type: 'csv', label: 'CSV', icon: FileSpreadsheet, color: 'hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30' },
    { type: 'xml', label: 'XML', icon: FileCode, color: 'hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30' },
    { type: 'pdf', label: 'PDF Report', icon: FileText, color: 'hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30' },
    { type: 'markdown', label: 'Markdown', icon: FileDown, color: 'hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30' }
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-700/40 dark:glass-panel animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-teal-400 shrink-0" />
        <h4 className="text-sm font-bold text-slate-200 tracking-wide">Export Search History Database</h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {formats.map((fmt) => {
          const Icon = fmt.icon;
          const isCurrentLoading = loadingFormat === fmt.type;

          return (
            <button
              key={fmt.type}
              onClick={() => triggerExport(fmt.type)}
              disabled={loadingFormat !== null}
              className={`flex items-center justify-center space-x-2 px-4 py-3 bg-slate-900/40 text-slate-300 border border-slate-800/80 rounded-2xl text-xs font-semibold hover-scale transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${fmt.color}`}
            >
              {isCurrentLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span>{fmt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
