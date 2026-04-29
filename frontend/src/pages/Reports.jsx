import { useState, useEffect, useMemo } from 'react';
import { obtenerReportes, obtenerReportesSemanal, obtenerDocentes } from '../services/api';
import { Download, BarChart2, PieChart as PieIcon, TableIcon, TrendingUp, LayoutGrid } from 'lucide-react';
import { useCurso } from '../context/ContextoCurso';
import { useAutenticacion } from '../context/ContextoAutenticacion';
import FiltrosGlobales from '../components/FiltrosGlobales';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    LineChart, Line,
} from 'recharts';

// ── Helper: resuelve variables CSS en tiempo de ejecución ────────────────────────
// Recharts renderiza en SVG: los atributos fill no pasan por el cascade de CSS,
// por eso hay que resolver los valores con getComputedStyle.
function v(variable) {
    if (typeof window === 'undefined') return '#000';
    return getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim();
}

// ── Colores Chart A (series) ──────────────────────────────────────────────────
// Derivados del design system: primario + estados + acentos
const COLORES_LINEAS = [
    '#6B2D8B',  // var(--color-primary)
    '#8DC63F',  // var(--color-present)
    '#D97706',  // var(--color-late)
    '#4E1F68',  // var(--color-primary-dark)
    '#DC2626',  // var(--color-absent)
    '#6A9E2F',  // var(--color-accent-dark)
];

// ── Modos de agrupación para Chart A ────────────────────────────────────────
const MODOS_GRUPO = [
    { id: 'materia',      label: 'Por materia' },
    { id: 'periodo',      label: 'Por período académico' },
    { id: 'modalidad',    label: 'Por modalidad (Tec/Ing)' },
    { id: 'docente',      label: 'Por docente' },
    { id: 'docentes_ti',  label: 'Docentes Tec/Ing' },
];

// ── Merge de semanas de múltiples series para LineChart ───────────────────────
// series: [{ nombre: 'Tec', semanas: [{ semana, presente }] }, ...]
// → [{ semana: 'Semana 1', Tec: 10, Ing: 15 }, ...]
function mergeSemanales(series) {
    const mapa = {};
    series.forEach(({ nombre, semanas = [] }) => {
        semanas.forEach(({ semana, presente }) => {
            if (!mapa[semana]) mapa[semana] = { semana };
            mapa[semana][nombre] = presente;
        });
    });
    // Ordenar por número de semana
    return Object.values(mapa).sort((a, b) => {
        const n = (s) => parseInt(s.semana.replace('Semana ', ''), 10);
        return n(a) - n(b);
    });
}

// ── Tooltip semanal compartido ────────────────────────────────────────────────
function TooltipSemanal({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--card-radius)', padding: '10px 14px', fontSize: '0.8125rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
            <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
}

// ── Paleta de brackets — valores reales de index.css ─────────────────────────
const COLORES_BRACKETS = [
    '#8DC63F',  // ≥ 90%  — var(--color-present)
    '#6A9E2F',  // 80–89% — var(--color-accent-dark)
    '#D97706',  // 70–79% — var(--color-late)
    '#DC2626',  // < 70%  — var(--color-absent)
];

const ETIQUETAS_BRACKETS = ['≥ 90%', '80–89%', '70–79%', '< 70%'];


// ── Tooltip personalizado del BarChart ────────────────────────────────────────
function TooltipBarra({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const { porcentaje, presentes, clases } = payload[0].payload;
    return (
        <div
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--card-radius)',
                padding: '10px 14px',
                fontSize: '0.8125rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}
        >
            <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{label}</p>
            <p style={{ color: 'var(--color-text-secondary)' }}>
                Asistencia: <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>{porcentaje}%</span>
            </p>
            <p style={{ color: 'var(--color-text-secondary)' }}>
                Presentes: <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{presentes} / {clases}</span>
            </p>
        </div>
    );
}

// ── Tooltip personalizado del PieChart ───────────────────────────────────────
function TooltipTorta({ active, payload }) {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];
    return (
        <div
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--card-radius)',
                padding: '8px 14px',
                fontSize: '0.8125rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}
        >
            <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {name}: <span style={{ fontFamily: 'var(--font-mono)' }}>{value} est.</span>
            </p>
        </div>
    );
}

// ── Tabs de vista ─────────────────────────────────────────────────────────────
const VISTAS = [
    { id: 'barras',    label: 'Barras',       Icono: BarChart2 },
    { id: 'torta',     label: 'Distribución', Icono: PieIcon },
    { id: 'tabla',     label: 'Tabla',        Icono: TableIcon },
];

