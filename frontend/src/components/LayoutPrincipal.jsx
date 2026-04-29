import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    ClipboardCheck,
    Users,
    BookOpen,
    BarChart3,
    Settings,
    LogOut,
    History,
} from 'lucide-react';
import { useAutenticacion } from '../context/ContextoAutenticacion';
import { useCurso } from '../context/ContextoCurso';
// ── Elementos del menú de navegación principal ───────────────────────────────
const elementosNavegacion = [
    { ruta: '/', etiqueta: 'Panel Principal', icono: LayoutDashboard },
    { ruta: '/cursos', etiqueta: 'Materias', icono: BookOpen },
    { ruta: '/estudiantes', etiqueta: 'Estudiantes', icono: Users },
    { ruta: '/asistencia', etiqueta: 'Asistencia', icono: ClipboardCheck },
    { ruta: '/historial', etiqueta: 'Historial', icono: History },
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
            {/* ── Barra superior ──────────────────────────────────────────── */}
            <header
                className="fixed left-0 right-0 top-0 z-20 border-b bg-superficie"
                style={{ minHeight: 'var(--topbar-height)' }}
            >
                <div
                    className="mx-auto flex w-full items-center px-4 md:px-8"
                    style={{
                        maxWidth: 'var(--content-max-width)',
                        minHeight: 'var(--topbar-height)',
                        gap: 'var(--space-4)',
                    }}
                >
                    {/* Logo */}
                    <div className="flex items-center shrink-0">
                        <img
                            src="/logo.png"
                            alt="Logo UTS"
                            className="h-40 w-auto object-contain -my-10 drop-shadow-md z-30 relative"
                        />
                    </div>

                    {/* Título centrado — solo desktop */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden xl:block">
                        <h1 className="text-xl font-bold text-primario">
                            Control de Asistencia Telecomunicaciones
                        </h1>
                    </div>

                    {/* Título fallback mobile */}
                    <div className="xl:hidden flex-1 px-2 text-center">
                        <h1 className="text-base font-bold text-primario truncate">
                            Control de Asistencia
                        </h1>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <p className="hidden text-sm text-texto-secundario sm:block">
                            {usuario?.name || 'Cuenta activa'}
                        </p>
                        <button
                            type="button"
                            onClick={manejarCierreSesion}
                            className="boton-secundario flex items-center gap-2 py-1.5 px-3 text-sm"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Sidebar de escritorio ────────────────────────────────────── */}
            <aside className="fixed bottom-0 left-0 top-topbar z-10 hidden w-sidebar border-r bg-superficie md:block">
                <nav className="flex h-full flex-col px-4 py-4">
                    <ul className="space-y-2">
                        {elementosNavegacion
                            .filter((item) => !item.adminOnly || usuario?.role === 'ADMIN')
                            .map((item) => {
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
                </nav>
            </aside>

            {/* ── Contenido principal ──────────────────────────────────────── */}
            <main className="px-4 pb-24 pt-[calc(var(--topbar-height)+var(--space-8))] md:pl-[calc(var(--sidebar-width)+var(--space-8))] md:pr-8">
                <div className="mx-auto w-full max-w-[var(--content-max-width)]">
                    {children}
                </div>
            </main>

            {/* ── Navegación inferior en mobile ────────────────────────────── */}
            <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-superficie md:hidden">
                <ul
                    className={`grid ${
                        usuario?.role === 'ADMIN' ? 'grid-cols-7' : 'grid-cols-6'
                    }`}
                >
                    {elementosNavegacion
                        .filter((item) => !item.adminOnly || usuario?.role === 'ADMIN')
                        .map((item) => {
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
                </ul>
            </nav>
        </div>
    );
}
