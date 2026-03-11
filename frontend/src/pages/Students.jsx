import { useState, useEffect, useRef } from 'react';
import { UserPlus, Search, Trash2, Upload, Loader2, Mail, Phone } from 'lucide-react';
import { getStudents, createStudent, deleteStudent } from '../services/api';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { useCourse } from '../context/CourseContext';

export default function Students() {
    const { selectedCourse } = useCourse();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newWhatsapp, setNewWhatsapp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (selectedCourse) {
            fetchStudents();
        } else {
            setStudents([]);
            setLoading(false);
        }
    }, [selectedCourse]);

    const fetchStudents = async () => {
        if (!selectedCourse) return;
        setLoading(true);
        try {
            const data = await getStudents(selectedCourse.id);
            setStudents(data);
        } catch (error) {
            toast.error('Error al cargar estudiantes');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        if (!selectedCourse) {
            toast.error('Selecciona un curso primero');
            return;
        }
        setIsSubmitting(true);
        try {
            await createStudent(selectedCourse.id, {
                name: newName,
                email: newEmail || null,
                whatsapp: newWhatsapp || null,
            });
            toast.success('Estudiante añadido');
            setNewName('');
            setNewEmail('');
            setNewWhatsapp('');
            fetchStudents();
        } catch (error) {
            toast.error('Error al añadir estudiante');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`¿Estás seguro de eliminar a ${name}?`)) return;
        try {
            await deleteStudent(id);
            toast.success('Estudiante eliminado');
            fetchStudents();
        } catch (error) {
            toast.error('Error al eliminar estudiante');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Support both CSV and Excel files
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

        if (isExcel) {
            // Use dynamic import for xlsx
            import('xlsx').then(XLSX => {
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    try {
                        const workbook = XLSX.read(evt.target.result, { type: 'binary' });
                        const sheet = workbook.Sheets[workbook.SheetNames[0]];
                        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                        await processRows(rows);
                    } catch (error) {
                        toast.error('Error al leer el archivo Excel');
                    }
                    if (fileInputRef.current) fileInputRef.current.value = '';
                };
                reader.readAsBinaryString(file);
            }).catch(() => {
                toast.error('No se pudo cargar el lector de Excel. Usa un archivo CSV.');
            });
        } else {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    await processRows(results.data);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            });
        }
    };

    const processRows = async (rows) => {
        try {
            const validStudents = rows
                .map(row => ({
                    name: row.Nombre || row.nombre || row.Name || row.name || row.Student || '',
                    email: row.Correo || row.correo || row.Email || row.email || '',
                    whatsapp: row.Whatsapp || row.whatsapp || row.WhatsApp || row.Telefono || row.telefono || row.Phone || '',
                }))
                .filter(s => s.name && s.name.trim() !== '');

            if (validStudents.length === 0) {
                toast.error('No se encontraron datos válidos. Asegúrate de tener columna "Nombre"');
                return;
            }

            if (!selectedCourse) {
                toast.error('Selecciona un curso primero');
                return;
            }

            toast.loading('Importando...', { id: 'import' });
            const res = await createStudent(selectedCourse.id, validStudents);
            toast.success(`${res.count || validStudents.length} estudiantes importados`, { id: 'import' });
            fetchStudents();
        } catch (error) {
            toast.error('Error al importar', { id: 'import' });
        }
    };

    const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Estudiantes</h1>
                    <p className="text-gray-500 mt-1">Gestiona la lista de alumnos ({students.length} total)</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                    <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-5 rounded-xl transition-colors"
                    >
                        <Upload size={20} /> Importar Excel / CSV
                    </button>
                    <p className="text-xs text-gray-400">Columnas requeridas: <span className="font-semibold">Nombre</span>, <span className="font-semibold">Correo</span>, <span className="font-semibold">Whatsapp</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-xl font-bold text-gray-800">Añadir Estudiante</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Nombre completo <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                placeholder="Ej. Juan Pérez García"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all outline-none bg-gray-50"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                <span className="flex items-center gap-1"><Mail size={14} /> Correo institucional</span>
                            </label>
                            <input
                                type="email"
                                placeholder="alumno@institucion.edu"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all outline-none bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                <span className="flex items-center gap-1"><Phone size={14} /> Número de WhatsApp</span>
                            </label>
                            <input
                                type="tel"
                                placeholder="Ej. +593 99 123 4567"
                                value={newWhatsapp}
                                onChange={(e) => setNewWhatsapp(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all outline-none bg-gray-50"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
                            Guardar
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[700px]">
                    <div className="flex items-center gap-3 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <Search className="text-gray-400 ml-2" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none outline-none focus:ring-0 text-gray-700 font-medium placeholder-gray-400"
                        />
                    </div>

                    {loading ? (
                        <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {filtered.length === 0 ? (
                                <p className="text-center text-gray-500 py-12">No se encontraron estudiantes.</p>
                            ) : (
                                filtered.map(student => (
                                    <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white hover:border-brand-blue/30 border border-transparent shadow-sm rounded-xl transition-all group">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="font-semibold text-gray-800 truncate">{student.name}</span>
                                            {student.email && (
                                                <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
                                                    <Mail size={11} /> {student.email}
                                                </span>
                                            )}
                                            {student.whatsapp && (
                                                <span className="flex items-center gap-1 text-xs text-green-600 truncate">
                                                    <Phone size={11} /> {student.whatsapp}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(student.id, student.name)}
                                            className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
