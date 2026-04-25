import { Link, useLocation } from 'react-router-dom';
import { Home, Users, CheckSquare, Clock, BarChart2, LogOut, BookOpen, ChevronDown } from 'lucide-react';
import { useAutenticacion } from '../context/ContextoAutenticacion';
import { useCurso } from '../context/ContextoCurso';
import { useNavigate } from 'react-router-dom';

// Layout alternativo (usado en vistas legacy)
export default function Layout({ children }) {
    const ubicacion = useLocation();
    const { usuario, cerrarSesion } = useAutenticacion();
    const { cursos, cursoSeleccionado, seleccionarCurso, cargandoCursos } = useCurso();
    const navegar = useNavigate();

    const elementosNav = [
        { ruta: '/', etiqueta: 'Inicio', icono: Home },
        { ruta: '/cursos', etiqueta: 'Cursos/Materias', icono: BookOpen },
        { ruta: '/estudiantes', etiqueta: 'Estudiantes', icono: Users },
        { ruta: '/asistencia', etiqueta: 'Asistencia', icono: CheckSquare },
        { ruta: '/historial', etiqueta: 'Historial', icono: Clock },
        { ruta: '/reportes', etiqueta: 'Reportes', icono: BarChart2 },
    ];

    if (usuario?.role === 'ADMIN') {
        elementosNav.push({ ruta: '/profesores', etiqueta: 'Profesores', icono: Users });
    }

    const manejarCierreSesion = () => {
        cerrarSesion();
        navegar('/login');
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
                    {elementosNav.map((item) => {
                        const Icono = item.icono;
                        const activo = ubicacion.pathname === item.ruta;
                        return (
                            <Link
                                key={item.ruta}
                                to={item.ruta}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${activo
                                    ? 'bg-brand-blue text-white shadow-md'
                                    : 'text-gray-600 hover:bg-blue-50 hover:text-brand-blue hover:translate-x-1'
                                    }`}
                            >
                                <Icono size={20} className={activo ? "text-white" : ""} />
                                <span className="font-semibold tracking-wide">{item.etiqueta}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {usuario?.name?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{usuario?.name || 'Profesor'}</p>
                            <p className="text-xs text-gray-500 truncate">{usuario?.email || ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={manejarCierreSesion}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    >
                        <LogOut size={18} />
                        <span className="font-semibold text-sm">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 relative">
                {/* Barra superior con selector de curso */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 shadow-sm z-10 shrink-0">
                    <div className="flex flex-1 justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800 hidden sm:block">
                            {/* Breadcrumbs pueden ir aquí */}
                        </h2>

                        <div className="flex items-center gap-3 ml-auto text-sm">
                            <span className="font-medium text-gray-500">Curso Activo:</span>
                            {cargandoCursos ? (
                                <span className="text-gray-400">Cargando...</span>
                            ) : cursos?.length > 0 ? (
                                <div className="relative">
                                    <select
                                        className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                                        value={cursoSeleccionado?.id || ''}
                                        onChange={(e) => {
                                            const c = cursos.find(curso => curso.id === e.target.value);
                                            seleccionarCurso(c);
                                        }}
                                    >
                                        {cursos.map(curso => (
                                            <option key={curso.id} value={curso.id}>
                                                {curso.name} ({curso.code})
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
