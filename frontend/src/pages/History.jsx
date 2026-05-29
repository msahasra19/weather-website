import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, Edit3, Calendar, Check, X, Tag, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Note editing states
  const [editingId, setEditingId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get('/api/weather/history');
      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch search history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this weather record?')) {
      setActionLoadingId(id);
      try {
        const { data } = await axios.delete(`/api/weather/history/${id}`);
        if (data.success) {
          setHistory(history.filter(h => h._id !== id));
        }
      } catch (err) {
        console.error('Failed to delete search record:', err.message);
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const startEditing = (id, currentNote) => {
    setEditingId(id);
    setEditNoteText(currentNote || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNoteText('');
  };

  const handleSaveNote = async (id) => {
    setEditLoading(true);
    try {
      const { data } = await axios.put(`/api/weather/history/${id}`, { notes: editNoteText });
      if (data.success) {
        setHistory(history.map(h => h._id === id ? { ...h, notes: editNoteText } : h));
        cancelEditing();
      }
    } catch (err) {
      console.error('Failed to update weather note:', err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`/api/weather/export?format=${format}`, {
        responseType: format === 'csv' ? 'blob' : 'json',
      });
      
      let blob;
      let filename;
      
      if (format === 'csv') {
        blob = new Blob([response.data], { type: 'text/csv' });
        filename = `WeatherIQ_History_${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        // Formatted JSON download
        blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
        filename = `WeatherIQ_History_${new Date().toISOString().split('T')[0]}.json`;
      }
      
      // Programmatic file download for protected endpoints
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to export weather history as ${format.toUpperCase()}:`, err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
            Search History
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage and export your saved location reports</p>
        </div>
        
        {history.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={() => handleExport('csv')}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer shadow-md shadow-slate-900/30"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Export CSV</span>
            </button>
            <button 
              onClick={() => handleExport('json')}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer shadow-md shadow-slate-900/30"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Export JSON</span>
            </button>
          </div>
        )}
      </div>

      <div className="glass-panel overflow-hidden border border-white/10 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/40 border-b border-slate-700/80">
                <th className="p-5 font-semibold text-slate-300 text-sm uppercase tracking-wider">Location</th>
                <th className="p-5 font-semibold text-slate-300 text-sm uppercase tracking-wider">Temperature</th>
                <th className="p-5 font-semibold text-slate-300 text-sm uppercase tracking-wider">Condition</th>
                <th className="p-5 font-semibold text-slate-300 text-sm uppercase tracking-wider">Saved On / Notes</th>
                <th className="p-5 font-semibold text-slate-300 text-sm uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400">
                    <div className="flex flex-col justify-center items-center space-y-3">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <span>Loading search logs...</span>
                    </div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400">
                    <div className="flex flex-col justify-center items-center space-y-2 py-6">
                      <FileSpreadsheet className="w-12 h-12 text-slate-600 mb-2" />
                      <span className="text-slate-300 font-medium">No weather history logs found.</span>
                      <span className="text-slate-500 text-sm">Perform a search on the Dashboard to save data here.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {history.map((record) => (
                    <motion.tr 
                      key={record._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-slate-700/40 hover:bg-white/5 transition duration-200"
                    >
                      <td className="p-5 font-medium text-slate-100">{record.location}</td>
                      <td className="p-5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {Math.round(record.weatherDetails.temperature)}°C
                        </span>
                      </td>
                      <td className="p-5 capitalize text-slate-300">
                        {record.weatherDetails.condition}
                      </td>
                      <td className="p-5 text-slate-400 min-w-[280px]">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{new Date(record.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>

                          {/* Travel dates itinerary badge (Tech Assessment 2.1 READ verification) */}
                          {record.startDate && record.endDate && (
                            <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs text-teal-400 bg-teal-500/10 px-2 py-0.5 border border-teal-500/20 rounded-md w-fit font-medium">
                              <span>✈️ Travel:</span>
                              <span>{new Date(record.startDate).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}</span>
                              <span>-</span>
                              <span>{new Date(record.endDate).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}</span>
                            </div>
                          )}
                          
                          {/* Note Display/Edit Component */}
                          {editingId === record._id ? (
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                type="text"
                                value={editNoteText}
                                onChange={(e) => setEditNoteText(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                                placeholder="Add custom notes..."
                                autoFocus
                                disabled={editLoading}
                              />
                              <button
                                onClick={() => handleSaveNote(record._id)}
                                disabled={editLoading}
                                className="p-1.5 bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 rounded-lg text-green-400 transition cursor-pointer"
                                title="Save changes"
                              >
                                {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={cancelEditing}
                                disabled={editLoading}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded-lg text-red-400 transition cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 group/note">
                              {record.notes ? (
                                <span className="text-sm bg-slate-800/80 px-3 py-1 border border-slate-700/50 rounded-lg text-slate-200 inline-flex items-center gap-1.5 max-w-[240px] truncate">
                                  <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{record.notes}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-600 italic">No notes added</span>
                              )}
                              
                              <button 
                                onClick={() => startEditing(record._id, record.notes)}
                                className="opacity-0 group-hover/note:opacity-100 p-1 hover:text-blue-400 text-slate-500 transition-opacity duration-200"
                                title="Edit notes"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <div className="inline-flex space-x-1">
                          <button 
                            onClick={() => startEditing(record._id, record.notes)} 
                            className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition cursor-pointer"
                            title="Edit Record Notes"
                          >
                            <Edit3 className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(record._id)} 
                            disabled={actionLoadingId === record._id}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                            title="Delete Record"
                          >
                            {actionLoadingId === record._id ? (
                              <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-4.5 h-4.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
