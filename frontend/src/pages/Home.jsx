import { useEffect, useMemo, useState } from 'react';
import { Users, Percent, UserX } from 'lucide-react';
import { obtenerAsistencia, obtenerEstudiantes } from '../services/api';
import { useCurso } from '../context/ContextoCurso';
import FiltrosGlobales from '../components/FiltrosGlobales';

export default function PanelPrincipal() {
    const {
        cursoSeleccionado,
        codigoSeleccionado,
        grupoSeleccionado,
        docenteSeleccionado,
    } = useCurso();

    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState(false);
    const [totalEstudiantes, setTotalEstudiantes] = useState(0);
    const [porcentajeHoy, setPorcentajeHoy] = useState(0);
    const [ausentesHoy, setAusentesHoy] = useState(0);
    const [actividadReciente, setActividadReciente] = useState([]);

    const filtros = {
        codigo:    codigoSeleccionado,
        grupo:     grupoSeleccionado,
        docenteId: docenteSeleccionado,
    };

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
                    obtenerEstudiantes(cursoSeleccionado.id, filtros),
                    obtenerAsistencia(cursoSeleccionado.id, hoy, filtros),
                    obtenerAsistencia(cursoSeleccionado.id, undefined, filtros),
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
    }, [cursoSeleccionado, codigoSeleccionado, grupoSeleccionado, docenteSeleccionado]);

    const kpis = useMemo(
        () => [
            { titulo: 'Total estudiantes',  valor: totalEstudiantes.toLocaleString('es-CO'), icono: Users },
            { titulo: '% asistencia hoy',   valor: `${porcentajeHoy.toLocaleString('es-CO')}%`, icono: Percent },
            { titulo: 'Ausentes hoy',        valor: ausentesHoy.toLocaleString('es-CO'), icono: UserX },
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
            <header className="tarjeta">
                <h2 className="text-2xl font-semibold">Panel Principal</h2>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginTop: '4px'
                }}>
                    <p className="text-sm text-texto-secundario">Resumen diario del curso seleccionado.</p>
                    <FiltrosGlobales />
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
