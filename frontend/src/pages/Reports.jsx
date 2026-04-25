import { useState, useEffect } from 'react';
import { obtenerReportes } from '../services/api';
import { Download, ChevronDown } from 'lucide-react';
import { useCurso } from '../context/ContextoCurso';

export default function Reportes() {
    const { cursoSeleccionado, cursos, seleccionarCurso, cargandoCursos } = useCurso();
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const cargarReportes = async () => {
        if (!cursoSeleccionado) return;
        setCargando(true);
        try {
            const params = {};
            if (fechaInicio) params.startDate = fechaInicio;
            if (fechaFin) params.endDate = fechaFin;
            const respuesta = await obtenerReportes(cursoSeleccionado.id, params);
            setDatos(respuesta);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (cursoSeleccionado) {
            cargarReportes();
        } else {
            setDatos([]);
            setCargando(false);
        }
    }, [fechaInicio, fechaFin, cursoSeleccionado]);

    const exportarCSV = () => {
        const encabezado = ['Nombre', 'Clases', 'Presentes', 'Porcentaje'];
        const filas = datos.map((item) => [item.name, item.total, item.present, `${item.percentage}%`]);
        const csv = [encabezado, ...filas].map((fila) => fila.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'reporte-asistencia.csv';
        enlace.click();
        URL.revokeObjectURL(url);
    };

    const promedioAsistencia =
        datos.length > 0
            ? Math.round(datos.reduce((acumulado, item) => acumulado + item.percentage, 0) / datos.length)
            : 0;

    const estudiantesEnRiesgo = datos.filter((item) => item.percentage < 80).length;

    return (
        <section className="space-y-6">
            <header className="tarjeta flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold">Reportes</h2>
                        <p className="mt-1 text-sm text-texto-secundario">Filtros por materia y rango de fechas para asistencia.</p>
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
                
                <div className="grid gap-3 md:grid-cols-3">
                    <input
                        type="date"
                        className="campo"
                        value={fechaInicio}
                        onChange={(evento) => setFechaInicio(evento.target.value)}
                    />
                    <input
                        type="date"
                        className="campo"
                        value={fechaFin}
                        onChange={(evento) => setFechaFin(evento.target.value)}
                    />
                    <button type="button" onClick={exportarCSV} className="boton-primario inline-flex items-center justify-center gap-2">
                        <Download size={16} />
                        Exportar
                    </button>
                </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-3">
                <article className="tarjeta">
                    <p className="text-sm text-texto-secundario">Estudiantes reportados</p>
                    <p className="mt-2 font-mono text-2xl">{datos.length.toLocaleString('es-CO')}</p>
                </article>
                <article className="tarjeta">
                    <p className="text-sm text-texto-secundario">Promedio de asistencia</p>
                    <p className="mt-2 font-mono text-2xl">{promedioAsistencia.toLocaleString('es-CO')}%</p>
                </article>
                <article className="tarjeta">
                    <p className="text-sm text-texto-secundario">Estudiantes bajo 80%</p>
                    <p className="mt-2 font-mono text-2xl">{estudiantesEnRiesgo.toLocaleString('es-CO')}</p>
                </article>
            </section>

            <section className="tarjeta p-0">
                {cargando ? (
                    <p className="p-6 text-sm text-texto-secundario">Cargando...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-sm">
                            <thead style={{ background: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                                <tr className="text-left text-texto-secundario">
                                    <th className="px-4 py-3 font-medium">Estudiante</th>
                                    <th className="px-4 py-3 font-medium">Clases</th>
                                    <th className="px-4 py-3 font-medium">Presentes</th>
                                    <th className="px-4 py-3 text-right font-medium">Porcentaje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datos.map((item) => (
                                    <tr key={item.id} className="border-b">
                                        <td className="px-4 py-3 font-medium text-texto">{item.name}</td>
                                        <td className="px-4 py-3">{Number(item.total).toLocaleString('es-CO')}</td>
                                        <td className="px-4 py-3">{Number(item.present).toLocaleString('es-CO')}</td>
                                        <td className="px-4 py-3 text-right font-mono">{Number(item.percentage).toLocaleString('es-CO')}%</td>
                                    </tr>
                                ))}
                                {datos.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-texto-secundario">
                                            Sin datos registrados.
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
