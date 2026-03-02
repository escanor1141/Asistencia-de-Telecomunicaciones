import { Link, useLocation } from 'react-router-dom';
import { Home, Users, CheckSquare, Clock, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children }) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/', label: 'Inicio', icon: Home },
        { path: '/students', label: 'Estudiantes', icon: Users },
        { path: '/attendance', label: 'Asistencia', icon: CheckSquare },
        { path: '/history', label: 'Historial', icon: Clock },
        { path: '/reports', label: 'Reportes', icon: BarChart2 },
        { path: '/teachers', label: 'Profesores', icon: Users },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
            <aside className="w-64 bg-white shadow-xl z-10 flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-blue to-brand-green bg-clip-text text-transparent">
                        Telecom Asistencia
                    </h1>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-brand-blue text-white shadow-md'
                                    : 'text-gray-600 hover:bg-blue-50 hover:text-brand-blue hover:translate-x-1'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? "text-white" : ""} />
                                <span className="font-semibold tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User info + logout */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {user?.name?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{user?.name || 'Profesor'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    >
                        <LogOut size={18} />
                        <span className="font-semibold text-sm">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-auto bg-gray-50/50">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
