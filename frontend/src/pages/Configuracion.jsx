import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAutenticacion } from '../context/ContextoAutenticacion';
import { useCurso } from '../context/ContextoCurso';
import { obtenerDocentes } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff, Trash2, Loader2 } from 'lucide-react';

export default function Configuracion() {
    const { usuario } = useAutenticacion();
    const { cursos } = useCurso();
    const [docentes, setDocentes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [formulario, setFormulario] = useState({ name: '', email: '', password: '', role: 'TEACHER' });
    const [eliminandoId, setEliminandoId] = useState(null);

    if (usuario?.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    useEffect(() => {
        const cargarDocentes = async () => {
            try {
                const listaDocentes = await obtenerDocentes();
                setDocentes(listaDocentes);
            } catch (_error) {
                setDocentes([]);
            } finally {
                setCargando(false);
            }
        };

        cargarDocentes();
    }, []);

    const manejarCreacion = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const nuevoProfesor = await api.post('/teachers', formulario).then(r => r.data);
            setDocentes(prev => [...prev, nuevoProfesor]);
            setFormulario({ name: '', email: '', password: '', role: 'TEACHER' });
            toast.success('Usuario creado exitosamente');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al crear usuario');
        } finally {
            setGuardando(false);
        }
    };

    const manejarEliminacion = async (id, nombre) => {
        if (id === usuario?.id) {
            toast.error('No puedes eliminar tu propia cuenta');
            return;
        }
        if (!confirm(`¿Eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return;
        setEliminandoId(id);
        try {
            await api.delete(`/teachers/${id}`);
            setDocentes(prev => prev.filter(p => p.id !== id));
            toast.success('Usuario eliminado');
        } catch {
            toast.error('Error al eliminar usuario');
        } finally {
            setEliminandoId(null);
        }
    };

    return (
        <section className="space-y-6">
            <header className="tarjeta">
                <h2 className="text-2xl font-semibold">Configuración</h2>
                <p className="mt-1 text-sm text-texto-secundario">Parámetros institucionales y datos de cuenta.</p>
            </header>

            <section className="grid gap-4 lg:grid-cols-3">
                <article className="tarjeta lg:col-span-1">
                    <h3 className="text-lg font-medium">Institución</h3>
                    <p className="mt-3 text-sm text-texto-secundario">Nombre institucional</p>
                    <p className="font-medium">Unidades Tecnológicas de Santander</p>
                    <p className="mt-3 text-sm text-texto-secundario">Aplicación</p>
                    <p className="font-medium">Control de Asistencia Telecomunicaciones</p>
                </article>

                <article className="tarjeta lg:col-span-1">
                    <h3 className="text-lg font-medium">Configuración de horario</h3>
                    <p className="mt-3 text-sm text-texto-secundario">Materias activas</p>
                    <p className="font-mono text-2xl">{cursos.length.toLocaleString('es-CO')}</p>
                    <p className="mt-3 text-sm text-texto-secundario">Última revisión</p>
                    <p>{new Date().toLocaleDateString('es-CO')}</p>
                </article>

                <article className="tarjeta lg:col-span-1">
                    <h3 className="text-lg font-medium">Información de cuenta</h3>
                    <p className="mt-3 text-sm text-texto-secundario">Nombre</p>
                    <p className="font-medium">{usuario?.name || 'Sin nombre disponible'}</p>
                    <p className="mt-3 text-sm text-texto-secundario">Correo</p>
                    <p>{usuario?.email || 'Sin correo disponible'}</p>
                    <p className="mt-3 text-sm text-texto-secundario">Rol</p>
                    <p>{usuario?.role === 'ADMIN' ? 'Administrador' : 'Docente'}</p>
                </article>
            </section>

            {/* Formulario de Nuevo Usuario */}
            <section className="tarjeta p-6">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <UserPlus size={20} className="text-primario" />
                    Crear Nuevo Usuario
                </h3>
                <form onSubmit={manejarCreacion} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
                    <div className="lg:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-texto-secundario">Nombre completo</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Juan Pérez"
                            className="campo w-full"
                            value={formulario.name}
                            onChange={(e) => setFormulario({ ...formulario, name: e.target.value })}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-texto-secundario">Correo electrónico</label>
                        <input
                            type="email"
                            required
                            placeholder="correo@ejemplo.com"
                            className="campo w-full"
                            value={formulario.email}
                            onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-texto-secundario">Contraseña</label>
                        <div className="relative">
                            <input
                                type={mostrarContrasena ? 'text' : 'password'}
                                required
                                minLength={6}
                                placeholder="Mín. 6 caracteres"
                                className="campo w-full pr-10"
                                value={formulario.password}
                                onChange={(e) => setFormulario({ ...formulario, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-texto-secundario hover:text-texto"
                            >
                                {mostrarContrasena ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-texto-secundario">Rol del Sistema</label>
                        <select
                            className="campo w-full"
                            value={formulario.role}
                            onChange={(e) => setFormulario({ ...formulario, role: e.target.value })}
                        >
                            <option value="TEACHER">Docente</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <button
                            type="submit"
                            disabled={guardando}
                            className="boton-primario w-full h-[38px] flex justify-center items-center gap-2"
                        >
                            {guardando ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                            {guardando ? 'Guardando...' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="tarjeta p-0">
                <div className="border-b px-6 py-4">
                    <h3 className="text-lg font-medium">Tabla de docentes</h3>
                </div>
                {cargando ? (
                    <p className="p-6 text-sm text-texto-secundario">Cargando...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-sm">
                            <thead style={{ background: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                                <tr className="text-left text-texto-secundario">
                                    <th className="px-4 py-3 font-medium">Nombre</th>
                                    <th className="px-4 py-3 font-medium">Correo</th>
                                    <th className="px-4 py-3 font-medium">Rol</th>
                                    <th className="px-4 py-3 font-medium text-center">Registro</th>
                                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {docentes.map((docente) => (
                                    <tr key={docente.id} className="border-b">
                                        <td className="px-4 py-3 font-medium text-texto">{docente.name}</td>
                                        <td className="px-4 py-3">{docente.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${docente.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {docente.role === 'ADMIN' ? 'Administrador' : 'Docente'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {new Date(docente.createdAt).toLocaleDateString('es-CO')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {docente.id !== usuario?.id && (
                                                <button
                                                    onClick={() => manejarEliminacion(docente.id, docente.name)}
                                                    disabled={eliminandoId === docente.id}
                                                    className="p-1.5 text-texto-secundario hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                                    title="Eliminar usuario"
                                                >
                                                    {eliminandoId === docente.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {docentes.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-texto-secundario">
                                            No hay docentes disponibles para esta cuenta.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </section>
    );
}
