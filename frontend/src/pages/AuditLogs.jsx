import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    ShieldCheck, 
    User, 
    Calendar, 
    Activity, 
    Search, 
    RefreshCcw,
    FileText,
    Key,
    Database,
    Users,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const limit = 20;

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/audit?limit=${limit}&offset=${page * limit}`);
            setLogs(res.data.logs);
            setTotal(res.data.total);
        } catch (error) {
            console.error('Error al cargar logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const getActionIcon = (action) => {
        if (action.includes('LOGIN')) return <Key className="text-purple-500" size={18} />;
        if (action.includes('CREAR')) return <Database className="text-green-500" size={18} />;
        if (action.includes('GUARDAR')) return <FileText className="text-blue-500" size={18} />;
        if (action.includes('EXPORTAR')) return <Activity className="text-orange-500" size={18} />;
        return <Activity className="text-gray-500" size={18} />;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredLogs = logs.filter(log => 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <ShieldCheck className="text-[var(--color-primary)]" size={32} />
                        Auditoría del Sistema
                    </h1>
                    <p className="text-gray-500 mt-1">Registro histórico de acciones de los usuarios</p>
                </div>
                <button 
                    onClick={fetchLogs}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Actualizar"
                >
                    <RefreshCcw size={20} className={loading ? 'animate-spin text-gray-400' : 'text-gray-600'} />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Buscar por usuario, acción o entidad..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Mostrando {filteredLogs.length} de {total} registros</span>
                        <div className="flex items-center gap-1 ml-4">
                            <button 
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0 || loading}
                                className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">Pág. {page + 1}</span>
                            <button 
                                onClick={() => setPage(p => p + 1)}
                                disabled={(page + 1) * limit >= total || loading}
                                className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                                <th className="px-6 py-4">Fecha y Hora</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Acción</th>
                                <th className="px-6 py-4">Entidad</th>
                                <th className="px-6 py-4">Detalles</th>
                                <th className="px-6 py-4">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && logs.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        No se encontraron registros.
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {formatDate(log.createdAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xs">
                                                {log.userName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-700">{log.userName}</div>
                                                <div className="text-[10px] text-gray-400 uppercase font-bold">{log.userRole}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            {getActionIcon(log.action)}
                                            {log.action.replace(/_/g, ' ')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {log.target}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                        {JSON.stringify(log.details)}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                                        {log.ip || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
