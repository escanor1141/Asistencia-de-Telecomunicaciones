import { useState } from 'react';
import { useCourse } from '../context/CourseContext';
import { createCourse, deleteCourse } from '../services/api';
import toast from 'react-hot-toast';
import { BookOpen, Trash2, Plus, Loader2 } from 'lucide-react';

export default function Courses() {
    const { courses, loadCourses, loadingCourses } = useCourse();
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!name.trim() || !code.trim()) return;
        setIsSubmitting(true);
        try {
            await createCourse({ name: name.trim(), code: code.trim() });
            toast.success('Curso añadido exitosamente');
            setName('');
            setCode('');
            await loadCourses();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al añadir curso');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, courseName) => {
        if (!window.confirm(`¿Estás seguro de eliminar el curso ${courseName}? Se borrarán todos sus estudiantes y asistencias.`)) return;
        try {
            await deleteCourse(id);
            toast.success('Curso eliminado');
            await loadCourses();
        } catch (error) {
            toast.error('Error al eliminar curso');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mis Cursos</h1>
                    <p className="text-gray-500 mt-1">Gestiona las materias o cursos que dictas ({courses.length} en total)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-xl font-bold text-gray-800">Añadir Curso</h2>
                        <div>
                            <input
                                type="text"
                                placeholder="Nombre (ej. Matemáticas)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all outline-none bg-gray-50"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Código (ej. MAT-101)"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all outline-none bg-gray-50"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 shadow-md"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                            Guardar Curso
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <BookOpen className="text-brand-blue" />
                        Tus Cursos Registrados
                    </h2>

                    {loadingCourses ? (
                        <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>
                    ) : (
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
                            {courses.length === 0 ? (
                                <p className="col-span-full text-center text-gray-500 py-12">No has creado ningún curso todavía.</p>
                            ) : (
                                courses.map(course => (
                                    <div key={course.id} className="relative bg-gray-50 hover:bg-white border text-left p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden border-transparent hover:border-brand-blue/30 h-32 flex flex-col justify-center">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue/80 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <h3 className="font-bold text-gray-900 text-lg truncate pr-8">{course.name}</h3>
                                        <p className="text-brand-blue font-semibold text-sm mt-1">{course.code}</p>

                                        <button
                                            onClick={() => handleDelete(course.id, course.name)}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Eliminar curso"
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
