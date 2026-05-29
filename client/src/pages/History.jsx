import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExportPanel from '../components/ExportPanel';
import ErrorBanner from '../components/ErrorBanner';
import { Calendar, Plus, Edit2, Trash2, MapPin, Loader2, Sparkles, X, Check } from 'lucide-react';

const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function History() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form State for creating a new Historical Query
  const [newForm, setNewForm] = useState({ location: '', dateFrom: '', dateTo: '', notes: '' });
  const [formLoading, setFormLoading] = useState(false);

  // Editing State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ location: '', dateFrom: '', dateTo: '', notes: '' });
  const [editLoading, setEditLoading] = useState(false);

  // Fetch all queries from server
  const fetchQueries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/queries`);
      setQueries(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load database search logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  // Form Validation helper
  const validateForm = (form) => {
    const { location, dateFrom, dateTo } = form;
    if (!location.trim() || !dateFrom || !dateTo) {
      return 'All fields except notes are required.';
    }

    const start = new Date(dateFrom);
    const end = new Date(dateTo);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Please enter valid calendar dates.';
    }

    if (start > end) {
      return 'Start date cannot be after the End date.';
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      return 'Search period cannot exceed 30 days.';
    }

    return null;
  };

  // POST Create handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm(newForm);
    if (error) {
      setErrorMsg(error);
      return;
    }

    setFormLoading(true);
    setErrorMsg('');
    try {
      await axios.post(`${serverUrl}/api/queries`, newForm);
      setNewForm({ location: '', dateFrom: '', dateTo: '', notes: '' });
      fetchQueries(); // reload grid
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not fetch and save historical data.');
    } finally {
      setFormLoading(false);
    }
  };

  // PUT Edit click activator
  const handleStartEdit = (q) => {
    setEditingId(q._id);
    setEditForm({
      location: q.location,
      dateFrom: q.dateFrom.split('T')[0],
      dateTo: q.dateTo.split('T')[0],
      notes: q.notes || ''
    });
  };

  // PUT Save update handler
  const handleEditSubmit = async (id) => {
    const error = validateForm(editForm);
    if (error) {
      setErrorMsg(error);
      return;
    }

    setEditLoading(true);
    setErrorMsg('');
    try {
      await axios.put(`${serverUrl}/api/queries/${id}`, editForm);
      setEditingId(null);
      fetchQueries();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not save historical update.');
    } finally {
      setEditLoading(false);
    }
  };

  // DELETE handler
  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this historical record?')) return;
    
    try {
      await axios.delete(`${serverUrl}/api/queries/${id}`);
      fetchQueries();
    } catch (err) {
      setErrorMsg('Could not delete selected historical query.');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-6 pb-12 animate-in fade-in duration-300">
      <ErrorBanner message={errorMsg} onClose={() => setErrorMsg('')} />

      {/* Grid wrapper splits between creating new query and showing exporting panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Hand: New Query Input Panel */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl border border-slate-700/40 dark:glass-panel">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-teal-400 shrink-0" />
              <h3 className="text-lg font-bold text-slate-100 tracking-wide">New Historical Query</h3>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tokyo, 10001, Eiffel Tower..."
                  value={newForm.location}
                  onChange={(e) => setNewForm({ ...newForm, location: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/80 transition text-sm shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Date From</label>
                  <input
                    type="date"
                    required
                    value={newForm.dateFrom}
                    onChange={(e) => setNewForm({ ...newForm, dateFrom: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/80 transition text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Date To</label>
                  <input
                    type="date"
                    required
                    value={newForm.dateTo}
                    onChange={(e) => setNewForm({ ...newForm, dateTo: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/80 transition text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Custom Notes</label>
                <textarea
                  placeholder="Add custom travel insights or notes..."
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/80 transition text-sm shadow-inner resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover-scale transition cursor-pointer disabled:opacity-50 text-sm"
              >
                {formLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Generate Weather Log</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Hand: Export Panel & History Cards List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Export Widget */}
          <ExportPanel onExportError={(msg) => setErrorMsg(msg)} />

          {/* Records Display Grid */}
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-4 px-1">Weather Queries Archive</h3>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                <p className="text-slate-400 text-xs font-medium">Reading historical database indexes...</p>
              </div>
            ) : queries.length === 0 ? (
              <div className="glass-panel text-center py-12 px-4 rounded-3xl border border-slate-800/80">
                <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-2.5 animate-pulse" />
                <p className="text-sm font-semibold text-slate-300">History Database is Empty</p>
                <p className="text-xs text-slate-500 mt-0.5">Submit your first query on the left to start compiling records!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {queries.map((q) => {
                  const isEditing = editingId === q._id;

                  return (
                    <div
                      key={q._id}
                      className="glass-panel rounded-2xl p-5 border border-slate-700/40 flex flex-col justify-between hover-scale transition duration-300 dark:glass-panel"
                    >
                      {/* CARD CONTENT */}
                      <div>
                        
                        {/* Header Location Title */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                            <h4 className="font-bold text-slate-100 text-sm line-clamp-1">
                              {q.resolvedCity || q.location}
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                            {new Date(q.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Search keyword if fuzzy resolved */}
                        {q.resolvedCity && q.resolvedCity.toLowerCase() !== q.location.toLowerCase() && (
                          <p className="text-[10px] text-slate-400 font-medium ml-5 mt-0.5">
                            Searched: "{q.location}"
                          </p>
                        )}

                        {/* Date Time Range */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium mt-3 ml-1 bg-slate-900/30 py-1 px-2.5 rounded-lg border border-slate-800/40 w-fit">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          <span>
                            {new Date(q.dateFrom).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(q.dateTo).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Weather Summary Line */}
                        {q.weatherData && q.weatherData.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-slate-800/60">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Historical Analytics</p>
                            <p className="text-xs text-slate-200 mt-1 font-semibold">
                              Temp range: {Math.round(Math.min(...q.weatherData.map(d => d.minTemp)))}°C to {Math.round(Math.max(...q.weatherData.map(d => d.maxTemp)))}°C
                            </p>
                            <p className="text-[11px] text-slate-400 italic mt-0.5 capitalize">
                              Dominant weather: {q.weatherData[0]?.description || 'Unspecified'}
                            </p>
                          </div>
                        )}

                        {/* EDIT NOTES OR INLINE NOTES */}
                        {isEditing ? (
                          <div className="mt-4 space-y-3 pt-3 border-t border-slate-800/60 animate-in fade-in duration-200">
                            <div>
                              <label className="block text-[9px] font-bold text-teal-400 uppercase tracking-widest mb-1">Edit Location</label>
                              <input
                                type="text"
                                required
                                value={editForm.location}
                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 transition text-xs shadow-inner"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-teal-400 uppercase tracking-widest mb-1">Date From</label>
                                <input
                                  type="date"
                                  required
                                  value={editForm.dateFrom}
                                  onChange={(e) => setEditForm({ ...editForm, dateFrom: e.target.value })}
                                  className="w-full px-2 py-1.5 bg-slate-950/60 border border-slate-700/60 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400 transition text-[10px]"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-teal-400 uppercase tracking-widest mb-1">Date To</label>
                                <input
                                  type="date"
                                  required
                                  value={editForm.dateTo}
                                  onChange={(e) => setEditForm({ ...editForm, dateTo: e.target.value })}
                                  className="w-full px-2 py-1.5 bg-slate-950/60 border border-slate-700/60 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400 transition text-[10px]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-teal-400 uppercase tracking-widest mb-1">Modify Notes</label>
                              <textarea
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 transition text-xs shadow-inner"
                              />
                            </div>
                          </div>
                        ) : (
                          q.notes && (
                            <div className="mt-3.5 p-2.5 bg-slate-950/30 rounded-xl border border-slate-800/40">
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Notes</p>
                              <p className="text-xs text-slate-300 italic mt-0.5 line-clamp-2">{q.notes}</p>
                            </div>
                          )
                        )}
                      </div>

                      {/* CARD FOOTER ACTIONS */}
                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-800/40">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                            <button
                              onClick={() => handleEditSubmit(q._id)}
                              disabled={editLoading}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition disabled:opacity-50"
                            >
                              {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>Save</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(q)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800/80 text-slate-300 border border-slate-800/80 rounded-xl text-xs font-semibold cursor-pointer transition"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(q._id)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800/80 text-slate-300 border border-slate-800/80 rounded-xl text-xs font-semibold cursor-pointer transition hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
