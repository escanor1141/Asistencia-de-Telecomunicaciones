import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAutenticacion } from '../context/ContextoAutenticacion';
import { useCurso } from '../context/ContextoCurso';
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
    const [formulario, setFormulario] = useState({ documento: '', name: '', email: '', password: '', role: 'TEACHER' });
    const [eliminandoId, setEliminandoId] = useState(null);

    const isPasswordValid = useMemo(() => {
        const p = formulario.password;
        return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p);
    }, [formulario.password]);

    if (usuario?.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    useEffect(() => {
        const cargarDocentes = async () => {
            try {
                const respuesta = await api.get('/teachers').then((r) => r.data);
                const listaDocentes = Array.isArray(respuesta)
                    ? respuesta
                    : Array.isArray(respuesta?.teachers)
                        ? respuesta.teachers
                        : Array.isArray(respuesta?.users)
                            ? respuesta.users
                        : Array.isArray(respuesta?.docentes)
                            ? respuesta.docentes
                            : [];
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
            setFormulario({ documento: '', name: '', email: '', password: '', role: 'TEACHER' });
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
                <form onSubmit={manejarCreacion} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-start">
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-texto-secundario">Documento</label>
                                <input
                                    type="text"
                                    required
                                    inputMode="numeric"
                                    pattern="\d{6,10}"
                                    minLength={6}
                                    maxLength={10}
                                    placeholder="Ej. 1098765432"
                                    className="campo w-full"
                                    value={formulario.documento}
                                    onChange={(e) => setFormulario({ ...formulario, documento: e.target.value.replace(/\D/g, '') })}
                                />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-texto-secundario">Nombre completo</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Juan Pérez"
                                    className="campo w-full"
                                    value={formulario.name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const capitalized = val ? val.charAt(0).toUpperCase() + val.slice(1) : '';
                                        setFormulario({ ...formulario, name: capitalized });
                                    }}
                                />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
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
                        <div>
                            <label className="mb-1 block text-sm font-medium text-texto-secundario">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={mostrarContrasena ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    placeholder="Mín. 8 caracteres"
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
                            {!isPasswordValid && formulario.password.length > 0 && (
                                <div className="mt-2 grid grid-cols-1 gap-1">
                                    {[
                                        { label: 'Mínimo 8 caracteres', check: (p) => p.length >= 8 },
                                        { label: 'Al menos una mayúscula', check: (p) => /[A-Z]/.test(p) },
                                        { label: 'Al menos un número', check: (p) => /[0-9]/.test(p) },
                                        { label: 'Un carácter especial', check: (p) => /[^A-Za-z0-9]/.test(p) },
                                    ].map((rule, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[10px]" style={{ color: rule.check(formulario.password) ? 'var(--color-present)' : 'var(--color-muted)' }}>
                                            <div className={`w-1 h-1 rounded-full ${rule.check(formulario.password) ? 'bg-present' : 'bg-muted'}`} />
                                            {rule.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col justify-end gap-4">
                        <div>
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
                        <button
                            type="submit"
                            disabled={guardando || !isPasswordValid}
                            className="boton-primario w-full h-11 flex justify-center items-center gap-2 rounded-md transition-all active:scale-95"
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
                                    <th className="px-4 py-3 font-medium">Documento</th>
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
                                        <td className="px-4 py-3 font-mono text-xs text-texto-secundario">{docente.id}</td>
                                        <td className="px-4 py-3 font-medium text-texto">{docente.name}</td>
                                        <td className="px-4 py-3">{docente.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${docente.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {docente.role === 'ADMIN' ? 'Administrador' : docente.role === 'DOCENTE' || docente.role === 'TEACHER' ? 'Docente' : docente.role}
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
                                        <td colSpan="6" className="px-4 py-8 text-center text-texto-secundario">
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
