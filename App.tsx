import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Stock from './pages/Stock';
import Recipes from './pages/Recipes';
import Tickets from './pages/Tickets';
import Consumption from './pages/Consumption';
import Account from './pages/Account';
import Subscriptions from './pages/Subscriptions';
import Auth from './pages/Auth';
import { supabaseClient } from './utils/supabaseClient';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-softgray">
        <Loader2 className="animate-spin text-mint w-8 h-8" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
        <Route path="/recettes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
        <Route path="/consommation" element={<ProtectedRoute><Consumption /></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
        <Route path="/compte" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/abonnements" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;