import { useEffect, useState } from 'react';
import { useCurso } from '../context/ContextoCurso';
import { obtenerReportes, crearCurso, eliminarCurso } from '../services/api';
import { BookOpen, Trash2, Plus, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAutenticacion } from '../context/ContextoAutenticacion';

export default function Cursos() {
    const { cursos, cargandoCursos, cargarCursos } = useCurso();
    const { usuario } = useAutenticacion();
    const [estadisticasCursos, setEstadisticasCursos] = useState([]);
    const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);
    const [formularioCurso, setFormularioCurso] = useState({ name: '', code: '', groupCode: '', academicPeriod: '1', academicYear: new Date().getFullYear().toString() });
    const [guardandoCurso, setGuardandoCurso] = useState(false);
    const [eliminandoId, setEliminandoId] = useState(null);

    useEffect(() => {
        const cargarEstadisticas = async () => {
            if (cursos.length === 0) {
                setEstadisticasCursos([]);
                return;
            }

            setCargandoEstadisticas(true);
            try {
                const respuestas = await Promise.all(
                    cursos.map(async (curso) => {
                        const reporteCurso = await obtenerReportes(curso.id, {});
                        const acumulado = reporteCurso.reduce((total, item) => total + item.percentage, 0);
                        const promedio = reporteCurso.length > 0 ? Math.round(acumulado / reporteCurso.length) : 0;
                        return {
                            id: curso.id,
                            nombre: curso.name,
                            codigo: curso.code,
                            grupo: curso.groupCode || 'A',
                            periodo: curso.academicPeriod || '1',
                            anio: curso.academicYear || '2024',
                            profesor: usuario?.name || 'Sin profesor asignado',
                            horario: curso.schedule || 'Sin horario asignado',
                            porcentaje: promedio,
                        };
                    }),
                );
                setEstadisticasCursos(respuestas);
            } finally {
                setCargandoEstadisticas(false);
            }
        };

        cargarEstadisticas();
    }, [cursos, usuario?.name]);

    const manejarCreacionCurso = async (e) => {
        e.preventDefault();
        setGuardandoCurso(true);
        try {
            await crearCurso(formularioCurso);
            await cargarCursos();
            setFormularioCurso({ name: '', code: '', groupCode: '', academicPeriod: '1', academicYear: new Date().getFullYear().toString() });
            toast.success('Materia creada exitosamente');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al crear materia');
        } finally {
            setGuardandoCurso(false);
        }
    };

    const manejarEliminacionCurso = async (id, nombre) => {
        if (!confirm(`¿Eliminar la materia "${nombre}"? Se perderán todos sus estudiantes y asistencia.`)) return;
        setEliminandoId(id);
        try {
            await eliminarCurso(id);
            await cargarCursos();
            toast.success('Materia eliminada');
        } catch (err) {
            toast.error('Error al eliminar materia');
        } finally {
            setEliminandoId(null);
        }
    };

    return (
        <section className="space-y-6">
            <header className="tarjeta">
                <h2 className="text-2xl font-semibold">Materias</h2>
                <p className="mt-1 text-sm text-texto-secundario">Resumen de materias asignadas y su asistencia promedio.</p>
            </header>

            {/* Formulario de Nuevo Curso */}
            <section className="tarjeta p-6">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <Plus size={20} className="text-primario" />
                    Crear Nueva Materia
                </h3>
                <form onSubmit={manejarCreacionCurso} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 items-end">
                    <div className="lg:col-span-4">
                        <label className="mb-1 block text-sm font-medium text-texto-secundario">Nombre de la materia</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Matemáticas I"
                            className="campo w-full"
                            value={formularioCurso.name}
                            onChange={(e) => setFormularioCurso({ ...formularioCurso, name: e.target.value })}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-texto-secundario">Código</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. MAT-101"
                            className="campo w-full uppercase"
                            value={formularioCurso.code}
                            onChange={(e) => setFormularioCurso({ ...formularioCurso, code: e.target.value })}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-texto-secundario">Grupo</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. A"
                            className="campo w-full uppercase"
                            value={formularioCurso.groupCode}
                            onChange={(e) => setFormularioCurso({ ...formularioCurso, groupCode: e.target.value })}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-texto-secundario">Periodo</label>
                        <div className="relative">
                            <select
                                className="campo pr-8 py-1.5 w-full appearance-none bg-white"
                                value={formularioCurso.academicPeriod}
                                onChange={(e) => setFormularioCurso({ ...formularioCurso, academicPeriod: e.target.value })}
                            >
                                <option value="1">1</option>
                                <option value="2">2</option>
                            </select>
                            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-texto-secundario" />
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-texto-secundario">Año</label>
                        <div className="relative">
                            <select
                                className="campo pr-8 py-1.5 w-full appearance-none bg-white"
                                value={formularioCurso.academicYear}
                                onChange={(e) => setFormularioCurso({ ...formularioCurso, academicYear: e.target.value })}
                            >
                                {Array.from({ length: 2051 - new Date().getFullYear() }, (_, i) => {
                                    const year = (new Date().getFullYear() + i).toString();
                                    return <option key={year} value={year}>{year}</option>;
                                })}
                            </select>
                            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-texto-secundario" />
                        </div>
                    </div>
                    <div className="lg:col-span-12 sm:col-span-2 sm:col-start-1 mt-2">
                        <button
                            type="submit"
                            disabled={guardandoCurso}
                            className="boton-primario w-full h-[38px] flex justify-center items-center gap-2"
                        >
                            {guardandoCurso ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            {guardandoCurso ? 'Guardando...' : 'Crear Materia'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {(cargandoCursos || cargandoEstadisticas) && (
                    <p className="text-sm text-texto-secundario">Cargando...</p>
                )}

                {!cargandoCursos &&
                    !cargandoEstadisticas &&
                    estadisticasCursos.map((curso) => (
                        <article key={curso.id} className="tarjeta relative group">
                            <div className="mb-3 flex items-center gap-2 text-primario pr-8">
                                <BookOpen size={18} />
                                <p className="text-sm font-medium truncate">{curso.nombre}</p>
                            </div>
                            <button
                                onClick={() => manejarEliminacionCurso(curso.id, curso.nombre)}
                                disabled={eliminandoId === curso.id}
                                className="absolute top-4 right-4 p-1.5 text-texto-secundario hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                                title="Eliminar materia"
                            >
                                {eliminandoId === curso.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                            <div className="space-y-2 text-sm mt-1">
                                <div className="flex gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        {curso.codigo} - Grupo {curso.grupo}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        Periodo {curso.periodo} ({curso.anio})
                                    </span>
                                </div>
                                <p className="pt-2">
                                    <span className="text-texto-secundario">Profesor:</span> {curso.profesor}
                                </p>
                                <p>
                                    <span className="text-texto-secundario">Horario:</span> {curso.horario}
                                </p>
                                <p className="font-mono">
                                    <span className="font-sans text-texto-secundario">% asistencia:</span>{' '}
                                    {curso.porcentaje.toLocaleString('es-CO')}%
                                </p>
                            </div>
                        </article>
                    ))}

                {!cargandoCursos && !cargandoEstadisticas && estadisticasCursos.length === 0 && (
                    <p className="text-sm text-texto-secundario">No hay materias registradas.</p>
                )}
            </section>
        </section>
    );
}
