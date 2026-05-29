import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import History from './pages/History';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  CloudSun, 
  History as HistoryIcon, 
  LayoutDashboard, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ArrowUpRight,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';

function AppContent() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // default dark mode
  });
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync theme changes with DOM element
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <Router>
      <div className="min-h-screen flex flex-col transition-colors duration-300 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
        
        {/* Navigation Bar */}
        <nav className="glass-panel mx-4 mt-4 px-6 py-4 flex items-center justify-between z-50 sticky top-4 rounded-3xl">
          
          {/* Logo brand */}
          <Link to="/" className="flex items-center space-x-2.5 hover:opacity-90 transition shrink-0">
            <div className="bg-gradient-to-tr from-blue-600 to-teal-400 p-2 rounded-2xl shadow-lg shadow-blue-500/20">
              <CloudSun className="w-6 h-6 text-white animate-bounce-short" />
            </div>
            <span className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
              WeatherIQ AI
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-1.5 transition text-sm font-semibold tracking-wide py-1 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            
            <Link to="/history" className="flex items-center space-x-1.5 transition text-sm font-semibold tracking-wide py-1 text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400">
              <HistoryIcon className="w-4 h-4" />
              <span>Search History</span>
            </Link>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-200 text-slate-600 border border-slate-300 rounded-2xl hover:text-amber-500 hover:bg-slate-300 transition cursor-pointer hover-scale dark:bg-slate-900/60 dark:border-slate-800/80 dark:text-slate-300 dark:hover:text-teal-400 dark:hover:bg-slate-900"
              aria-label="Toggle theme mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Authentication Profiles */}
            {user ? (
              <div className="flex items-center space-x-4 border-l border-slate-300 pl-6 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-slate-700 py-1 dark:text-slate-300">
                  <div className="bg-blue-500/20 p-1.5 rounded-full border border-blue-500/30">
                    <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold hidden sm:inline">Hi, {user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-rose-500 border border-slate-300 rounded-xl px-3 py-1.5 text-xs transition font-bold cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:text-slate-200 dark:hover:text-rose-400 dark:border-slate-700"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 border-l border-slate-300 pl-6 dark:border-slate-800">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition px-2 py-1 text-xs font-semibold dark:text-slate-300 dark:hover:text-white"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer shadow-lg shadow-blue-500/10"
                >
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Bar */}
          <div className="flex md:hidden items-center gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-200 text-slate-600 border border-slate-300 rounded-2xl hover:text-amber-500 transition cursor-pointer dark:bg-slate-900/60 dark:border-slate-800/80 dark:text-slate-300 dark:hover:text-teal-400"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-slate-200 text-slate-600 border border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-350 transition dark:bg-slate-900/60 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel mx-4 mt-2 p-5 rounded-3xl z-40 border border-slate-200 dark:border-slate-800/80 animate-in slide-in-from-top-4 duration-200 flex flex-col gap-4">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 py-2 text-slate-600 dark:text-slate-300 font-semibold"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/history"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 py-2 text-slate-600 dark:text-slate-300 font-semibold"
            >
              <HistoryIcon className="w-4 h-4 text-teal-400" />
              <span>Search History</span>
            </Link>

            {/* Mobile Auth options */}
            <div className="pt-4 border-t border-slate-300 dark:border-slate-800/80">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 py-1.5 text-slate-700 dark:text-slate-300">
                    <UserIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold">Logged in as {user.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-2.5 text-xs font-bold transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-1 text-slate-300 border border-slate-800 hover:bg-slate-900 rounded-xl py-2.5 text-xs font-bold transition"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-xs font-bold transition"
                  >
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
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

        {/* Footer Credit & PM Accelerator Branding */}
        <footer className="glass-panel mx-4 mb-4 mt-auto p-6 md:p-8 border border-slate-200 dark:border-slate-800/80 rounded-3xl">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-start gap-8">
            
            {/* Developer Credit & Program Description */}
            <div className="max-w-2xl">
              <h4 className="text-sm font-extrabold tracking-widest text-teal-400 uppercase">
                Developer Credit
              </h4>
              <p className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
                Miriyala Sahasra
              </p>
              
              <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-800/60">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Academic / Assessment Affiliate
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1.5">
                  The Product Manager Accelerator Program is designed to support PM professionals through every stage of their careers. From students looking for entry-level jobs to Directors looking to take on a leadership role, our program has helped over hundreds of students fulfill their career aspirations.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-2.5">
                  Our Product Manager Accelerator community are ambitious and committed. Through our program they have learnt, honed and developed new PM and leadership skills, giving them a strong foundation for their future endeavors.
                </p>
              </div>
            </div>

            {/* Hyperlinks */}
            <div className="shrink-0 flex flex-col gap-3">
              <a
                href="https://www.linkedin.com/school/pmaccelerator/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 hover-scale transition cursor-pointer"
              >
                <span>PM Accelerator LinkedIn</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <span className="text-[10px] text-slate-500 font-medium text-left lg:text-right">
                Full-Stack WeatherIQ © 2026
              </span>
            </div>

          </div>
        </footer>

      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
