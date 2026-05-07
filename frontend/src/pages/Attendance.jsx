import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, Loader2, Save, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { obtenerAsistencia, obtenerEstudiantes, guardarAsistencia } from '../services/api';
import { useCurso } from '../context/ContextoCurso';
import FiltrosGlobales from '../components/FiltrosGlobales';
import { formatearNombre, compararPorApellido } from '../utils/formatearNombre';

const estadosAsistencia = [
    { valor: 'Presente',    icono: CheckCircle2, colorTexto: 'text-presente',    colorFondo: 'var(--color-present-bg)' },
    { valor: 'Ausente',     icono: XCircle,      colorTexto: 'text-ausente',     colorFondo: 'var(--color-absent-bg)' },
    { valor: 'Justificado', icono: FileText,     colorTexto: 'text-justificado', colorFondo: 'var(--color-excused-bg)' },
];

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const obtenerDiaSemana = (fechaStr) => {
    if (!fechaStr) return null;
    const [year, month, day] = fechaStr.split('-');
    const date = new Date(year, month - 1, day);
    const dayIndex = date.getDay(); // 0 es Domingo
    const indices = [6, 0, 1, 2, 3, 4, 5]; // Mapear a [Lunes, Martes...]
    return diasSemana[indices[dayIndex]];
};

const formatearFechaLocal = (fechaDate) => {
    const year = fechaDate.getFullYear();
    const month = String(fechaDate.getMonth() + 1).padStart(2, '0');
    const day = String(fechaDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function Asistencia() {
    const {
        cursoSeleccionado,
        codigoSeleccionado,
        grupoSeleccionado,
        docenteSeleccionado,
    } = useCurso();

    const [estudiantes, setEstudiantes] = useState([]);
    const [fecha, setFecha] = useState(formatearFechaLocal(new Date()));
    const [asistencia, setAsistencia] = useState({});
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const filtros = {
        codigo:     codigoSeleccionado,
        grupo:      grupoSeleccionado,
        docenteId:  docenteSeleccionado,
    };

    useEffect(() => {
        if (cursoSeleccionado) {
            cargarDatos();
        } else {
            setEstudiantes([]);
            setAsistencia({});
            setCargando(false);
        }
    }, [fecha, cursoSeleccionado, codigoSeleccionado, grupoSeleccionado, docenteSeleccionado]);

    const cargarDatos = async () => {
        if (!cursoSeleccionado) return;
        setCargando(true);
        try {
            const [listaEstudiantes, asistenciaExistente] = await Promise.all([
                obtenerEstudiantes(cursoSeleccionado.id, filtros),
                obtenerAsistencia(cursoSeleccionado.id, fecha, filtros),
            ]);
            const ordenados = [...listaEstudiantes].sort((a, b) => compararPorApellido(a.name, b.name));
            setEstudiantes(ordenados);

            const mapaAsistencia = {};
            if (asistenciaExistente.length > 0) {
                asistenciaExistente.forEach((registro) => {
                    // Si hay status guardado lo usamos; si no, inferimos del boolean
                    mapaAsistencia[registro.studentId] =
                        registro.status || (registro.present ? 'Presente' : 'Ausente');
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
            status: asistencia[estudiante.id] || 'Ausente',
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

    const getLimitesFecha = () => {
        const hoy = new Date();
        const hoyStr = formatearFechaLocal(hoy);
        
        // Regla 1: Máximo 5 días atrás
        const hace5Dias = new Date(hoy);
        hace5Dias.setDate(hace5Dias.getDate() - 5);
        
        // Regla 2: Corte semanal (Domingos a las 02:00 AM)
        const diaSemana = hoy.getDay(); // 0 = Domingo
        const hora = hoy.getHours();
        
        const fechaCorte = new Date(hoy);
        if (diaSemana === 0 && hora < 2) {
            // Si es domingo antes de las 02:00, el corte vigente es del domingo pasado
            fechaCorte.setDate(fechaCorte.getDate() - 7);
        } else if (diaSemana !== 0) {
            // Si es lunes a sábado, el corte fue el domingo anterior
            fechaCorte.setDate(fechaCorte.getDate() - diaSemana);
        }
        // Si es domingo y hora >= 2, fechaCorte queda como hoy
        
        fechaCorte.setHours(0, 0, 0, 0); // El domingo de corte es el primer día editable post-corte

        // El mínimo absoluto es la fecha más reciente entre hace5Dias y fechaCorte
        const minDate = hace5Dias > fechaCorte ? hace5Dias : fechaCorte;
        const minStr = formatearFechaLocal(minDate);

        return { max: hoyStr, min: minStr };
    };
    
    const { min: minFecha, max: maxFecha } = getLimitesFecha();
    const fechaValida = fecha >= minFecha && fecha <= maxFecha;

    return (
        <section className="space-y-6">
            <header className="tarjeta">
                <h2 className="text-2xl font-semibold mb-1">Asistencia</h2>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <p className="text-sm text-texto-secundario mt-2">Registra el estado diario por estudiante.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <FiltrosGlobales filtroDia={obtenerDiaSemana(fecha)} />
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                            <label htmlFor="fecha-asistencia" style={{ fontSize: '0.8125rem', fontWeight: '500', fontFamily: 'var(--font-sans)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', width: '56px', textAlign: 'right' }}>
                                Fecha:
                            </label>
                            <input
                                id="fecha-asistencia"
                                type="date"
                                min={minFecha}
                                max={maxFecha}
                                value={fecha}
                                onChange={(evento) => setFecha(evento.target.value)}
                                style={{
                                    height: '36px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--input-radius)',
                                    padding: '0 10px',
                                    fontSize: '0.8125rem',
                                    fontFamily: 'var(--font-sans)',
                                    fontWeight: '500',
                                    color: 'var(--color-text-primary)',
                                    background: 'var(--color-surface)',
                                    width: '140px',
                                    outline: 'none'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--color-primary)';
                                    e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'var(--color-border)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>
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
                        disabled={guardando || estudiantes.length === 0 || !fechaValida}
                        className="boton-primario inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                        title={!fechaValida ? "Solo puedes editar fechas de hoy o hasta 5 días atrás" : ""}
                    >
                        {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar
                    </button>
                </div>

                {cargando ? (
                    <p className="p-6 text-sm text-texto-secundario">Cargando...</p>
                ) : !cursoSeleccionado ? (
                    <div className="p-6 text-center">
                        <p className="text-texto-secundario">Selecciona una materia en el menú superior.</p>
                    </div>
                ) : estudiantes.length === 0 ? (
                    <p className="p-6 text-sm text-texto-secundario">No hay estudiantes para los filtros seleccionados.</p>
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
                                        <td className="px-4 py-3 font-medium text-texto">{formatearNombre(estudiante.name)}</td>
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
