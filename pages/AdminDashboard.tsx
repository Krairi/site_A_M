
import React, { useState, useEffect } from 'react';
import { Users, Crown, ShieldAlert, Star, Search, Mail, Loader2, Check, ShieldCheck, TrendingUp, DollarSign, UserCheck, AlertTriangle, Settings2, Trash2, Filter, RefreshCw, Lock, Eye, BookOpen, Calendar, Wand2, X, ChevronRight, Ban, UserMinus, Shield, Activity } from 'lucide-react';
import { supabase } from '../services/mockSupabase';
import { User, UserPermission } from '../types';

const PERMISSIONS_MAP: { id: UserPermission; label: string; icon: any; color: string }[] = [
    { id: 'manage_stock', label: 'Gestion Stock', icon: BookOpen, color: 'text-aqua' },
    { id: 'view_budget', label: 'Vue Budget', icon: DollarSign, color: 'text-honey' },
    { id: 'manage_planning', label: 'Planning Repas', icon: Calendar, color: 'text-purple-500' },
    { id: 'generate_recipes', label: 'IA Cuisine', icon: Wand2, color: 'text-mint' },
    { id: 'admin_access', label: 'Accès Admin', icon: ShieldAlert, color: 'text-red-500' },
];

const PermissionModal = ({ user, onClose, onUpdate }: { user: User; onClose: () => void; onUpdate: (userId: string, perms: UserPermission[]) => void }) => {
    const [selectedPerms, setSelectedPerms] = useState<UserPermission[]>(user.permissions || []);
    const [saving, setSaving] = useState(false);

    const togglePerm = (perm: UserPermission) => {
        setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
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
            <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-xl">
                            <Shield size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900">Droits d'accès</h2>
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full shadow-sm">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
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

                <div className="p-8 border-t border-gray-100 flex gap-4 bg-gray-50/30">
                    <button onClick={onClose} className="flex-1 py-4 bg-white text-gray-600 rounded-2xl font-bold border border-gray-200">Annuler</button>
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                        Appliquer
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
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [stats, setStats] = useState({ total: 0, active: 0, premium: 0, admins: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await supabase.getAllProfiles();
            setUsers(data);
            setStats({
                total: data.length,
                active: data.filter(u => u.accountStatus === 'active').length,
                premium: data.filter(u => u.plan !== 'free').length,
                admins: data.filter(u => u.role === 'admin').length
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePermissions = async (userId: string, perms: UserPermission[]) => {
        const ok = await supabase.adminUpdateUserPermissions(userId, perms);
        if (ok) loadData();
    };

    const handleToggleStatus = async (user: User) => {
        const newStatus = user.accountStatus === 'suspended' ? 'active' : 'suspended';
        const ok = await supabase.adminUpdateUserStatus(user.id, newStatus);
        if (ok) loadData();
    };

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase()) || 
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-mint" /></div>;

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-display font-bold text-gray-900">Administration GIVD</h1>
                    <p className="text-gray-500 mt-2">Gestion centralisée des comptes et privilèges.</p>
                </div>
                <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-1">
                    <button onClick={loadData} className="p-3 hover:bg-gray-50 rounded-xl transition-all">
                        <RefreshCw size={20} className="text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Membres" value={stats.total} icon={Users} color="bg-aqua" />
                <StatCard title="Comptes Actifs" value={stats.active} icon={UserCheck} color="bg-mint" />
                <StatCard title="Utilisateurs Premium" value={stats.premium} icon={Star} color="bg-honey" />
                <StatCard title="Administrateurs" value={stats.admins} icon={ShieldAlert} color="bg-gray-900" />
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                <input 
                    type="text" 
                    placeholder="Filtrer par email ou nom..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[2.5rem] shadow-soft focus:outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint transition-all text-lg font-medium"
                />
            </div>

            {/* User Table */}
            <div className="bg-white rounded-[3rem] shadow-soft border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Utilisateur</th>
                            <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Plan</th>
                            <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Permissions</th>
                            <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredUsers.map(u => (
                            <tr key={u.id} className={`hover:bg-gray-50/30 transition-colors ${u.accountStatus === 'suspended' ? 'opacity-50' : ''}`}>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${u.role === 'admin' ? 'bg-gray-900' : 'bg-mint'}`}>
                                            {u.name?.charAt(0) || u.email.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{u.name || 'Anonyme'}</p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1 font-medium"><Mail size={12}/> {u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        u.plan === 'free' ? 'bg-gray-100 text-gray-400' : 
                                        u.plan === 'premium' ? 'bg-mint/10 text-mint' : 'bg-honey/10 text-honey'
                                    }`}>
                                        {u.plan}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                                        {u.permissions?.slice(0, 3).map(p => (
                                            <span key={p} className="bg-gray-50 text-gray-400 text-[8px] font-bold px-2 py-0.5 rounded border border-gray-100 uppercase">
                                                {p.split('_').pop()}
                                            </span>
                                        ))}
                                        {(u.permissions?.length || 0) > 3 && (
                                            <span className="text-[8px] font-bold text-gray-300">+{u.permissions.length - 3}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right space-x-2">
                                    <button 
                                        onClick={() => setEditingUser(u)}
                                        className="p-3 bg-gray-50 text-gray-400 hover:text-mint hover:bg-mint/10 rounded-xl transition-all border border-transparent hover:border-mint/20"
                                        title="Modifier Droits"
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingUser && (
                <PermissionModal 
                    user={editingUser} 
                    onClose={() => setEditingUser(null)} 
                    onUpdate={handleUpdatePermissions} 
                />
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-100 flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-4 rounded-2xl ${color} bg-opacity-10 shadow-inner`}>
                <Icon className={`${color.replace('bg-', 'text-')}`} size={24} />
            </div>
            <div className="bg-gray-50 text-[10px] font-black uppercase px-2 py-1 rounded-lg text-gray-400">Temps Réel</div>
        </div>
        <div>
            <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-display font-bold text-gray-900">{value}</h3>
        </div>
    </div>
);

export default AdminDashboard;
