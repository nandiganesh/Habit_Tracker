import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useUserStore, useHabitStore, useGoalStore } from './store/store';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import HabitDetail from './pages/HabitDetail';
import GoalsPage from './pages/GoalsPage';
import HabitsPage from './pages/HabitsPage';
import Login from './pages/Login';
import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        initializeStores(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        initializeStores(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeStores = async (userId: string) => {
    await useUserStore.getState().loadProfile(userId);
    await useHabitStore.getState().loadHabits(userId);
    await useHabitStore.getState().loadLogs(userId);
    await useGoalStore.getState().loadGoals(userId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="habit/:id" element={<HabitDetail />} />
          <Route path="goals" element={<GoalsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
