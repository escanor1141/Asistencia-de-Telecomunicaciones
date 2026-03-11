import { useState, useEffect } from 'react';
import { getStudents, saveAttendance, getAttendance } from '../services/api';
import { CheckCircle2, XCircle, Save, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useCourse } from '../context/CourseContext';

export default function Attendance() {
    const { selectedCourse } = useCourse();
    const [students, setStudents] = useState([]);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (selectedCourse) {
            loadData();
        } else {
            setStudents([]);
            setAttendance({});
            setLoading(false);
        }
    }, [date, selectedCourse]);

    const loadData = async () => {
        if (!selectedCourse) return;
        setLoading(true);
        try {
            const [studentsData, existingData] = await Promise.all([
                getStudents(selectedCourse.id),
                getAttendance(selectedCourse.id, date)
            ]);
            setStudents(studentsData);

            const attMap = {};
            // default non-recorded to absent (false), but if record exist use its status
            if (existingData && existingData.length > 0) {
                existingData.forEach(record => {
                    attMap[record.studentId] = record.present;
                });
            }
            setAttendance(attMap);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const toggleAttendance = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        if (!selectedCourse) return;
        const records = students.map(s => ({
            studentId: s.id,
            present: attendance[s.id] || false
        }));

        setSaving(true);
        try {
            await saveAttendance({ date, courseId: selectedCourse.id, records });
            toast.success('Asistencia guardada correctamente');
        } catch (error) {
            toast.error('Error al guardar asistencia');
        } finally {
            setSaving(false);
        }
    };

    const presentesCount = Object.values(attendance).filter(v => v).length;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Tomar Asistencia</h1>
                    <p className="text-gray-500 mt-1">Registra la asistencia diaria de los alumnos</p>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <Calendar className="text-gray-400 ml-2" size={20} />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-transparent border-none outline-none font-semibold text-gray-700 cursor-pointer"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-wrap gap-4">
                    <div className="flex gap-6">
                        <div className="text-center">
                            <span className="block text-sm text-gray-500 font-medium whitespace-nowrap">Total Estudiantes</span>
                            <span className="text-xl font-bold text-gray-800">{students.length}</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-sm text-gray-500 font-medium">Presentes</span>
                            <span className="text-xl font-bold text-brand-green">{presentesCount}</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-sm text-gray-500 font-medium">Ausentes</span>
                            <span className="text-xl font-bold text-red-500">{students.length - presentesCount}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || students.length === 0}
                        className="flex items-center gap-2 bg-brand-green hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Guardar Asistencia
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-green" size={40} /></div>
                ) : students.length === 0 ? (
                    <div className="text-center p-20 text-gray-500 font-medium cursor-pointer" onClick={() => window.location.href = '/students'}>
                        No hay estudiantes registrados. Ve a la sección de Estudiantes para añadir.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {students.map((student, i) => {
                            const status = attendance[student.id];
                            const isPresent = status === true;
                            const isAbsent = status === false;

                            return (
                                <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 transition-colors gap-4">
                                    <div className="flex items-center gap-4">
                                        <span className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 font-bold rounded-lg text-sm shrink-0">
                                            {i + 1}
                                        </span>
                                        <span className="font-semibold text-gray-800">{student.name}</span>
                                    </div>

                                    <div className="flex gap-3 self-end sm:self-auto">
                                        <button
                                            onClick={() => toggleAttendance(student.id, true)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all border-2 ${isPresent
                                                ? 'bg-brand-green/10 border-brand-green text-brand-green shadow-sm'
                                                : 'border-transparent text-gray-400 hover:bg-gray-100'
                                                }`}
                                        >
                                            <CheckCircle2 size={20} />
                                            <span className="hidden sm:inline">Presente</span>
                                        </button>

                                        <button
                                            onClick={() => toggleAttendance(student.id, false)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all border-2 ${isAbsent
                                                ? 'bg-red-50 border-red-500 text-red-500 shadow-sm'
                                                : 'border-transparent text-gray-400 hover:bg-gray-100'
                                                }`}
                                        >
                                            <XCircle size={20} />
                                            <span className="hidden sm:inline">Ausente</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
