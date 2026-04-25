import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ClipboardCheck,
    Users,
    BookOpen,
    BarChart3,
    Settings,
    LogOut,
} from 'lucide-react';
import { useAutenticacion } from '../context/ContextoAutenticacion';

// Elementos del menú de navegación principal
const elementosNavegacion = [
    { ruta: '/', etiqueta: 'Panel Principal', icono: LayoutDashboard },
    { ruta: '/asistencia', etiqueta: 'Asistencia', icono: ClipboardCheck },
    { ruta: '/estudiantes', etiqueta: 'Estudiantes', icono: Users },
    { ruta: '/cursos', etiqueta: 'Materias', icono: BookOpen },
    { ruta: '/reportes', etiqueta: 'Reportes', icono: BarChart3 },
    { ruta: '/configuracion', etiqueta: 'Configuración', icono: Settings, adminOnly: true },
];

export default function LayoutPrincipal({ children }) {
    const ubicacion = useLocation();
    const navegar = useNavigate();
    const { cerrarSesion, usuario } = useAutenticacion();

    const manejarCierreSesion = () => {
        cerrarSesion();
        navegar('/login');
    };

    return (
        <div className="min-h-screen bg-fondo text-texto">
            {/* Barra superior */}
            <header className="fixed left-0 right-0 top-0 z-20 flex h-topbar items-center border-b bg-superficie px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-[var(--content-max-width)] items-center justify-between gap-4 relative">
                    <div className="flex items-center">
                        <img src="/logo.png" alt="Logo UTS" className="h-40 w-auto object-contain -my-10 drop-shadow-md z-30 relative" />
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none hidden md:block">
                        <h1 className="text-xl md:text-2xl font-bold text-primario pointer-events-auto inline-block">Control de Asistencia Telecomunicaciones</h1>
                    </div>

                    {/* Título fallback para pantallas chicas */}
                    <div className="md:hidden flex-1 px-2 text-center">
                        <h1 className="text-lg font-bold text-primario truncate">Control de Asistencia</h1>
                    </div>
                </div>
            </header>

            {/* Sidebar de escritorio */}
            <aside className="fixed bottom-0 left-0 top-topbar z-10 hidden w-sidebar border-r bg-superficie md:block">
                <nav className="flex h-full flex-col px-4 py-4">
                    <ul className="space-y-2">
                        {elementosNavegacion.filter(item => !item.adminOnly || usuario?.role === 'ADMIN').map((item) => {
                            const Icono = item.icono;
                            const activo = ubicacion.pathname === item.ruta;
                            return (
                                <li key={item.ruta}>
                                    <Link
                                        to={item.ruta}
                                        className={`flex items-center gap-3 rounded-[6px] px-4 py-[10px] text-sm transition-colors ${
                                            activo
                                                ? 'bg-primario-suave font-semibold text-primario'
                                                : 'text-texto-secundario hover:bg-fondo'
                                        }`}
                                    >
                                        <Icono size={18} />
                                        <span>{item.etiqueta}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="mt-auto border-t pt-4">
                        <p className="mb-2 truncate text-xs text-texto-secundario">{usuario?.name || 'Cuenta activa'}</p>
                        <button type="button" onClick={manejarCierreSesion} className="boton-secundario flex w-full items-center justify-center gap-2">
                            <LogOut size={16} />
                            Cerrar Sesión
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Contenido principal */}
            <main className="px-4 pb-24 pt-[calc(var(--topbar-height)+var(--space-8))] md:pl-[calc(var(--sidebar-width)+var(--space-8))] md:pr-8">
                <div className="mx-auto w-full max-w-[var(--content-max-width)]">{children}</div>
            </main>

            {/* Navegación inferior en mobile */}
            <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-superficie md:hidden">
                <ul className={`grid ${usuario?.role === 'ADMIN' ? 'grid-cols-6' : 'grid-cols-5'}`}>
                    {elementosNavegacion.filter(item => !item.adminOnly || usuario?.role === 'ADMIN').map((item) => {
                        const Icono = item.icono;
                        const activo = ubicacion.pathname === item.ruta;
                        return (
                            <li key={item.ruta}>
                                <Link
                                    to={item.ruta}
                                    className={`flex flex-col items-center gap-1 px-1 py-2 text-[11px] ${
                                        activo ? 'text-primario' : 'text-texto-secundario'
                                    }`}
                                >
                                    <Icono size={18} />
                                    <span className="truncate">{item.etiqueta}</span>
                                </Link>
                            </li>
                        );
                    })}
                    <li>
                        <button
                            type="button"
                            onClick={manejarCierreSesion}
                            className="flex w-full flex-col items-center gap-1 px-1 py-2 text-[11px] text-texto-secundario"
                        >
                            <LogOut size={18} />
                            <span className="truncate">Cerrar Sesión</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
