import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, FileText, Loader2, Save, XCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { obtenerAsistencia, obtenerEstudiantes, guardarAsistencia } from '../services/api';
import { useCurso } from '../context/ContextoCurso';

const estadosAsistencia = [
    { valor: 'Presente', icono: CheckCircle2, colorTexto: 'text-presente', colorFondo: 'var(--color-present-bg)' },
    { valor: 'Ausente', icono: XCircle, colorTexto: 'text-ausente', colorFondo: 'var(--color-absent-bg)' },
    { valor: 'Tardanza', icono: Clock3, colorTexto: 'text-tardanza', colorFondo: 'var(--color-late-bg)' },
    { valor: 'Justificado', icono: FileText, colorTexto: 'text-justificado', colorFondo: 'var(--color-excused-bg)' },
];

export default function Asistencia() {
    const { cursos, cursoSeleccionado, seleccionarCurso, cargandoCursos } = useCurso();
    const [estudiantes, setEstudiantes] = useState([]);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [asistencia, setAsistencia] = useState({});
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (cursoSeleccionado) {
            cargarDatos();
        } else {
            setEstudiantes([]);
            setAsistencia({});
            setCargando(false);
        }
    }, [fecha, cursoSeleccionado]);

    const cargarDatos = async () => {
        if (!cursoSeleccionado) return;
        setCargando(true);
        try {
            const [listaEstudiantes, asistenciaExistente] = await Promise.all([
                obtenerEstudiantes(cursoSeleccionado.id),
                obtenerAsistencia(cursoSeleccionado.id, fecha),
            ]);
            setEstudiantes(listaEstudiantes);

            const mapaAsistencia = {};
            if (asistenciaExistente.length > 0) {
                asistenciaExistente.forEach((registro) => {
                    mapaAsistencia[registro.studentId] = registro.present ? 'Presente' : 'Ausente';
                });
            }
            setAsistencia(mapaAsistencia);
        } catch (_error) {
            toast.error('Error al cargar datos');
        } finally {
            setCargando(false);
        }
    };

    const cambiarEstado = (studentId, estado) => {
        setAsistencia((previo) => ({ ...previo, [studentId]: estado }));
    };

    const manejarGuardarAsistencia = async () => {
        if (!cursoSeleccionado) return;
        const registros = estudiantes.map((estudiante) => ({
            studentId: estudiante.id,
            present: ['Presente', 'Tardanza', 'Justificado'].includes(asistencia[estudiante.id]),
        }));

        setGuardando(true);
        try {
            await guardarAsistencia({ date: fecha, courseId: cursoSeleccionado.id, records: registros });
            toast.success('Asistencia guardada correctamente');
        } catch (_error) {
            toast.error('Error al guardar asistencia');
        } finally {
            setGuardando(false);
        }
    };

    const conteo = estadosAsistencia.reduce((acumulado, estado) => {
        acumulado[estado.valor] = Object.values(asistencia).filter((item) => item === estado.valor).length;
        return acumulado;
    }, {});

    return (
        <section className="space-y-6">
            <header className="tarjeta flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold">Asistencia</h2>
                        <p className="mt-1 text-sm text-texto-secundario">Registrá el estado diario por estudiante.</p>
                    </div>
                    
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

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <input
                        type="date"
                        value={fecha}
                        onChange={(evento) => setFecha(evento.target.value)}
                        className="campo w-full sm:w-auto"
                    />
                </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {estadosAsistencia.map((estado) => (
                    <article key={estado.valor} className="tarjeta" style={{ background: estado.colorFondo }}>
                        <p className="text-sm text-texto-secundario">{estado.valor}</p>
                        <p className={`mt-2 font-mono text-2xl ${estado.colorTexto}`}>
                            {(conteo[estado.valor] || 0).toLocaleString('es-CO')}
                        </p>
                    </article>
                ))}
            </div>

            <section className="tarjeta p-0">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="text-lg font-medium">Listado de estudiantes</h3>
                    <button
                        type="button"
                        onClick={manejarGuardarAsistencia}
                        disabled={guardando || estudiantes.length === 0}
                        className="boton-primario inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar
                    </button>
                </div>

                {cargando ? (
                    <p className="p-6 text-sm text-texto-secundario">Cargando...</p>
                ) : !cargandoCursos && cursos.length === 0 ? (
                    <div className="tarjeta text-center py-12">
                        <p className="text-texto-secundario">No tienes materias asignadas.</p>
                    </div>
                ) : estudiantes.length === 0 ? (
                    <p className="p-6 text-sm text-texto-secundario">No hay estudiantes registrados.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[780px] text-sm">
                            <thead style={{ background: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                                <tr className="text-left text-texto-secundario">
                                    <th className="px-4 py-3 font-medium">Nombre</th>
                                    <th className="px-4 py-3 font-medium">ID</th>
                                    <th className="px-4 py-3 text-right font-medium">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {estudiantes.map((estudiante) => (
                                    <tr key={estudiante.id} className="border-b">
                                        <td className="px-4 py-3 font-medium text-texto">{estudiante.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-texto-secundario">{estudiante.id}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                {estadosAsistencia.map((estado) => {
                                                    const Icono = estado.icono;
                                                    const activo = asistencia[estudiante.id] === estado.valor;
                                                    return (
                                                        <button
                                                            key={estado.valor}
                                                            type="button"
                                                            onClick={() => cambiarEstado(estudiante.id, estado.valor)}
                                                            className={`inline-flex items-center gap-1 rounded-[var(--badge-radius)] border px-3 py-1 text-xs font-semibold ${
                                                                activo ? estado.colorTexto : 'text-texto-secundario'
                                                            }`}
                                                            style={{
                                                                background: activo ? estado.colorFondo : 'var(--color-surface)',
                                                            }}
                                                        >
                                                            <Icono size={14} />
                                                            {estado.valor}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </section>
    );
}
