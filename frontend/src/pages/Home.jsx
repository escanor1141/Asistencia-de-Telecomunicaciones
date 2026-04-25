import { useEffect, useMemo, useState } from 'react';
import { Users, Percent, UserX, ChevronDown } from 'lucide-react';
import { obtenerAsistencia, obtenerEstudiantes } from '../services/api';
import { useCurso } from '../context/ContextoCurso';

export default function PanelPrincipal() {
    const { cursos, cursoSeleccionado, seleccionarCurso, cargandoCursos } = useCurso();
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState(false);
    const [totalEstudiantes, setTotalEstudiantes] = useState(0);
    const [porcentajeHoy, setPorcentajeHoy] = useState(0);
    const [ausentesHoy, setAusentesHoy] = useState(0);
    const [actividadReciente, setActividadReciente] = useState([]);

    useEffect(() => {
        const cargarPanel = async () => {
            if (!cursoSeleccionado) {
                setTotalEstudiantes(0);
                setPorcentajeHoy(0);
                setAusentesHoy(0);
                setActividadReciente([]);
                setCargando(false);
                return;
            }

            setCargando(true);
            setErrorCarga(false);
            const hoy = new Date().toISOString().split('T')[0];

            try {
                const [estudiantes, asistenciaHoy, historial] = await Promise.all([
                    obtenerEstudiantes(cursoSeleccionado.id),
                    obtenerAsistencia(cursoSeleccionado.id, hoy),
                    obtenerAsistencia(cursoSeleccionado.id),
                ]);

                const presentes = asistenciaHoy.filter((registro) => registro.present).length;
                const total = estudiantes.length;
                const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

                setTotalEstudiantes(total);
                setPorcentajeHoy(porcentaje);
                setAusentesHoy(Math.max(total - presentes, 0));
                setActividadReciente(historial.slice(0, 8));
            } catch (_error) {
                setErrorCarga(true);
            } finally {
                setCargando(false);
            }
        };

        cargarPanel();
    }, [cursoSeleccionado]);

    const kpis = useMemo(
        () => [
            {
                titulo: 'Total estudiantes',
                valor: totalEstudiantes.toLocaleString('es-CO'),
                icono: Users,
            },
            {
                titulo: '% asistencia hoy',
                valor: `${porcentajeHoy.toLocaleString('es-CO')}%`,
                icono: Percent,
            },
            {
                titulo: 'Ausentes hoy',
                valor: ausentesHoy.toLocaleString('es-CO'),
                icono: UserX,
            },
        ],
        [ausentesHoy, porcentajeHoy, totalEstudiantes],
    );

    if (cargando) {
        return <p className="text-sm text-texto-secundario">Cargando...</p>;
    }

    if (errorCarga) {
        return <p className="text-sm font-medium text-ausente">Error al cargar los datos</p>;
    }

    return (
        <section className="space-y-6">
            <header className="tarjeta flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-semibold">Panel Principal</h2>
                    <p className="mt-1 text-sm text-texto-secundario">Resumen diario del curso seleccionado.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 p-3 bg-fondo/50 rounded-xl border">
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
            </header>

            <div className="grid gap-4 md:grid-cols-3">
                {kpis.map((item) => {
                    const Icono = item.icono;
                    return (
                        <article key={item.titulo} className="tarjeta">
                            <div className="mb-4 flex items-center gap-2 text-texto-secundario">
                                <Icono size={20} />
                                <span className="text-sm">{item.titulo}</span>
                            </div>
                            <p className="font-mono text-3xl">{item.valor}</p>
                        </article>
                    );
                })}
            </div>

            <section className="tarjeta">
                <h3 className="mb-4 text-lg font-medium">Actividad reciente</h3>
                {actividadReciente.length === 0 ? (
                    <p className="text-sm text-texto-secundario">No hay actividad reciente</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-sm">
                            <thead style={{ background: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                                <tr className="text-left text-texto-secundario">
                                    <th className="px-4 py-3 font-medium">Fecha</th>
                                    <th className="px-4 py-3 font-medium">Presentes</th>
                                    <th className="px-4 py-3 font-medium">Total</th>
                                    <th className="px-4 py-3 text-right font-medium">Porcentaje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {actividadReciente.map((item) => {
                                    const porcentajeFila = item.total > 0 ? Math.round((item.presentCount / item.total) * 100) : 0;
                                    return (
                                        <tr key={item.date} className="border-b">
                                            <td className="px-4 py-3">{new Date(item.date).toLocaleDateString('es-CO')}</td>
                                            <td className="px-4 py-3">{Number(item.presentCount).toLocaleString('es-CO')}</td>
                                            <td className="px-4 py-3">{Number(item.total).toLocaleString('es-CO')}</td>
                                            <td className="px-4 py-3 text-right font-mono">{porcentajeFila.toLocaleString('es-CO')}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </section>
    );
}
