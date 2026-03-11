import { Link, useLocation } from 'react-router-dom';
import { Home, Users, CheckSquare, Clock, BarChart2, LogOut, BookOpen, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children }) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { courses, selectedCourse, selectCourse, loadingCourses } = useCourse();
    const navigate = useNavigate();

    const navItems = [
        { path: '/', label: 'Inicio', icon: Home },
        { path: '/courses', label: 'Cursos/Materias', icon: BookOpen },
        { path: '/students', label: 'Estudiantes', icon: Users },
        { path: '/attendance', label: 'Asistencia', icon: CheckSquare },
        { path: '/history', label: 'Historial', icon: Clock },
        { path: '/reports', label: 'Reportes', icon: BarChart2 },
    ];

    if (user?.role === 'ADMIN') {
        navItems.push({ path: '/teachers', label: 'Profesores', icon: Users });
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
            <aside className="w-64 bg-white shadow-xl z-20 flex flex-col relative">
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

            <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 relative">
                {/* Top Bar for Course Selector */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 shadow-sm z-10 shrink-0">
                    <div className="flex flex-1 justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800 hidden sm:block">
                            {/* We can show breadcrumbs here if needed */}
                        </h2>

                        <div className="flex items-center gap-3 ml-auto text-sm">
                            <span className="font-medium text-gray-500">Curso Activo:</span>
                            {loadingCourses ? (
                                <span className="text-gray-400">Cargando...</span>
                            ) : courses?.length > 0 ? (
                                <div className="relative">
                                    <select
                                        className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                                        value={selectedCourse?.id || ''}
                                        onChange={(e) => {
                                            const c = courses.find(course => course.id === e.target.value);
                                            selectCourse(c);
                                        }}
                                    >
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.name} ({course.code})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                            ) : (
                                <span className="text-gray-400 italic">No tienes cursos</span>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