export default function Reportes() {
    const {
        cursoSeleccionado,
        codigoSeleccionado,
        grupoSeleccionado,
        docenteSeleccionado,
    } = useCurso();
    const { usuario } = useAutenticacion();

    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [vistaActiva, setVistaActiva] = useState('barras');

    // ── State Chart A / B ──────────────────────────────────────────────────
    const [modoGrupo, setModoGrupo] = useState('materia');
    const [datosLineChart, setDatosLineChart] = useState([]);  // merged weeks
    const [seriesNombres, setSeriesNombres] = useState([]);    // series keys for <Line>
    const [datosBarrasSemanales, setDatosBarrasSemanales] = useState([]);
    const [cargandoSemanal, setCargandoSemanal] = useState(false);
    const [docentes, setDocentes] = useState([]);

    const filtros = {
        codigo:    codigoSeleccionado,
        grupo:     grupoSeleccionado,
        docenteId: docenteSeleccionado,
    };

    const cargarReportes = async () => {
        if (!cursoSeleccionado) return;
        setCargando(true);
        try {
            const params = {};
            if (fechaInicio) params.startDate = fechaInicio;
            if (fechaFin) params.endDate = fechaFin;
            const respuesta = await obtenerReportes(cursoSeleccionado.id, params, filtros);
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
    }, [fechaInicio, fechaFin, cursoSeleccionado, codigoSeleccionado, grupoSeleccionado, docenteSeleccionado]);

    // ── Carga docentes para modo 'docente' ────────────────────────────────
    useEffect(() => {
        obtenerDocentes().then(setDocentes).catch(() => setDocentes([]));
    }, []);

    // ── Fetch datos semanales según modoGrupo ─────────────────────────────
    useEffect(() => {
        if (!cursoSeleccionado && !usuario?.id) return;
        const tid = usuario?.id || null;
        const fetchSemanal = async () => {
            setCargandoSemanal(true);
            try {
                let series = [];

                if (modoGrupo === 'materia') {
                    const r = await obtenerReportesSemanal({ courseId: cursoSeleccionado?.id });
                    series = [{ nombre: cursoSeleccionado?.name || 'Materia', semanas: r.semanas }];

                } else if (modoGrupo === 'periodo') {
                    const [r1, r2] = await Promise.all([
                        obtenerReportesSemanal({ docenteId: tid, periodo: '1' }),
                        obtenerReportesSemanal({ docenteId: tid, periodo: '2' }),
                    ]);
                    series = [
                        { nombre: 'Período 1', semanas: r1.semanas },
                        { nombre: 'Período 2', semanas: r2.semanas },
                    ];

                } else if (modoGrupo === 'modalidad' || modoGrupo === 'docentes_ti') {
                    const [rT, rI] = await Promise.all([
                        obtenerReportesSemanal({ docenteId: tid, modalidad: 'Tecnología' }),
                        obtenerReportesSemanal({ docenteId: tid, modalidad: 'Ingeniería' }),
                    ]);
                    series = [
                        { nombre: 'Tecnología', semanas: rT.semanas },
                        { nombre: 'Ingeniería', semanas: rI.semanas },
                    ];

                } else if (modoGrupo === 'docente' && docentes.length > 0) {
                    const resultados = await Promise.all(
                        docentes.slice(0, 5).map((d) =>
                            obtenerReportesSemanal({ docenteId: d.id })
                                .then((r) => ({ nombre: d.name.split(' ')[0], semanas: r.semanas }))
                                .catch(() => ({ nombre: d.name.split(' ')[0], semanas: [] }))
                        )
                    );
                    series = resultados;
                }

                setSeriesNombres(series.map((s) => s.nombre));
                setDatosLineChart(mergeSemanales(series));

                // Chart B: always the selected course (base)
                const base = modoGrupo === 'materia' && series[0]
                    ? series[0].semanas
                    : (cursoSeleccionado
                        ? (await obtenerReportesSemanal({ courseId: cursoSeleccionado.id })).semanas
                        : []);
                setDatosBarrasSemanales(base);
            } catch (_e) {
                setDatosLineChart([]);
                setDatosBarrasSemanales([]);
            } finally {
                setCargandoSemanal(false);
            }
        };
        fetchSemanal();
    }, [modoGrupo, cursoSeleccionado, docentes, usuario?.id]);

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const promedioAsistencia = useMemo(() =>
        datos.length > 0
            ? Math.round(datos.reduce((a, i) => a + i.percentage, 0) / datos.length)
            : 0,
        [datos]
    );
    const estudiantesEnRiesgo = useMemo(() => datos.filter((i) => i.percentage < 80).length, [datos]);

    // ── Datos para BarChart (top 20 si hay muchos) ────────────────────────────
    const datosBarras = useMemo(() =>
        [...datos]
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 20)
            .map((item) => ({
                nombre:     item.name.split(' ').slice(0, 2).join(' '),  // primeros 2 tokens del nombre
                porcentaje: item.percentage,
                presentes:  item.present,
                clases:     item.total,
            })),
        [datos]
    );

    // ── Datos para PieChart de distribución por brackets ─────────────────────
    const datosTorta = useMemo(() => {
        const brackets = [0, 0, 0, 0];   // ≥90, 80-89, 70-79, <70
        datos.forEach(({ percentage }) => {
            if (percentage >= 90)      brackets[0]++;
            else if (percentage >= 80) brackets[1]++;
            else if (percentage >= 70) brackets[2]++;
            else                       brackets[3]++;
        });
        return ETIQUETAS_BRACKETS
            .map((name, i) => ({ name, value: brackets[i] }))
            .filter((d) => d.value > 0);
    }, [datos]);

    // ── Exportar CSV ──────────────────────────────────────────────────────────
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

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <section className="space-y-6">
            {/* ── Encabezado con filtros de fechas ─────────────────────────── */}
            <header className="tarjeta flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="w-full">
                        <h2 className="text-2xl font-semibold">Reportes</h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginTop: '4px'
                        }}>
                            <p className="text-sm text-texto-secundario">
                                Asistencia por estudiante con visualizaciones interactivas.
                            </p>
                            <FiltrosGlobales />
                        </div>
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <input
                        type="date"
                        className="campo"
                        value={fechaInicio}
                        aria-label="Fecha de inicio"
                        onChange={(e) => setFechaInicio(e.target.value)}
                    />
                    <input
                        type="date"
                        className="campo"
                        value={fechaFin}
                        aria-label="Fecha de fin"
                        onChange={(e) => setFechaFin(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={exportarCSV}
                        disabled={datos.length === 0}
                        className="boton-primario inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={15} />
                        Exportar CSV
                    </button>
                </div>
            </header>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <section className="grid gap-4 sm:grid-cols-3">
                <article className="tarjeta">
                    <p className="text-sm text-texto-secundario">Estudiantes reportados</p>
                    <p className="mt-2 font-mono text-2xl">{datos.length.toLocaleString('es-CO')}</p>
                </article>
                <article className="tarjeta">
                    <p className="text-sm text-texto-secundario">Promedio de asistencia</p>
                    <p
                        className="mt-2 font-mono text-2xl"
                        style={{
                            color: promedioAsistencia >= 80
                                ? 'var(--color-present)'
                                : promedioAsistencia >= 70
                                    ? 'var(--color-late)'
                                    : 'var(--color-absent)',
                        }}
                    >
                        {promedioAsistencia.toLocaleString('es-CO')}%
                    </p>
                </article>
                <article className="tarjeta">
                    <p className="text-sm text-texto-secundario">Estudiantes bajo 80%</p>
                    <p
                        className="mt-2 font-mono text-2xl"
                        style={{ color: estudiantesEnRiesgo > 0 ? 'var(--color-absent)' : 'var(--color-text-primary)' }}
                    >
                        {estudiantesEnRiesgo.toLocaleString('es-CO')}
                    </p>
                </article>
            </section>

            {/* ── Panel de visualización con tabs ──────────────────────────── */}
            <section className="tarjeta p-0">
                {/* Tabs */}
                <div
                    className="flex items-center gap-1 px-4 pt-4 pb-0 border-b"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    {VISTAS.map(({ id, label, Icono }) => {
                        const activo = vistaActiva === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setVistaActiva(id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative"
                                style={{
                                    color: activo ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    borderBottom: activo ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    marginBottom: '-1px',
                                    background: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <Icono size={15} />
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Contenido de cada vista ───────────────────────────────── */}
                {cargando ? (
                    <p className="p-6 text-sm text-texto-secundario">Cargando...</p>
                ) : datos.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                            Sin datos para los filtros seleccionados.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── Vista: BarChart horizontal ─────────────────────── */}
                        {vistaActiva === 'barras' && (
                            <div className="p-4 pt-6">
                                <p
                                    className="mb-4 text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: 'var(--color-muted)' }}
                                >
                                    % de asistencia por estudiante
                                    {datos.length > 20 && ` (top 20 de ${datos.length})`}
                                </p>
                                <ResponsiveContainer width="100%" height={Math.max(datosBarras.length * 38, 260)}>
                                    <BarChart
                                        data={datosBarras}
                                        layout="vertical"
                                        margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                            stroke="var(--color-border)"
                                        />
                                        <XAxis
                                            type="number"
                                            domain={[0, 100]}
                                            tickFormatter={(v) => `${v}%`}
                                            tick={{ fontSize: 11, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="nombre"
                                            width={130}
                                            tick={{ fontSize: 12, fill: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<TooltipBarra />} cursor={{ fill: 'color-mix(in srgb, var(--color-primary) 6%, transparent)' }} />
                                        <Bar
                                            dataKey="porcentaje"
                                            radius={[0, 6, 6, 0]}
                                            maxBarSize={22}
                                        >
                                            {datosBarras.map((entry) => (
                                                <Cell
                                                    key={entry.nombre}
                                                    fill={
                                                        entry.porcentaje >= 90 ? v('--color-present') :
                                                        entry.porcentaje >= 80 ? v('--color-accent-dark') :
                                                        entry.porcentaje >= 70 ? v('--color-late') :
                                                        v('--color-absent')
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>

                                {/* Leyenda de colores */}
                                <div className="mt-4 flex flex-wrap gap-4 justify-center">
                                    {[
                                        { label: '≥ 90%', color: v('--color-present') },
                                        { label: '80–89%', color: v('--color-accent-dark') },
                                        { label: '70–79%', color: v('--color-late') },
                                        { label: '< 70%', color: v('--color-absent') },
                                    ].map(({ label, color }) => (
                                        <div key={label} className="flex items-center gap-1.5">
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: 3,
                                                    background: color,
                                                }}
                                            />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Vista: PieChart de distribución ──────────────── */}
                        {vistaActiva === 'torta' && (
                            <div className="p-4 pt-6">
                                <p
                                    className="mb-4 text-xs font-semibold uppercase tracking-wider text-center"
                                    style={{ color: 'var(--color-muted)' }}
                                >
                                    Distribución de estudiantes por rango de asistencia
                                </p>
                                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                                    <ResponsiveContainer width={280} height={280}>
                                        <PieChart>
                                            <Pie
                                                data={datosTorta}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={115}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {datosTorta.map((entry, index) => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={COLORES_BRACKETS[ETIQUETAS_BRACKETS.indexOf(entry.name)]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<TooltipTorta />} />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    {/* Leyenda manual */}
                                    <div className="flex flex-col gap-3">
                                        {datosTorta.map((entry) => {
                                            const colorIdx = ETIQUETAS_BRACKETS.indexOf(entry.name);
                                            const pct = datos.length > 0
                                                ? Math.round((entry.value / datos.length) * 100)
                                                : 0;
                                            return (
                                                <div key={entry.name} className="flex items-center gap-3">
                                                    <span
                                                        style={{
                                                            width: 14,
                                                            height: 14,
                                                            borderRadius: 4,
                                                            background: COLORES_BRACKETS[colorIdx],
                                                            display: 'inline-block',
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <div>
                                                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                                            {entry.name}
                                                        </p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                            {entry.value} estudiante{entry.value !== 1 ? 's' : ''} · {pct}%
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Vista: Tabla ───────────────────────────────────── */}
                        {vistaActiva === 'tabla' && (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[620px] text-sm">
                                    <thead style={{ background: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                                        <tr className="text-left text-texto-secundario">
                                            <th className="px-4 py-3 font-medium">#</th>
                                            <th className="px-4 py-3 font-medium">Estudiante</th>
                                            <th className="px-4 py-3 font-medium">Clases</th>
                                            <th className="px-4 py-3 font-medium">Presentes</th>
                                            <th className="px-4 py-3 text-right font-medium">Porcentaje</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datos.map((item, i) => (
                                            <tr
                                                key={item.id}
                                                className="border-b"
                                                style={{ borderColor: 'var(--color-border)' }}
                                            >
                                                <td
                                                    className="px-4 py-3 font-mono text-xs"
                                                    style={{ color: 'var(--color-muted)' }}
                                                >
                                                    {i + 1}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-texto">{item.name}</td>
                                                <td className="px-4 py-3">{Number(item.total).toLocaleString('es-CO')}</td>
                                                <td className="px-4 py-3">{Number(item.present).toLocaleString('es-CO')}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span
                                                        className="inline-flex items-center px-2 py-0.5 rounded-[var(--badge-radius)] font-mono font-semibold text-xs"
                                                        style={{
                                                            background:
                                                                item.percentage >= 90 ? 'var(--color-present-bg)' :
                                                                item.percentage >= 80 ? 'var(--color-accent-light)' :
                                                                item.percentage >= 70 ? 'var(--color-late-bg)' :
                                                                'var(--color-absent-bg)',
                                                            color:
                                                                item.percentage >= 90 ? 'var(--color-present)' :
                                                                item.percentage >= 80 ? 'var(--color-accent-dark)' :
                                                                item.percentage >= 70 ? 'var(--color-late)' :
                                                                'var(--color-absent)',
                                                        }}
                                                    >
                                                        {Number(item.percentage).toLocaleString('es-CO')}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* Chart A — Asistencia en el tiempo (LineChart)               */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="tarjeta p-0">
                <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <div className="flex items-center gap-2">
                        <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                Asistencia en el tiempo
                            </h3>
                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Presentes por semana</p>
                        </div>
                    </div>
                    <select
                        value={modoGrupo}
                        onChange={(e) => setModoGrupo(e.target.value)}
                        style={{
                            height: 36, border: '1px solid var(--color-border)',
                            borderRadius: 'var(--input-radius)', padding: '0 12px',
                            fontSize: '0.8125rem', fontWeight: 500,
                            color: 'var(--color-text-primary)', background: 'var(--color-surface)',
                            cursor: 'pointer', outline: 'none',
                        }}
                    >
                        {MODOS_GRUPO.map((m) => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                    </select>
                </div>

                <div className="p-4">
                    {cargandoSemanal ? (
                        <p className="py-10 text-center text-sm" style={{ color: 'var(--color-muted)' }}>Cargando...</p>
                    ) : datosLineChart.length === 0 ? (
                        <p className="py-10 text-center text-sm" style={{ color: 'var(--color-muted)' }}>Sin datos semanales para los filtros seleccionados.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={datosLineChart} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis
                                    dataKey="semana"
                                    tick={{ fontSize: 11, fill: 'var(--color-muted)', fontFamily: 'var(--font-sans)' }}
                                    axisLine={false} tickLine={false}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 11, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
                                    axisLine={false} tickLine={false}
                                />
                                <Tooltip content={<TooltipSemanal />} />
                                <Legend wrapperStyle={{ fontSize: '0.8125rem', paddingTop: 12 }} />
                                {seriesNombres.map((nombre, i) => (
                                    <Line
                                        key={nombre}
                                        type="monotone"
                                        dataKey={nombre}
                                        stroke={COLORES_LINEAS[i % COLORES_LINEAS.length]}
                                        strokeWidth={2.5}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* Chart B — Comparativo de estados por semana (GroupedBar)   */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="tarjeta p-0">
                <div
                    className="flex items-center gap-2 px-6 py-4 border-b"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <LayoutGrid size={18} style={{ color: 'var(--color-primary)' }} />
                    <div>
                        <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            Comparativo de estados por semana
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Materia activa · Presente / Ausente / Tardanza / Justificado</p>
                    </div>
                </div>

                <div className="p-4">
                    {cargandoSemanal ? (
                        <p className="py-10 text-center text-sm" style={{ color: 'var(--color-muted)' }}>Cargando...</p>
                    ) : datosBarrasSemanales.length === 0 ? (
                        <p className="py-10 text-center text-sm" style={{ color: 'var(--color-muted)' }}>Sin datos para la materia seleccionada.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={datosBarrasSemanales} margin={{ top: 8, right: 24, left: 0, bottom: 0 }} barGap={2}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                <XAxis
                                    dataKey="semana"
                                    tick={{ fontSize: 11, fill: 'var(--color-muted)', fontFamily: 'var(--font-sans)' }}
                                    axisLine={false} tickLine={false}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 11, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
                                    axisLine={false} tickLine={false}
                                />
                                <Tooltip content={<TooltipSemanal />} />
                                <Legend wrapperStyle={{ fontSize: '0.8125rem', paddingTop: 12 }} />
                                <Bar dataKey="presente"    name="Presente"    fill={v('--color-present')}  radius={[4,4,0,0]} maxBarSize={18} />
                                <Bar dataKey="ausente"     name="Ausente"     fill={v('--color-absent')}   radius={[4,4,0,0]} maxBarSize={18} />
                                <Bar dataKey="tardanza"    name="Tardanza"    fill={v('--color-late')}     radius={[4,4,0,0]} maxBarSize={18} />
                                <Bar dataKey="justificado" name="Justificado" fill={v('--color-excused')} radius={[4,4,0,0]} maxBarSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>
        </section>
    );
}
