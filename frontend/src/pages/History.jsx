import { useState, useEffect } from 'react';
import { obtenerAsistencia } from '../services/api';
import { Calendar as IconoCalendario, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCurso } from '../context/ContextoCurso';

export default function Historial() {
    const { cursoSeleccionado } = useCurso();
    const [fechas, setFechas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
    const [detallesFecha, setDetallesFecha] = useState([]);
    const [cargandoDetalles, setCargandoDetalles] = useState(false);

    useEffect(() => {
        if (cursoSeleccionado) {
            obtenerHistorial();
        } else {
            setFechas([]);
            setCargando(false);
        }
        setFechaSeleccionada(null);
    }, [cursoSeleccionado]);

    const obtenerHistorial = async () => {
        if (!cursoSeleccionado) return;
        setCargando(true);
        try {
            // Sin fecha devuelve el historial agrupado por día
            const datos = await obtenerAsistencia(cursoSeleccionado.id);
            setFechas(datos);
        } catch (error) {
            // Error silencioso — la UI mostrará lista vacía
        } finally {
            setCargando(false);
        }
    };

    const verDetalles = async (fecha) => {
        if (!cursoSeleccionado) return;
        setFechaSeleccionada(fecha);
        setCargandoDetalles(true);
        try {
            const detalles = await obtenerAsistencia(cursoSeleccionado.id, fecha);
            setDetallesFecha(detalles);
        } catch (error) {
            // Error silencioso
        } finally {
            setCargandoDetalles(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Historial de Asistencia</h1>
                <p className="text-gray-500 mt-1">Consulta los registros de días anteriores</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel izquierdo — listado de fechas */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 bg-gray-50 font-bold text-gray-700 border-b flex items-center gap-2">
                        <IconoCalendario size={18} /> Días de clase
                    </div>
                    {cargando ? (
                        <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-brand-purple" size={40} /></div>
                    ) : fechas.length === 0 ? (
                        <div className="text-center p-10 text-gray-500">No hay registros aún.</div>
                    ) : (
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {fechas.map((registro) => {
                                const estaSeleccionada = fechaSeleccionada === registro.date;
                                return (
                                    <button
                                        key={registro.date}
                                        onClick={() => verDetalles(registro.date)}
                                        className={`w-full text-left p-4 rounded-xl flex items-center justify-between transition-all ${estaSeleccionada
                                            ? 'bg-brand-purple text-white shadow-md'
                                            : 'bg-gray-50 hover:bg-purple-50 hover:text-brand-purple text-gray-700'
                                            }`}
                                    >
                                        <div>
                                            <div className="font-bold text-lg leading-none mb-1">
                                                {format(parseISO(registro.date), 'dd MMM', { locale: es })}
                                            </div>
                                            <div className={`text-xs ${estaSeleccionada ? 'text-purple-200' : 'text-gray-500'}`}>
                                                {format(parseISO(registro.date), 'yyyy')}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${estaSeleccionada ? 'text-white' : 'text-brand-green'}`}>
                                                {registro.presentCount} / {registro.total}
                                            </div>
                                            <div className={`text-xs ${estaSeleccionada ? 'text-purple-200' : 'text-gray-500'}`}>
                                                Presentes
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Panel derecho — detalles de la fecha seleccionada */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
                    {fechaSeleccionada ? (
                        <>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <IconoCalendario className="text-brand-purple" />
                                    {format(parseISO(fechaSeleccionada), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                </h2>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {cargandoDetalles ? (
                                    <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-brand-purple" size={40} /></div>
                                ) : (
                                    <div className="space-y-1">
                                        {detallesFecha.map((item, i) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                                <div className="flex items-center gap-4">
                                                    <span className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 font-bold rounded-lg text-sm">
                                                        {i + 1}
                                                    </span>
                                                    <span className="font-semibold text-gray-800">{item.student.name}</span>
                                                </div>
                                                <div>
                                                    {item.present ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-brand-green/10 text-brand-green">
                                                            <CheckCircle2 size={16} /> Presente
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-50 text-red-600">
                                                            <XCircle size={16} /> Ausente
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
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <IconoCalendario size={32} className="text-brand-purple/40" />
                            </div>
                            <p className="text-2xl font-bold text-gray-800">Selecciona una fecha</p>
                            <p className="mt-2 font-medium">Elige un día en el panel izquierdo para ver los detalles de asistencia.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
