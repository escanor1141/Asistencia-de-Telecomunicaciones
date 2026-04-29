import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Trash2, Loader2, Upload, X, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { obtenerReportes, obtenerEstudiantes, crearEstudiante, eliminarEstudiante } from '../services/api';
import toast from 'react-hot-toast';
import { useCurso } from '../context/ContextoCurso';
import FiltrosGlobales from '../components/FiltrosGlobales';

// ── Modal de previsualización de importación ──────────────────────────────────
function ModalImportacion({ filas, onConfirmar, onCancelar, importando }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(26,26,46,0.5)', backdropFilter: 'blur(2px)' }}
        >
            <div
                className="w-full max-w-2xl rounded-[var(--card-radius)] border flex flex-col"
                style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    maxHeight: '80vh',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b shrink-0"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <div>
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            Vista previa — Importación
                        </h3>
                        <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {filas.length} estudiante{filas.length !== 1 ? 's' : ''} detectado{filas.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancelar}
                        disabled={importando}
                        className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                        style={{ color: 'var(--color-muted)' }}
                        aria-label="Cerrar modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabla previa */}
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm">
                        <thead style={{ background: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                            <tr className="text-left" style={{ color: 'var(--color-text-secondary)' }}>
                                <th className="px-4 py-3 font-medium">#</th>
                                <th className="px-4 py-3 font-medium">Nombre</th>
                                <th className="px-4 py-3 font-medium">Correo</th>
                                <th className="px-4 py-3 font-medium">WhatsApp</th>
                                <th className="px-4 py-3 font-medium">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filas.map((fila, i) => (
                                <tr
                                    key={i}
                                    className="border-b"
                                    style={{ borderColor: 'var(--color-border)' }}
                                >
                                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{i + 1}</td>
                                    <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                        {fila.name || <span style={{ color: 'var(--color-absent)', fontStyle: 'italic' }}>Sin nombre</span>}
                                    </td>
                                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{fila.email || '—'}</td>
                                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{fila.whatsapp || '—'}</td>
                                    <td className="px-4 py-2.5">
                                        {fila.error ? (
                                            <span
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--badge-radius)] text-xs font-semibold"
                                                style={{ background: 'var(--color-absent-bg)', color: 'var(--color-absent)' }}
                                            >
                                                Error fila {i + 1}
                                            </span>
                                        ) : fila.importado ? (
                                            <span
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--badge-radius)] text-xs font-semibold"
                                                style={{ background: 'var(--color-present-bg)', color: 'var(--color-present)' }}
                                            >
                                                <CheckCircle2 size={12} /> OK
                                            </span>
                                        ) : (
                                            <span
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--badge-radius)] text-xs font-semibold"
                                                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                                            >
                                                Pendiente
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div
                    className="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <button
                        type="button"
                        onClick={onCancelar}
                        disabled={importando}
                        className="boton-secundario disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmar}
                        disabled={importando || filas.length === 0}
                        className="boton-primario inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {importando
                            ? <><Loader2 size={16} className="animate-spin" /> Importando...</>
                            : <><Upload size={16} /> Confirmar importación</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Estudiantes() {
    const {
        cursoSeleccionado,
        codigoSeleccionado,
        grupoSeleccionado,
        docenteSeleccionado,
    } = useCurso();

    const [estudiantes, setEstudiantes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [formularioEstudiante, setFormularioEstudiante] = useState({ name: '', email: '', whatsapp: '' });
    const [guardandoEstudiante, setGuardandoEstudiante] = useState(false);
    const [eliminandoId, setEliminandoId] = useState(null);
    const [refrescar, setRefrescar] = useState(0);

    // ── Import state ─────────────────────────────────────────────────────────
    const inputArchivoRef = useRef(null);
    const [filasImport, setFilasImport] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [importando, setImportando] = useState(false);

    const filtros = {
        codigo:    codigoSeleccionado,
        grupo:     grupoSeleccionado,
        docenteId: docenteSeleccionado,
    };

    // ── Carga de estudiantes ──────────────────────────────────────────────────
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
                    obtenerEstudiantes(cursoSeleccionado.id, filtros),
                    obtenerReportes(cursoSeleccionado.id, {}, filtros),
                ]);
                const porcentajePorId = new Map(reporte.map((item) => [item.id, item.percentage]));
                const normalizados = lista.map((est) => ({
                    id: est.id,
                    nombre: est.name,
                    curso: cursoSeleccionado.name,
                    porcentaje: porcentajePorId.get(est.id) ?? 0,
                }));
                setEstudiantes(normalizados);
            } finally {
                setCargando(false);
            }
        };
        cargarEstudiantes();
    }, [cursoSeleccionado, codigoSeleccionado, grupoSeleccionado, docenteSeleccionado, refrescar]);

    // ── CRUD ──────────────────────────────────────────────────────────────────
    const manejarCreacionEstudiante = async (e) => {
        e.preventDefault();
        if (!cursoSeleccionado) return toast.error('Seleccioná una materia primero');
        setGuardandoEstudiante(true);
        try {
            await crearEstudiante(cursoSeleccionado.id, formularioEstudiante);
            setRefrescar((p) => p + 1);
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
            setRefrescar((p) => p + 1);
            toast.success('Estudiante eliminado');
        } catch {
            toast.error('Error al eliminar estudiante');
        } finally {
            setEliminandoId(null);
        }
    };

    // ── Importación ───────────────────────────────────────────────────────────
    const normalizarColumnas = (fila) => ({
        name:     fila['Nombre']    || fila['nombre']    || fila['Name']     || '',
        email:    fila['Correo']    || fila['correo']    || fila['Email']    || fila['email']    || '',
        whatsapp: fila['WhatsApp']  || fila['whatsapp']  || fila['Whatsapp'] || fila['telefono'] || '',
    });

    const manejarArchivoSeleccionado = (e) => {
        const archivo = e.target.files?.[0];
        if (!inputArchivoRef.current) return;
        inputArchivoRef.current.value = '';  // reset para permitir re-selección

        if (!archivo) return;

        const extension = archivo.name.split('.').pop().toLowerCase();

        if (extension === 'csv') {
            Papa.parse(archivo, {
                header: true,
                skipEmptyLines: true,
                complete: (resultado) => {
                    const filas = resultado.data.map(normalizarColumnas).filter((f) => f.name.trim() !== '');
                    if (filas.length === 0) {
                        toast.error('El archivo CSV no tiene filas válidas (columna "Nombre" requerida)');
                        return;
                    }
                    setFilasImport(filas);
                    setModalVisible(true);
                },
                error: () => toast.error('Error al parsear el archivo CSV'),
            });
        } else if (extension === 'xlsx' || extension === 'xls') {
            const lector = new FileReader();
            lector.onload = (ev) => {
                try {
                    const workbook = XLSX.read(ev.target.result, { type: 'array' });
                    const hoja = workbook.Sheets[workbook.SheetNames[0]];
                    const datos = XLSX.utils.sheet_to_json(hoja, { defval: '' });
                    const filas = datos.map(normalizarColumnas).filter((f) => f.name.trim() !== '');
                    if (filas.length === 0) {
                        toast.error('El archivo Excel no tiene filas válidas (columna "Nombre" requerida)');
                        return;
                    }
                    setFilasImport(filas);
                    setModalVisible(true);
                } catch {
                    toast.error('Error al leer el archivo Excel');
                }
            };
            lector.readAsArrayBuffer(archivo);
        } else {
            toast.error('Formato no soportado. Usá .csv, .xlsx o .xls');
        }
    };

    const confirmarImportacion = async () => {
        if (!cursoSeleccionado || filasImport.length === 0) return;
        setImportando(true);

        let exitosos = 0;
        const filasActualizadas = [...filasImport];

        for (let i = 0; i < filasActualizadas.length; i++) {
            const fila = filasActualizadas[i];
            try {
                await crearEstudiante(cursoSeleccionado.id, {
                    name: fila.name,
                    email: fila.email || null,
                    whatsapp: fila.whatsapp || null,
                });
                filasActualizadas[i] = { ...fila, importado: true, error: false };
                exitosos++;
            } catch {
                filasActualizadas[i] = { ...fila, importado: false, error: true };
                toast.error(`Error al importar fila ${i + 1}: ${fila.name}`);
            }
            setFilasImport([...filasActualizadas]);
        }

        setImportando(false);

        if (exitosos > 0) {
            toast.success(`${exitosos} estudiante${exitosos !== 1 ? 's' : ''} importado${exitosos !== 1 ? 's' : ''} correctamente`);
            setRefrescar((p) => p + 1);
        }

        // Cerrar solo si todos fueron exitosos
        const hayErrores = filasActualizadas.some((f) => f.error);
        if (!hayErrores) {
            setModalVisible(false);
            setFilasImport([]);
        }
    };

    const cancelarImportacion = () => {
        if (importando) return;
        setModalVisible(false);
        setFilasImport([]);
    };

    // ── Filtro local de búsqueda ──────────────────────────────────────────────
    const filtrados = useMemo(
        () =>
            estudiantes.filter(
                (est) =>
                    est.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                    est.id.toLowerCase().includes(busqueda.toLowerCase()),
            ),
        [busqueda, estudiantes],
    );

    return (
        <>
            {/* Modal de importación */}
            {modalVisible && (
                <ModalImportacion
                    filas={filasImport}
                    onConfirmar={confirmarImportacion}
                    onCancelar={cancelarImportacion}
                    importando={importando}
                />
            )}

            <section className="space-y-6">
                <header className="tarjeta">
                    <h2 className="text-2xl font-semibold">Estudiantes</h2>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginTop: '4px'
                    }}>
                        <p className="text-sm text-texto-secundario">Listado y porcentaje de asistencia por estudiante.</p>
                        <FiltrosGlobales />
                    </div>
                </header>

                {/* Formulario de Nuevo Estudiante */}
                {cursoSeleccionado && (
                    <section className="tarjeta p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <Plus size={20} className="text-primario" />
                                Añadir Nuevo Estudiante
                            </h3>
                            {/* Input oculto para el archivo */}
                            <input
                                ref={inputArchivoRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                                aria-label="Seleccionar archivo de importación"
                                onChange={manejarArchivoSeleccionado}
                            />
                            <button
                                type="button"
                                onClick={() => inputArchivoRef.current?.click()}
                                className="inline-flex items-center gap-2 rounded-[var(--input-radius)] px-4 h-10 text-sm font-semibold transition-colors"
                                style={{
                                    border: '1px solid var(--color-primary)',
                                    color: 'var(--color-primary)',
                                    background: 'var(--color-surface)',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-light)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                            >
                                <Upload size={16} />
                                Importar Excel
                            </button>
                        </div>
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
                                <label className="mb-1 block text-sm font-medium text-texto-secundario">
                                    Correo electrónico <span className="font-normal text-xs">(Opcional)</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    className="campo w-full"
                                    value={formularioEstudiante.email}
                                    onChange={(e) => setFormularioEstudiante({ ...formularioEstudiante, email: e.target.value })}
                                />
                            </div>
                            <div className="lg:col-span-1">
                                <label className="mb-1 block text-sm font-medium text-texto-secundario">
                                    WhatsApp <span className="font-normal text-xs">(Opcional)</span>
                                </label>
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
                                    {guardandoEstudiante ? 'Guardando...' : '+ Añadir'}
                                </button>
                            </div>
                        </form>
                        <p className="mt-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                            El archivo de importación debe tener columnas: <span className="font-mono">Nombre</span>,{' '}
                            <span className="font-mono">Correo</span> (opcional), <span className="font-mono">WhatsApp</span> (opcional)
                        </p>
                    </section>
                )}

                {/* Buscador */}
                <div className="tarjeta">
                    <div className="flex items-center gap-2 rounded-[var(--input-radius)] border bg-superficie px-3"
                        style={{ borderColor: 'var(--color-border)' }}>
                        <Search size={16} className="text-texto-secundario" />
                        <input
                            type="text"
                            className="h-10 w-full border-none bg-transparent text-sm outline-none"
                            placeholder="Buscar por nombre o ID"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabla */}
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
                                    {filtrados.map((est) => (
                                        <tr key={est.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                                            <td className="px-4 py-3 font-medium text-texto">{est.nombre}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-texto-secundario">{est.id}</td>
                                            <td className="px-4 py-3 text-texto-secundario">{est.curso}</td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {Number(est.porcentaje).toLocaleString('es-CO')}%
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => manejarEliminacionEstudiante(est.id, est.nombre)}
                                                    disabled={eliminandoId === est.id}
                                                    className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                                                    style={{ color: 'var(--color-muted)' }}
                                                    title="Eliminar estudiante"
                                                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-absent)'; e.currentTarget.style.background = 'var(--color-absent-bg)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    {eliminandoId === est.id
                                                        ? <Loader2 size={16} className="animate-spin" />
                                                        : <Trash2 size={16} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtrados.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-texto-secundario">
                                                No hay estudiantes para los filtros seleccionados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </section>
        </>
    );
}
