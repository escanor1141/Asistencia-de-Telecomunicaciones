import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, Plus, Trash2, Loader2 } from 'lucide-react';
import { obtenerReportes, obtenerEstudiantes, crearEstudiante, eliminarEstudiante } from '../services/api';
import toast from 'react-hot-toast';
import { useCurso } from '../context/ContextoCurso';

export default function Estudiantes() {
    const { cursos, cursoSeleccionado, seleccionarCurso, cargandoCursos } = useCurso();
    const [estudiantes, setEstudiantes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [formularioEstudiante, setFormularioEstudiante] = useState({ name: '', email: '', whatsapp: '' });
    const [guardandoEstudiante, setGuardandoEstudiante] = useState(false);
    const [eliminandoId, setEliminandoId] = useState(null);
    const [refrescar, setRefrescar] = useState(0);

    useEffect(() => {
        const cargarEstudiantes = async () => {
            if (!cursoSeleccionado) {
                setEstudiantes([]);
                setCargando(false);
                return;
            }

            setCargando(true);
            try {
                const [lista, reporte] = await Promise.all([
                    obtenerEstudiantes(cursoSeleccionado.id),
                    obtenerReportes(cursoSeleccionado.id, {}),
                ]);

                const porcentajePorId = new Map(reporte.map((item) => [item.id, item.percentage]));
                const normalizados = lista.map((estudiante) => ({
                    id: estudiante.id,
                    nombre: estudiante.name,
                    curso: cursoSeleccionado.name,
                    porcentaje: porcentajePorId.get(estudiante.id) ?? 0,
                }));
                setEstudiantes(normalizados);
            } finally {
                setCargando(false);
            }
        };

        cargarEstudiantes();
    }, [cursoSeleccionado, refrescar]);

    const manejarCreacionEstudiante = async (e) => {
        e.preventDefault();
        if (!cursoSeleccionado) return toast.error('Selecciona una materia primero');
        setGuardandoEstudiante(true);
        try {
            await crearEstudiante(cursoSeleccionado.id, formularioEstudiante);
            setRefrescar(prev => prev + 1);
            setFormularioEstudiante({ name: '', email: '', whatsapp: '' });
            toast.success('Estudiante añadido exitosamente');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al añadir estudiante');
        } finally {
            setGuardandoEstudiante(false);
        }
    };

    const manejarEliminacionEstudiante = async (id, nombre) => {
        if (!confirm(`¿Eliminar a "${nombre}"? Se borrarán sus registros de asistencia.`)) return;
        setEliminandoId(id);
        try {
            await eliminarEstudiante(id);
            setRefrescar(prev => prev + 1);
            toast.success('Estudiante eliminado');
        } catch (err) {
            toast.error('Error al eliminar estudiante');
        } finally {
            setEliminandoId(null);
        }
    };

    const filtrados = useMemo(
        () =>
            estudiantes.filter((estudiante) =>
                estudiante.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                estudiante.id.toLowerCase().includes(busqueda.toLowerCase()),
            ),
        [busqueda, estudiantes],
    );

    return (
        <section className="space-y-6">
            <header className="tarjeta flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="w-full sm:w-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold">Estudiantes</h2>
                        <p className="mt-1 text-sm text-texto-secundario">Listado y porcentaje de asistencia por estudiante.</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-3 w-full sm:w-auto p-3 bg-fondo/50 rounded-xl border">
                        <span className="text-sm font-medium text-texto-secundario whitespace-nowrap">Materia activa:</span>
                        {cargandoCursos ? (
                            <span className="text-sm text-texto-secundario">Cargando...</span>
                        ) : cursos.length > 0 ? (
                            <div className="relative w-full sm:w-auto">
                                <select
                                    className="campo pr-9 py-1.5 bg-white font-medium text-primario w-full sm:w-auto appearance-none"
                                    value={cursoSeleccionado?.id || ''}
                                    onChange={(evento) => {
                                        const cursoElegido = cursos.find((curso) => curso.id === evento.target.value);
                                        seleccionarCurso(cursoElegido);
                                    }}
                                >
                                    {cursos.map((curso) => (
                                        <option key={curso.id} value={curso.id}>
                                            {curso.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={16}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-texto-secundario"
                                />
                            </div>
                        ) : (
                            <span className="text-sm font-medium text-ausente">Sin materias</span>
                        )}
                    </div>
                </div>
            </header>
            
            {/* Formulario de Nuevo Estudiante */}
            {cursoSeleccionado && (
                <section className="tarjeta p-6">
                    <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                        <Plus size={20} className="text-primario" />
                        Añadir Nuevo Estudiante
                    </h3>
                    <form onSubmit={manejarCreacionEstudiante} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
                        <div className="lg:col-span-1">
                            <label className="mb-1 block text-sm font-medium text-texto-secundario">Nombre completo</label>
                            <input
                                type="text"
                                required
                                placeholder="Ej. Ana García"
                                className="campo w-full"
                                value={formularioEstudiante.name}
                                onChange={(e) => setFormularioEstudiante({ ...formularioEstudiante, name: e.target.value })}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <label className="mb-1 block text-sm font-medium text-texto-secundario">Correo electrónico <span className="font-normal text-xs">(Opcional)</span></label>
                            <input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                className="campo w-full"
                                value={formularioEstudiante.email}
                                onChange={(e) => setFormularioEstudiante({ ...formularioEstudiante, email: e.target.value })}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <label className="mb-1 block text-sm font-medium text-texto-secundario">WhatsApp <span className="font-normal text-xs">(Opcional)</span></label>
                            <input
                                type="text"
                                placeholder="+57 300 000 0000"
                                className="campo w-full"
                                value={formularioEstudiante.whatsapp}
                                onChange={(e) => setFormularioEstudiante({ ...formularioEstudiante, whatsapp: e.target.value })}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <button
                                type="submit"
                                disabled={guardandoEstudiante || !cursoSeleccionado}
                                className="boton-primario w-full h-[38px] flex justify-center items-center gap-2"
                            >
                                {guardandoEstudiante ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                {guardandoEstudiante ? 'Guardando...' : 'Añadir'}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <div className="tarjeta">
                <div className="mb-4 flex items-center gap-2 rounded-[var(--input-radius)] border bg-superficie px-3">
                    <Search size={16} className="text-texto-secundario" />
                    <input
                        type="text"
                        className="h-10 w-full border-none bg-transparent text-sm outline-none"
                        placeholder="Buscar por nombre o ID"
                        value={busqueda}
                        onChange={(evento) => setBusqueda(evento.target.value)}
                    />
                </div>
            </div>

            <section className="tarjeta p-0">
                {cargando ? (
                    <p className="p-6 text-sm text-texto-secundario">Cargando...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-sm">
                            <thead style={{ background: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                                <tr className="text-left text-texto-secundario">
                                    <th className="px-4 py-3 font-medium">Nombre</th>
                                    <th className="px-4 py-3 font-medium">ID</th>
                                    <th className="px-4 py-3 font-medium">Materia</th>
                                    <th className="px-4 py-3 text-right font-medium">% asistencia</th>
                                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map((estudiante) => (
                                    <tr key={estudiante.id} className="border-b">
                                        <td className="px-4 py-3 font-medium text-texto">{estudiante.nombre}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-texto-secundario">{estudiante.id}</td>
                                        <td className="px-4 py-3">{estudiante.curso}</td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {Number(estudiante.porcentaje).toLocaleString('es-CO')}%
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => manejarEliminacionEstudiante(estudiante.id, estudiante.nombre)}
                                                disabled={eliminandoId === estudiante.id}
                                                className="p-1.5 text-texto-secundario hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                                title="Eliminar estudiante"
                                            >
                                                {eliminandoId === estudiante.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filtrados.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-texto-secundario">
                                            No hay estudiantes para mostrar.
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
