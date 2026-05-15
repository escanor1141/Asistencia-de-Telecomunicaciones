import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAutenticacion } from '../context/ContextoAutenticacion';
import { useCurso } from '../context/ContextoCurso';
import api from '../services/api';
import { enviarNotificacionesSemanal, obtenerEstadoNotificaciones, obtenerEstadoWhatsApp } from '../services/api';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff, Trash2, Loader2, X, Mail, Send, CheckCircle2, AlertCircle, Clock, MessageSquare, Smartphone } from 'lucide-react';

export default function Configuracion() {
    const { usuario } = useAutenticacion();
    const { cursos } = useCurso();
    const [docentes, setDocentes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [formulario, setFormulario] = useState({ documento: '', name: '', email: '', password: '', role: 'TEACHER' });
    const [eliminandoId, setEliminandoId] = useState(null);
    const [modalFormularioVisible, setModalFormularioVisible] = useState(false);

    // Estado panel de notificaciones

    const [enviandoNotificaciones, setEnviandoNotificaciones] = useState(false);
    const [resultadoNotificaciones, setResultadoNotificaciones] = useState(null);
    const [estadoCron, setEstadoCron] = useState(null);

    // Estado panel de WhatsApp

    const [estadoWhatsApp, setEstadoWhatsApp] = useState(null);
    const [cargandoWa, setCargandoWa] = useState(false);
    const [modalWaVisible, setModalWaVisible] = useState(false);

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

        const cargarEstadoCron = async () => {
            try {
                const estado = await obtenerEstadoNotificaciones();
                setEstadoCron(estado);
            } catch (_) {
                // silencioso — el cron puede no estar disponible en dev
            }
        };

        cargarDocentes();
        cargarEstadoCron();
    }, []);

    const manejarCreacion = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const nuevoProfesor = await api.post('/teachers', formulario).then(r => r.data);
            setDocentes(prev => [...prev, nuevoProfesor]);
            setFormulario({ documento: '', name: '', email: '', password: '', role: 'TEACHER' });
            setModalFormularioVisible(false);
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
        <>
        <section className="space-y-6">
            <header className="tarjeta flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold">Configuración</h2>
                        <p className="mt-1 text-sm text-texto-secundario">Parámetros institucionales y datos de cuenta.</p>
                    </div>
                </div>
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

            {/* Panel de Notificaciones */}

            <section className="tarjeta">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Mail size={20} className="text-primario" />
                            Notificaciones de Inasistencia
                        </h3>
                        <p className="mt-1 text-sm text-texto-secundario">
                            Envía correos automáticos a estudiantes con inasistencias registradas durante la semana actual (lunes a sábado).
                            El sistema evita duplicados: si ya fue notificado esta semana, no se reenvía.
                        </p>
                        {/* Info del cron automático */}
                        <div className="mt-3 flex flex-wrap gap-4 text-xs">
                            <span className="flex items-center gap-1.5" style={{ color: 'var(--color-present)' }}>
                                <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--color-present)' }} />
                                Cron activo — Domingos 18:00 (Bogotá)
                            </span>
                            {estadoCron?.ultimaEjecucion && (
                                <span className="text-texto-secundario">
                                    Última ejecución: {new Date(estadoCron.ultimaEjecucion.fecha).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            )}
                            {estadoCron?.estadoSemanaActual && (
                                <span className="text-texto-secundario">
                                    Esta semana: <strong>{estadoCron.estadoSemanaActual.correosEnviados}</strong> correo{estadoCron.estadoSemanaActual.correosEnviados !== 1 ? 's' : ''} enviado{estadoCron.estadoSemanaActual.correosEnviados !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={enviandoNotificaciones}
                        onClick={async () => {
                            setEnviandoNotificaciones(true);
                            setResultadoNotificaciones(null);
                            try {
                                const resultado = await enviarNotificacionesSemanal();
                                setResultadoNotificaciones(resultado.results);
                                toast.success(`Proceso completado: ${resultado.results.sent} correos enviados`);
                            } catch (err) {
                                const msg = err?.response?.data?.error || 'Error al enviar notificaciones';
                                toast.error(msg);
                            } finally {
                                setEnviandoNotificaciones(false);
                            }
                        }}
                        className="boton-primario inline-flex items-center gap-2 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {enviandoNotificaciones
                            ? <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                            : <><Send size={16} /> Enviar notificaciones semanales</>}
                    </button>
                </div>

                {/* Resultado del envío */}
                {resultadoNotificaciones && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'color-mix(in srgb, var(--color-present) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-present) 25%, transparent)' }}>
                            <CheckCircle2 size={20} style={{ color: 'var(--color-present)', flexShrink: 0 }} />
                            <div>
                                <p className="font-mono text-2xl font-semibold" style={{ color: 'var(--color-present)' }}>{resultadoNotificaciones.sent}</p>
                                <p className="text-xs text-texto-secundario">Enviados</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'color-mix(in srgb, var(--color-muted) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-muted) 25%, transparent)' }}>
                            <Clock size={20} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                            <div>
                                <p className="font-mono text-2xl font-semibold text-texto-secundario">{resultadoNotificaciones.skipped}</p>
                                <p className="text-xs text-texto-secundario">Omitidos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'color-mix(in srgb, var(--color-absent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-absent) 25%, transparent)' }}>
                            <AlertCircle size={20} style={{ color: 'var(--color-absent)', flexShrink: 0 }} />
                            <div>
                                <p className="font-mono text-2xl font-semibold" style={{ color: 'var(--color-absent)' }}>{resultadoNotificaciones.errors}</p>
                                <p className="text-xs text-texto-secundario">Errores</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detalle de estudiantes notificados */}
                {resultadoNotificaciones?.details?.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[500px] text-sm">
                            <thead style={{ background: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                                <tr className="text-left text-texto-secundario">
                                    <th className="px-4 py-2 font-medium">Estudiante</th>
                                    <th className="px-4 py-2 font-medium">Correo</th>
                                    <th className="px-4 py-2 font-medium text-center">Estado</th>
                                    <th className="px-4 py-2 font-medium">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resultadoNotificaciones.details.map((d, i) => (
                                    <tr key={i} className="tabla-fila">
                                        <td className="px-4 py-2 font-medium">{d.studentName}</td>
                                        <td className="px-4 py-2 text-texto-secundario text-xs">{d.email || '—'}</td>
                                        <td className="px-4 py-2 text-center">
                                            {d.status === 'SUCCESS' && <span className="badge-docente">Enviado</span>}
                                            {d.status === 'SKIPPED' && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 'var(--badge-radius)', fontSize: '0.75rem', fontWeight: 600, background: 'color-mix(in srgb, var(--color-muted) 15%, transparent)', color: 'var(--color-muted)' }}>Omitido</span>}
                                            {d.status === 'ERROR' && <span className="badge-admin">Error</span>}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-texto-secundario">{d.reason || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="tarjeta">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <MessageSquare size={20} className="text-primario" />
                            Notificaciones por WhatsApp
                        </h3>
                        <p className="mt-1 text-sm text-texto-secundario">
                            Cada vez que un docente guarda asistencia con estudiantes ausentes, el sistema
                            envía automáticamente un mensaje de WhatsApp a través de Evolution API.
                            El envío es inmediato y no requiere acción manual.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs">
                            <span className="flex items-center gap-1.5" style={{ color: 'var(--color-present)' }}>
                                <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--color-present)' }} />
                                Activo — disparo automático al guardar asistencia
                            </span>
                            {estadoWhatsApp?.resumen && (
                                <span className="text-texto-secundario">
                                    Total enviados: <strong>{estadoWhatsApp.resumen.enviados}</strong>
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={cargandoWa}
                        onClick={async () => {
                            setCargandoWa(true);
                            try {
                                const data = await obtenerEstadoWhatsApp(200);
                                setEstadoWhatsApp(data);
                                setModalWaVisible(true);
                            } catch (_) {
                                toast.error('No se pudo cargar el historial de WhatsApp');
                            } finally {
                                setCargandoWa(false);
                            }
                        }}
                        className="boton-secundario inline-flex items-center gap-2 shrink-0"
                    >
                        {cargandoWa
                            ? <><Loader2 size={16} className="animate-spin" /> Cargando...</>
                            : <><Smartphone size={16} /> Ver historial</>}
                    </button>
                </div>
            </section>

            <section className="tarjeta p-0">
                <div className="border-b px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium">Usuarios Registrados</h3>
                    <button
                        type="button"
                        onClick={() => setModalFormularioVisible(true)}
                        className="boton-primario inline-flex items-center gap-2 h-[38px]"
                    >
                        <UserPlus size={16} />
                        Nuevo Usuario
                    </button>
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
                                    <tr key={docente.id} className="tabla-fila">
                                        <td className="px-4 py-3 font-mono text-xs text-texto-secundario">{docente.id}</td>
                                        <td className="px-4 py-3 font-medium text-texto">{docente.name}</td>
                                        <td className="px-4 py-3 text-texto-secundario text-sm">{docente.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={docente.role === 'ADMIN' ? 'badge-admin' : 'badge-docente'}>
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

            {/* Modal Formulario de Nuevo Usuario */}
            {modalFormularioVisible && (
                <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(26,26,46,0.6)', backdropFilter: 'blur(2px)' }}>
                    <div className="modal-panel w-full max-w-4xl rounded-[var(--card-radius)] border flex flex-col" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', maxHeight: '90vh' }}>
                        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <UserPlus size={20} className="text-primario" />
                                Crear Nuevo Usuario
                            </h3>
                            <button type="button" onClick={() => setModalFormularioVisible(false)} disabled={guardando} className="p-1.5 rounded-md disabled:opacity-50" style={{ color: 'var(--color-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-auto flex-1 px-6 py-4">
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
                        </div>
                    </div>
                </div>
            )}
        </section>

        {/* Modal Historial WhatsApp */}

    {
        modalWaVisible && estadoWhatsApp && (
            <div
                className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(51, 51, 71, 0.65)', backdropFilter: 'blur(3px)' }}
                onClick={(e) => { if (e.target === e.currentTarget) setModalWaVisible(false); }}
            >
                <div
                    className="modal-panel w-full flex flex-col"
                    style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--card-radius)',
                        maxWidth: '860px',
                        maxHeight: '88vh',
                    }}
                >
                    {/* Header fijo */}
                    <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <MessageSquare size={20} className="text-primario" />
                            Historial de notificaciones WhatsApp
                        </h3>
                        <button
                            type="button"
                            onClick={() => setModalWaVisible(false)}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: 'var(--color-muted)' }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tarjetas de resumen — fijas */}
                    <div className="px-6 py-4 grid grid-cols-3 gap-3 shrink-0 border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'color-mix(in srgb, var(--color-present) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-present) 25%, transparent)' }}>
                            <CheckCircle2 size={20} style={{ color: 'var(--color-present)', flexShrink: 0 }} />
                            <div>
                                <p className="font-mono text-2xl font-semibold" style={{ color: 'var(--color-present)' }}>{estadoWhatsApp.resumen.enviados}</p>
                                <p className="text-xs text-texto-secundario">Enviados</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'color-mix(in srgb, var(--color-muted) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-muted) 25%, transparent)' }}>
                            <Clock size={20} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                            <div>
                                <p className="font-mono text-2xl font-semibold text-texto-secundario">{estadoWhatsApp.resumen.omitidos}</p>
                                <p className="text-xs text-texto-secundario">Omitidos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'color-mix(in srgb, var(--color-absent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-absent) 25%, transparent)' }}>
                            <AlertCircle size={20} style={{ color: 'var(--color-absent)', flexShrink: 0 }} />
                            <div>
                                <p className="font-mono text-2xl font-semibold" style={{ color: 'var(--color-absent)' }}>{estadoWhatsApp.resumen.errores}</p>
                                <p className="text-xs text-texto-secundario">Errores</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabla con scroll */}
                    <div className="overflow-y-auto flex-1 overflow-x-auto">
                        {estadoWhatsApp.logs.length === 0 ? (
                            <p className="py-12 text-center text-texto-secundario text-sm">
                                No hay notificaciones de WhatsApp registradas aún.
                            </p>
                        ) : (
                            <table className="w-full min-w-[620px] text-sm">
                                <thead className="sticky top-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', zIndex: 1 }}>
                                    <tr className="text-left text-texto-secundario">
                                        <th className="px-5 py-3 font-medium">Estudiante</th>
                                        <th className="px-5 py-3 font-medium">WhatsApp</th>
                                        <th className="px-5 py-3 font-medium">Materia</th>
                                        <th className="px-5 py-3 font-medium">Fecha clase</th>
                                        <th className="px-5 py-3 font-medium text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {estadoWhatsApp.logs.map((log) => (
                                        <tr key={log.id} className="tabla-fila">
                                            <td className="px-5 py-2.5 font-medium">{log.estudiante}</td>
                                            <td className="px-5 py-2.5 font-mono text-xs text-texto-secundario">{log.whatsapp}</td>
                                            <td className="px-5 py-2.5 text-texto-secundario">{log.materia}</td>
                                            <td className="px-5 py-2.5 text-texto-secundario text-xs">{log.fecha}</td>
                                            <td className="px-5 py-2.5 text-center">
                                                {log.status === 'SUCCESS' && <span className="badge-docente">Enviado</span>}
                                                {log.status === 'SKIPPED' && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 'var(--badge-radius)', fontSize: '0.75rem', fontWeight: 600, background: 'color-mix(in srgb, var(--color-muted) 15%, transparent)', color: 'var(--color-muted)' }}>Omitido</span>}
                                                {log.status === 'ERROR' && <span className="badge-admin" title={log.error}>Error</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer con total */}
                    <div className="px-6 py-3 border-t shrink-0 flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
                        <p className="text-xs text-texto-secundario">
                            Mostrando {estadoWhatsApp.logs.length} registro{estadoWhatsApp.logs.length !== 1 ? 's' : ''} más recientes
                        </p>
                        <button
                            type="button"
                            onClick={() => setModalWaVisible(false)}
                            className="boton-secundario text-sm px-4 py-1.5"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
