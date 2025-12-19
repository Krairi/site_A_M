
import React, { useState, useEffect } from 'react';
import { Users, Crown, ShieldAlert, Star, Search, Mail, Loader2, Check, ShieldCheck, TrendingUp, DollarSign, UserCheck, AlertTriangle, Settings2, Trash2, Filter, RefreshCw, Lock, Eye, BookOpen, Calendar, Wand2, X, ChevronRight, Ban, UserMinus, Shield } from 'lucide-react';
import { supabase } from '../services/mockSupabase';
import { User, UserPermission } from '../types';

const PERMISSIONS_MAP: { id: UserPermission; label: string; icon: any; color: string }[] = [
    { id: 'manage_stock', label: 'Gestion Stock', icon: BookOpen, color: 'text-aqua' },
    { id: 'view_budget', label: 'Vue Budget', icon: DollarSign, color: 'text-honey' },
    { id: 'manage_planning', label: 'Planning Repas', icon: Calendar, color: 'text-purple-500' },
    { id: 'generate_recipes', label: 'IA Cuisine', icon: Wand2, color: 'text-mint' },
    { id: 'admin_access', label: 'Accès Admin', icon: ShieldAlert, color: 'text-red-500' },
];

const ROLE_BLUEPRINTS = [
    { name: 'Enfant', permissions: ['generate_recipes'] as UserPermission[], desc: 'Consultation & Recettes' },
    { name: 'Co-Gérant', permissions: ['manage_stock', 'manage_planning', 'generate_recipes'] as UserPermission[], desc: 'Gestion quotidienne' },
    { name: 'Comptable', permissions: ['view_budget'] as UserPermission[], desc: 'Focus financier' },
    { name: 'Maître du Foyer', permissions: ['manage_stock', 'view_budget', 'manage_planning', 'generate_recipes', 'admin_access'] as UserPermission[], desc: 'Contrôle total' },
];

