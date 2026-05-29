import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CloudRain, History as HistoryIcon, MapPin, LogIn, LogOut, User as UserIcon } from 'lucide-react';

function AppContent() {
  const { user, logout } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col">
        {/* Navigation */}
        <nav className="glass-panel mx-4 mt-4 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-50 sticky top-4">
          <div className="flex items-center space-x-2">
            <CloudRain className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
              WeatherIQ AI
            </span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/" className="flex items-center space-x-1 hover:text-blue-400 transition py-1">
              <MapPin className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            
            <Link to="/history" className="flex items-center space-x-1 hover:text-teal-400 transition py-1">
              <HistoryIcon className="w-4 h-4" />
              <span>History</span>
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4 border-l border-slate-700 pl-6">
                <div className="flex items-center space-x-2 text-slate-300 py-1">
                  <div className="bg-blue-500/20 p-1.5 rounded-full border border-blue-500/30">
                    <UserIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">Hi, {user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700/80 text-slate-200 hover:text-red-400 border border-slate-700 rounded-lg px-3 py-1.5 text-sm transition font-medium cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 border-l border-slate-700 pl-6">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 text-slate-300 hover:text-white transition px-2 py-1 text-sm font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-1.5 text-sm font-medium transition cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
