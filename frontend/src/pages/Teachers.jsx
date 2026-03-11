import { useState, useEffect } from 'react';
import api from '../services/api';
import { UserPlus, Trash2, Loader2, Users, Eye, EyeOff, ShieldCheck, Mail, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Teachers() {
    const { user } = useAuth();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'TEACHER' });
    const [deletingId, setDeletingId] = useState(null);
    const [sendingNotifications, setSendingNotifications] = useState(false);

    useEffect(() => { fetchTeachers(); }, []);

    const fetchTeachers = async () => {
        try {
            const data = await api.get('/teachers').then(r => r.data);
            setTeachers(data);
        } catch {
            toast.error('Error al cargar profesores');
        } finally {
            setLoading(false);
        }
    };

    const handleSendNotifications = async () => {
        if (!confirm('¿Deseas enviar las notificaciones de inasistencias a todos los estudiantes con faltas esta semana?')) return;

        setSendingNotifications(true);
        const toastId = toast.loading('Procesando envío de correos...');

        try {
            const res = await api.post('/notifications/send-weekly');
            const { results } = res.data;
            toast.success(
                `Proceso completado: ${results.sent} enviados, ${results.skipped} omitidos.`,
                { id: toastId, duration: 5000 }
            );
        } catch (err) {
            toast.error(
                err.response?.data?.error || 'Error al ejecutar el proceso de notificación',
                { id: toastId }
            );
        } finally {
            setSendingNotifications(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const newTeacher = await api.post('/teachers', form).then(r => r.data);
            setTeachers(prev => [...prev, newTeacher]);
            setForm({ name: '', email: '', password: '', role: 'TEACHER' });
            toast.success('Profesor creado exitosamente');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al crear profesor');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (id === user?.id) {
            toast.error('No puedes eliminar tu propia cuenta');
            return;
        }
        if (!confirm(`¿Eliminar al profesor "${name}"? Esta acción no se puede deshacer.`)) return;
        setDeletingId(id);
        try {
            await api.delete(`/teachers/${id}`);
            setTeachers(prev => prev.filter(t => t.id !== id));
            toast.success('Profesor eliminado');
        } catch {
            toast.error('Error al eliminar profesor');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Gestión de Profesores</h1>
                <p className="text-gray-500 mt-1">Administra las cuentas de acceso al sistema</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Create Form */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 self-start">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <UserPlus size={20} className="text-brand-purple" />
                        Crear Nuevo Profesor
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Nombre completo</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="Ej. Juan Pérez"
                                required
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Correo Electrónico</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                placeholder="correo@ejemplo.com"
                                required
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-11 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Rol del Sistema</label>
                            <select
                                value={form.role}
                                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 bg-white outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition"
                            >
                                <option value="TEACHER">Profesor (Solo sus materias)</option>
                                <option value="ADMIN">Administrador (Gestión total)</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 bg-brand-purple hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 transform hover:-translate-y-0.5"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                            {saving ? 'Creando...' : 'Crear Profesor'}
                        </button>
                    </form>
                </div>

                {user?.role === 'ADMIN' && (
                    <div className="lg:col-span-2 bg-gradient-to-br from-brand-purple to-purple-800 rounded-2xl shadow-lg border border-purple-700/50 p-6 self-start text-white">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <ShieldCheck size={20} />
                            Acciones del Sistema
                        </h2>
                        <p className="text-purple-100 text-sm mb-6 leading-relaxed">
                            Control manual de las tareas automáticas del servidor.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={handleSendNotifications}
                                disabled={sendingNotifications}
                                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
                            >
                                {sendingNotifications ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                {sendingNotifications ? 'Enviando...' : 'Enviar Reportes Semanales Ahora'}
                            </button>
                            <p className="text-[10px] text-purple-200/70 text-center italic">
                                * Esto enviará correos solo a estudiantes con faltas que NO hayan recibido el correo esta semana.
                            </p>
                        </div>
                    </div>
                )}

                {/* Teachers List */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 font-bold text-gray-700 border-b flex items-center gap-2">
                        <Users size={18} />
                        Profesores Registrados
                        <span className="ml-auto bg-brand-purple/10 text-brand-purple text-xs font-bold px-2.5 py-1 rounded-full">
                            {teachers.length}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-brand-purple" size={36} /></div>
                    ) : teachers.length === 0 ? (
                        <div className="text-center p-16 text-gray-400 font-medium">No hay profesores registrados aún.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {teachers.map(teacher => (
                                <div key={teacher.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center text-white font-bold text-sm shrink-0">
                                            {teacher.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-semibold text-gray-800">{teacher.name}</p>
                                                {teacher.role === 'ADMIN' && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                        <ShieldCheck size={11} /> Admin
                                                    </span>
                                                )}
                                                {teacher.id === user?.id && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full">
                                                        Tú
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{teacher.email}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Registrado {format(parseISO(teacher.createdAt), "d MMM yyyy", { locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(teacher.id, teacher.name)}
                                        disabled={deletingId === teacher.id || teacher.id === user?.id}
                                        className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        title={teacher.id === user?.id ? 'No puedes eliminar tu propia cuenta' : 'Eliminar profesor'}
                                    >
                                        {deletingId === teacher.id
                                            ? <Loader2 size={18} className="animate-spin" />
                                            : <Trash2 size={18} />
                                        }
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
