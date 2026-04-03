import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Target, Activity, LayoutDashboard, LogOut, Sun, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
      setIsDark(true);
    } else {
      root.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-card h-auto md:h-screen border-b md:border-r border-slate-200 flex flex-col items-center justify-between p-6 shrink-0">
        <div className="w-full">
          <div className="mb-8 w-full flex items-center justify-center md:justify-start gap-3">
            <Activity className="text-primary w-8 h-8" />
            <span className="font-bold text-xl text-text-primary hidden md:inline">BRUTAL Tracker</span>
          </div>
          <nav className="w-full flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 transition font-medium whitespace-nowrap">
              <LayoutDashboard className="w-5 h-5 text-muted" /> Dashboard
            </Link>
            <Link to="/habits" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 transition font-medium whitespace-nowrap">
              <Activity className="w-5 h-5 text-muted" /> Tracker
            </Link>
            <Link to="/goals" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 transition font-medium whitespace-nowrap">
              <Target className="w-5 h-5 text-muted" /> Monthly Goals
            </Link>
          </nav>
        </div>
        
        <div className="w-full flex md:flex-col gap-2 mt-auto">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition font-medium w-full"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-orange-400 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            <span className="hidden md:inline">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <button
            onClick={handleSignOut}
            className="hidden md:flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition font-medium w-full"
          >
            <LogOut className="w-5 h-5 shrink-0" /> Sign Out
          </button>
        </div>
      </aside>

      
      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full max-w-5xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