const PermissionModal = ({ user, onClose, onUpdate }: { user: User; onClose: () => void; onUpdate: (userId: string, perms: UserPermission[]) => void }) => {
    const [selectedPerms, setSelectedPerms] = useState<UserPermission[]>(user.permissions || []);
    const [saving, setSaving] = useState(false);

    const togglePerm = (perm: UserPermission) => {
        setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
    };

    const applyBlueprint = (perms: UserPermission[]) => {
        setSelectedPerms(perms);
    };

    const handleSave = async () => {
        setSaving(true);
        await onUpdate(user.id, selectedPerms);
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-xl shadow-gray-200">
                            <Shield size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900">Droits d'accès</h2>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full shadow-sm">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                    {/* Blueprints */}
                    <div>
                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Modèles de rôles intelligents</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {ROLE_BLUEPRINTS.map(bp => (
                                <button 
                                    key={bp.name}
                                    onClick={() => applyBlueprint(bp.permissions)}
                                    className="p-4 rounded-2xl border border-gray-100 hover:border-mint hover:bg-mint/5 text-left transition-all group relative overflow-hidden"
                                >
                                    <p className="font-bold text-gray-800 group-hover:text-mint transition-colors">{bp.name}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{bp.desc}</p>
                                    <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Wand2 size={48} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Matrix */}
                    <div>
                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Configuration granulaire</h3>
                        <div className="space-y-3">
                            {PERMISSIONS_MAP.map(p => (
                                <div 
                                    key={p.id}
                                    onClick={() => togglePerm(p.id)}
                                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                                        selectedPerms.includes(p.id) ? 'bg-white border-mint shadow-md ring-1 ring-mint/10' : 'bg-gray-50/50 border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl bg-white shadow-sm ${p.color}`}>
                                            <p.icon size={22} />
                                        </div>
                                        <span className={`font-bold ${selectedPerms.includes(p.id) ? 'text-gray-900' : 'text-gray-500'}`}>{p.label}</span>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative transition-colors ${selectedPerms.includes(p.id) ? 'bg-mint' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedPerms.includes(p.id) ? 'right-1' : 'left-1'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-gray-100 flex gap-4 bg-gray-50/30">
                    <button onClick={onClose} className="flex-1 py-4 bg-white text-gray-600 rounded-2xl font-bold border border-gray-200 hover:bg-gray-50 transition-all">Annuler</button>
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl shadow-gray-200 flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                        Appliquer les modifications
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterPlan, setFilterPlan] = useState<string>('all');
    const [editingPermissionsUser, setEditingPermissionsUser] = useState<User | null>(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        premiumUsers: 0,
        mrr: 0,
        activeAdmins: 0
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const data = await supabase.getAllProfiles();
        setUsers(data);
        
        const premium = data.filter(u => u.plan === 'premium' || u.plan === 'family').length;
        const familyCount = data.filter(u => u.plan === 'family').length;
        const premiumCount = data.filter(u => u.plan === 'premium').length;
        const mrr = (premiumCount * 4.99) + (familyCount * 9.99);
        const admins = data.filter(u => u.role === 'admin').length;

        setStats({
            totalUsers: data.length,
            premiumUsers: premium,
            mrr: parseFloat(mrr.toFixed(2)),
            activeAdmins: admins
        });
        setLoading(false);
    };

    const handleUpdatePermissions = async (userId: string, perms: UserPermission[]) => {
        const success = await supabase.adminUpdateUserPermissions(userId, perms);
        if (success) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions: perms, role: perms.includes('admin_access') ? 'admin' : 'user' } : u));
            loadUsers(); // Refresh stats
        }
    };

    const handleToggleStatus = async (user: User) => {
        const newStatus = user.accountStatus === 'suspended' ? 'active' : 'suspended';
        const ok = await supabase.adminUpdateUserStatus(user.id, newStatus);
        if (ok) {
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, accountStatus: newStatus } : u));
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase());
        const matchesPlan = filterPlan === 'all' || u.plan === filterPlan;
        return matchesSearch && matchesPlan;
    });

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="animate-spin text-mint w-10 h-10" />
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-display font-bold text-gray-900">Centre de Commande</h1>
                    <p className="text-gray-500 mt-2">Gestion intelligente des droits et surveillance du foyer.</p>
                </div>
                <button onClick={loadUsers} className="flex items-center gap-2 bg-gray-50 text-gray-700 px-6 py-3 rounded-2xl hover:bg-gray-100 transition-all font-bold border border-gray-100">
                    <RefreshCw size={18} className="animate-hover-spin" /> Rafraîchir
                </button>
            </div>

            {/* AI Security Analysis */}
            <div className="bg-orange-50 border border-orange-100 rounded-[2rem] p-6 flex items-start gap-5 shadow-sm">
                <div className="p-4 bg-white rounded-2xl text-orange-500 shadow-sm shrink-0 border border-orange-100">
                    <ShieldAlert size={28} />
                </div>
                <div>
                    <h3 className="font-bold text-orange-900 mb-1 flex items-center gap-2">
                        Intelligence de Sécurité
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-black uppercase">Alpha</span>
                    </h3>
                    <p className="text-sm text-orange-800 leading-relaxed max-w-2xl">
                        <span className="font-bold">Analyse :</span> {stats.activeAdmins > 2 ? 
                            "Attention : Le nombre d'administrateurs est élevé. Nous recommandons de limiter ces droits aux membres de confiance pour éviter toute manipulation de données critique." :
                            "Niveau de privilèges optimal. Les accès critiques sont limités aux personnes ressources."
                        }
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Utilisateurs" value={stats.totalUsers} icon={Users} colorClass="bg-aqua" subValue="+12% ce mois" />
                <StatCard title="Abonnés Payants" value={stats.premiumUsers} icon={Star} colorClass="bg-mint" subValue="+5% conversion" />
                <StatCard title="MRR Estimé" value={`${stats.mrr}€`} icon={DollarSign} colorClass="bg-honey" />
                <StatCard title="Accès Admin" value={stats.activeAdmins} icon={ShieldCheck} colorClass="bg-gray-900" />
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-soft border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Rechercher (email, nom)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint focus:bg-white transition-all font-medium"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select 
                            value={filterPlan}
                            onChange={(e) => setFilterPlan(e.target.value)}
                            className="pl-12 pr-10 py-4 bg-gray-50 border border-transparent rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint focus:bg-white transition-all font-bold text-gray-600 text-sm cursor-pointer"
                        >
                            <option value="all">Tous les plans</option>
                            <option value="free">Gratuit</option>
                            <option value="premium">Premium</option>
                            <option value="family">Famille</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* User List Table */}
            <div className="bg-white rounded-[2.5rem] shadow-soft border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Identité</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Abonnement</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Permissions Actives</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Contrôles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className={`hover:bg-gray-50/30 transition-colors group ${u.accountStatus === 'suspended' ? 'opacity-50' : ''}`}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm transition-transform group-hover:scale-110 ${
                                                u.role === 'admin' ? 'bg-gray-900' : 'bg-gradient-to-br from-aqua to-mint'
                                            }`}>
                                                {u.name?.charAt(0) || u.email.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 flex items-center gap-2">
                                                    {u.name || 'Anonyme'}
                                                    {u.role === 'admin' && <ShieldCheck size={14} className="text-mint" />}
                                                </p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Mail size={12} /> {u.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className={`w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                u.plan === 'free' ? 'bg-gray-100 text-gray-500' : 
                                                u.plan === 'premium' ? 'bg-mint/10 text-mint' : 'bg-honey/10 text-honey'
                                            }`}>
                                                {u.plan}
                                            </span>
                                            {u.accountStatus === 'suspended' && (
                                                <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
                                                    <Ban size={10} /> Compte Suspendu
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                            {u.permissions?.slice(0, 3).map(p => (
                                                <span key={p} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[8px] font-bold text-gray-400 uppercase">
                                                    {p.split('_').pop()}
                                                </span>
                                            ))}
                                            {(u.permissions?.length || 0) > 3 && (
                                                <span className="px-2 py-0.5 bg-gray-900 text-white rounded text-[8px] font-black">
                                                    +{(u.permissions?.length || 0) - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setEditingPermissionsUser(u)}
                                                className="p-3 bg-gray-50 text-gray-400 hover:text-mint hover:bg-mint/10 rounded-xl transition-all border border-transparent hover:border-mint/20"
                                                title="Modifier les droits"
                                            >
                                                <Settings2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleToggleStatus(u)}
                                                className={`p-3 rounded-xl transition-all border ${
                                                    u.accountStatus === 'suspended' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'
                                                }`}
                                                title={u.accountStatus === 'suspended' ? 'Réactiver' : 'Suspendre'}
                                            >
                                                {u.accountStatus === 'suspended' ? <UserCheck size={18} /> : <Ban size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingPermissionsUser && (
                <PermissionModal 
                    user={editingPermissionsUser} 
                    onClose={() => setEditingPermissionsUser(null)} 
                    onUpdate={handleUpdatePermissions}
                />
            )}
        </div>
    );
};

const StatCard = ({ title, value, subValue, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 shadow-inner`}>
                <Icon className={`${colorClass.replace('bg-', 'text-')}`} size={24} />
            </div>
            <div className="bg-gray-50 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg text-gray-400">Live</div>
        </div>
        <div>
            <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-display font-bold text-gray-900">{value}</h3>
            {subValue && <p className="text-xs text-mint font-bold mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> {subValue}
            </p>}
        </div>
    </div>
);

export default AdminDashboard;
