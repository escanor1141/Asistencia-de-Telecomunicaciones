import { useState, useEffect } from 'react';
import { getReports } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download, Filter, Loader2, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const res = await getReports(params);
            setData(res);
        } catch (error) {
            toast.error('Error al cargar reportes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [startDate, endDate]);

    const handleExport = () => {
        window.open('http://localhost:3001/api/export', '_blank');
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Reportes y Estadísticas</h1>
                    <p className="text-gray-500 mt-1">Análisis de rendimiento y asistencia general</p>
                </div>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    <Download size={20} />
                    Exportar CSV General
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-wrap items-center gap-4 border border-gray-100 p-2 rounded-xl bg-gray-50/50">
                    <div className="flex items-center gap-2 text-gray-600 font-semibold px-2">
                        <Filter size={18} /> Filtros:
                    </div>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700"
                    />
                    <span className="text-gray-400 font-medium">hasta</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700"
                    />
                    {(startDate || endDate) && (
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="text-sm bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-xl font-bold transition-colors ml-auto md:ml-2"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg"><BarChart2 className="text-indigo-600" size={20} /></div>
                        Top Estudiantes
                    </h2>
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
                    ) : data.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 font-medium">No hay datos en este rango.</div>
                    ) : (
                        <div className="flex-1 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.slice(0, 15)} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        interval={0}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                                        domain={[0, 100]}
                                        tickFormatter={(value) => `${value}%`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#EEF2FF' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#4F46E5' }}
                                    />
                                    <Bar dataKey="percentage" fill="#4F46E5" radius={[6, 6, 0, 0]} name="% Asistencia" maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                            {data.length > 15 && <p className="text-xs text-center text-gray-400 mt-2 absolute bottom-0 w-full left-0 font-medium">Mostrando top 15 estudiantes</p>}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px] overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800">Detalle Individual</h2>
                    </div>
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
                    ) : (
                        <div className="flex-1 overflow-y-auto w-full p-2">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm z-10 rounded-t-xl">
                                    <tr>
                                        <th className="p-4 rounded-tl-xl font-bold text-gray-600 text-sm">Estudiante</th>
                                        <th className="p-4 font-bold text-gray-600 text-sm">Clases</th>
                                        <th className="p-4 font-bold text-gray-600 text-sm">Presente</th>
                                        <th className="p-4 rounded-tr-xl font-bold text-gray-600 text-sm">Porcentaje</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.map((student) => {
                                        const isLow = student.percentage < 70;
                                        return (
                                            <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="p-4 font-semibold text-gray-800">{student.name}</td>
                                                <td className="p-4 text-gray-500 font-medium">{student.total}</td>
                                                <td className="p-4 text-brand-green font-bold">{student.present}</td>
                                                <td className="p-4">
                                                    <span className={`inline-flex justify-center items-center px-3 py-1 min-w-[3rem] rounded-lg text-sm font-bold ${isLow ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                                        }`}>
                                                        {student.percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center text-gray-500 font-medium">Sin datos registrados</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
