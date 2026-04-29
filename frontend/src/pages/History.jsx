import { useState, useEffect } from 'react';
import { obtenerAsistencia, obtenerDocentes } from '../services/api';
import { Calendar as IconoCalendario, CheckCircle2, XCircle, Loader2, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCurso } from '../context/ContextoCurso';
import FiltrosGlobales from '../components/FiltrosGlobales';

// ── Años disponibles ──────────────────────────────────────────────────────────
const ANIOS = ['2024', '2025', '2026'];

// ── Estilo reutilizable para selects locales ──────────────────────────────────
const estiloSelectLocal = {
    height: '36px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--input-radius)',
    padding: '0 12px',
    fontSize: '0.8125rem',
    fontFamily: 'var(--font-sans)',
    fontWeight: '500',
    color: 'var(--color-text-primary)',
    background: 'var(--color-surface)',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '140px',
};

export default function Historial() {
    // ── Filtros globales del topbar ───────────────────────────────────────────
    const {
        cursoSeleccionado,
        codigoSeleccionado,
        grupoSeleccionado,
        docenteSeleccionado,
    } = useCurso();

    // ── Filtros locales de esta página ────────────────────────────────────────
    const [anio, setAnio] = useState('');
    const [periodo, setPeriodo] = useState('');
    const [modalidad, setModalidad] = useState('');
    const [docenteIdLocal, setDocenteIdLocal] = useState('');
    const [docentes, setDocentes] = useState([]);

    // ── Estado de datos ───────────────────────────────────────────────────────
    const [fechas, setFechas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
    const [detallesFecha, setDetallesFecha] = useState([]);
    const [cargandoDetalles, setCargandoDetalles] = useState(false);

    // ── Carga de docentes para el dropdown local ──────────────────────────────
    useEffect(() => {
        obtenerDocentes()
            .then(data => {
                console.log('DEBUG: docentes en History:', data);
                setDocentes(data);
            })
            .catch(() => setDocentes([]));
    }, []);

    // ── Filtros combinados (globales + locales) ────────────────────────────────
    const filtrosCombinados = {
        codigo:       codigoSeleccionado,
        grupo:        grupoSeleccionado,
        // docenteIdLocal overrides global docenteId when set
        docenteId:    docenteIdLocal || docenteSeleccionado,
        anio:         anio     || null,
        periodo:      periodo  || null,
        modalidad:    modalidad|| null,
    };

    // ── Recarga cuando cambia cualquier filtro ────────────────────────────────
    useEffect(() => {
        setFechaSeleccionada(null);
        if (cursoSeleccionado) {
            obtenerHistorial();
        } else {
            setFechas([]);
            setCargando(false);
        }
    }, [
        cursoSeleccionado,
        codigoSeleccionado,
        grupoSeleccionado,
        docenteSeleccionado,
        anio,
        periodo,
        modalidad,
        docenteIdLocal,
    ]);

    const obtenerHistorial = async () => {
        if (!cursoSeleccionado) return;
        setCargando(true);
        try {
            const datos = await obtenerAsistencia(cursoSeleccionado.id, undefined, filtrosCombinados);
            setFechas(datos);
        } catch (_err) {
            setFechas([]);
        } finally {
            setCargando(false);
        }
    };

    const verDetalles = async (fecha) => {
        if (!cursoSeleccionado) return;
        setFechaSeleccionada(fecha);
        setCargandoDetalles(true);
        try {
            const detalles = await obtenerAsistencia(cursoSeleccionado.id, fecha, filtrosCombinados);
            setDetallesFecha(detalles);
        } catch (_err) {
            setDetallesFecha([]);
        } finally {
            setCargandoDetalles(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <section className="space-y-6">
            {/* Encabezado */}
            <header className="tarjeta">
                <h2 className="text-2xl font-semibold">Historial de Asistencia</h2>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginTop: '4px'
                }}>
                    <p className="text-sm text-texto-secundario">
                        Consulta los registros históricos combinando filtros globales y locales.
                    </p>
                    <FiltrosGlobales />
                </div>
            </header>

            {/* ── Filtros locales ─────────────────────────────────────────────── */}
            <div
                className="tarjeta flex flex-wrap items-end gap-4"
            >
                <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>
                    <Filter size={15} />
                    Filtros adicionales:
                </div>

                {/* Año */}
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="hist-anio"
                        style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}
                    >
                        Año
                    </label>
                    <select
                        id="hist-anio"
                        value={anio}
                        onChange={(e) => setAnio(e.target.value)}
                        style={estiloSelectLocal}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; }}
                    >
                        <option value="">Todos</option>
                        {ANIOS.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>

                {/* Período Académico */}
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="hist-periodo"
                        style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}
                    >
                        Período Académico
                    </label>
                    <select
                        id="hist-periodo"
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        style={estiloSelectLocal}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; }}
                    >
                        <option value="">Todos</option>
                        <option value="1">Período 1</option>
                        <option value="2">Período 2</option>
                    </select>
                </div>

                {/* Modalidad */}
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="hist-modalidad"
                        style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}
                    >
                        Modalidad
                    </label>
                    <select
                        id="hist-modalidad"
                        value={modalidad}
                        onChange={(e) => setModalidad(e.target.value)}
                        style={estiloSelectLocal}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; }}
                    >
                        <option value="">Todas</option>
                        <option value="Tecnología">Tecnología</option>
                        <option value="Ingeniería">Ingeniería</option>
                    </select>
                </div>

                {/* Docente local */}
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="hist-docente"
                        style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}
                    >
                        Docente
                    </label>
                    <select
                        id="hist-docente"
                        value={docenteIdLocal}
                        onChange={(e) => setDocenteIdLocal(e.target.value)}
                        style={{ ...estiloSelectLocal, minWidth: '180px' }}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; }}
                    >
                        <option value="">Todos</option>
                        {docentes.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Sin materia seleccionada ─────────────────────────────────── */}
            {!cursoSeleccionado ? (
                <div className="tarjeta text-center py-12">
                    <p className="text-texto-secundario">Seleccioná una materia en el menú superior.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── Panel izquierdo: listado de fechas ─────────────────── */}
                    <div
                        className="tarjeta p-0 lg:col-span-1 overflow-hidden flex flex-col"
                        style={{ height: '580px' }}
                    >
                        <div
                            className="px-4 py-3 text-sm font-medium flex items-center gap-2 border-b shrink-0"
                            style={{
                                background: 'color-mix(in srgb, var(--color-border) 50%, transparent)',
                                color: 'var(--color-text-secondary)',
                                borderColor: 'var(--color-border)',
                            }}
                        >
                            <IconoCalendario size={15} />
                            Días de clase
                        </div>

                        {cargando ? (
                            <div className="flex flex-1 items-center justify-center">
                                <Loader2
                                    className="animate-spin"
                                    size={30}
                                    style={{ color: 'var(--color-primary)' }}
                                />
                            </div>
                        ) : fechas.length === 0 ? (
                            <div className="flex flex-1 items-center justify-center px-6 text-center">
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                                    Sin registros para los filtros seleccionados.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-y-auto flex-1 p-2 space-y-1">
                                {fechas.map((registro) => {
                                    const estaSeleccionada = fechaSeleccionada === registro.date;
                                    return (
                                        <button
                                            key={registro.date}
                                            onClick={() => verDetalles(registro.date)}
                                            className="w-full text-left px-4 py-3 flex items-center justify-between transition-colors text-sm"
                                            style={{
                                                borderRadius: 'var(--input-radius)',
                                                background: estaSeleccionada
                                                    ? 'var(--color-primary-light)'
                                                    : 'transparent',
                                                color: estaSeleccionada
                                                    ? 'var(--color-primary)'
                                                    : 'var(--color-text-secondary)',
                                                fontWeight: estaSeleccionada ? 600 : 400,
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!estaSeleccionada) e.currentTarget.style.background = 'var(--color-bg)';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!estaSeleccionada) e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 500, color: estaSeleccionada ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                                                    {format(parseISO(registro.date), 'dd MMM', { locale: es })}
                                                </div>
                                                <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                                    {format(parseISO(registro.date), 'yyyy')}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div
                                                    className="font-mono text-sm"
                                                    style={{ color: 'var(--color-accent-dark)', fontWeight: 600 }}
                                                >
                                                    {registro.presentCount} / {registro.total}
                                                </div>
                                                <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                                    Presentes
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Panel derecho: detalle de la fecha ────────────────── */}
                    <div
                        className="tarjeta p-0 lg:col-span-2 flex flex-col"
                        style={{ height: '580px' }}
                    >
                        {fechaSeleccionada ? (
                            <>
                                <div
                                    className="px-6 py-4 border-b flex items-center gap-2 shrink-0"
                                    style={{
                                        background: 'color-mix(in srgb, var(--color-border) 30%, transparent)',
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    <IconoCalendario size={17} style={{ color: 'var(--color-primary)' }} />
                                    <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                        {format(parseISO(fechaSeleccionada), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {cargandoDetalles ? (
                                        <div className="flex h-full items-center justify-center">
                                            <Loader2
                                                className="animate-spin"
                                                size={30}
                                                style={{ color: 'var(--color-primary)' }}
                                            />
                                        </div>
                                    ) : detallesFecha.length === 0 ? (
                                        <div className="flex h-full items-center justify-center">
                                            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                                                Sin registros para los filtros seleccionados.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-2 space-y-1">
                                            {detallesFecha.map((item, i) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between px-4 py-3 transition-colors"
                                                    style={{
                                                        borderRadius: 'var(--input-radius)',
                                                        borderBottom: '1px solid var(--color-border)',
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-mono font-bold"
                                                            style={{
                                                                background: 'var(--color-bg)',
                                                                color: 'var(--color-muted)',
                                                            }}
                                                        >
                                                            {i + 1}
                                                        </span>
                                                        <span
                                                            className="text-sm font-medium"
                                                            style={{ color: 'var(--color-text-primary)' }}
                                                        >
                                                            {item.student.name}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        {item.present ? (
                                                            <span
                                                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold"
                                                                style={{
                                                                    borderRadius: 'var(--badge-radius)',
                                                                    background: 'var(--color-present-bg)',
                                                                    color: 'var(--color-present)',
                                                                }}
                                                            >
                                                                <CheckCircle2 size={13} /> Presente
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold"
                                                                style={{
                                                                    borderRadius: 'var(--badge-radius)',
                                                                    background: 'var(--color-absent-bg)',
                                                                    color: 'var(--color-absent)',
                                                                }}
                                                            >
                                                                <XCircle size={13} /> Ausente
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                                <div
                                    className="mb-6 w-16 h-16 rounded-full flex items-center justify-center"
                                    style={{ background: 'var(--color-primary-light)' }}
                                >
                                    <IconoCalendario
                                        size={26}
                                        style={{ color: 'var(--color-primary)', opacity: 0.55 }}
                                    />
                                </div>
                                <p
                                    className="text-lg font-medium"
                                    style={{ color: 'var(--color-text-primary)' }}
                                >
                                    Seleccioná una fecha
                                </p>
                                <p
                                    className="mt-1 text-sm"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                >
                                    Elegí un día en el panel izquierdo para ver los detalles de asistencia.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
