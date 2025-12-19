
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Stock from './pages/Stock';
import Recipes from './pages/Recipes';
import Tickets from './pages/Tickets';
import Planning from './pages/Planning';
import Consumption from './pages/Consumption';
import Account from './pages/Account';
import Subscriptions from './pages/Subscriptions';
import Auth from './pages/Auth';
import Audit from './pages/Audit';
import AdminDashboard from './pages/AdminDashboard';
import { supabase } from './services/mockSupabase';
import { isAdmin } from './services/authService';
import React, { useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { User } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode, adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const u = await supabase.getUser();
      setUser(u);
      setLoading(false);
    };
    checkSession();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-softgray">
      <Loader2 className="animate-spin text-mint w-12 h-12" />
    </div>
  );

  // 1. Redirection si non connecté
  if (!user) return <Navigate to="/auth" />;

  // 2. Vérification compte suspendu
  if (user.accountStatus === 'suspended') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center max-w-md border border-red-100">
                <ShieldAlert size={64} className="text-red-500 mx-auto mb-6" />
                <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">Accès Suspendu</h1>
                <p className="text-gray-500 mb-8">Votre compte a été désactivé par un administrateur du foyer.</p>
                <button onClick={() => supabase.logout().then(() => window.location.reload())} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold">Déconnexion</button>
            </div>
        </div>
      );
  }

  // 3. Redirection si accès admin requis mais droits insuffisants
  if (adminOnly && !isAdmin(user)) {
    console.warn("Accès refusé : Rôle admin requis.");
    return <Navigate to="/" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
        <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
        <Route path="/recettes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
        <Route path="/consommation" element={<ProtectedRoute><Consumption /></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
        <Route path="/compte" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/abonnements" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
        
        {/* ROUTES ADMIN (LAYER FRONT) */}
        <Route path="/audit" element={<ProtectedRoute adminOnly><Audit /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
