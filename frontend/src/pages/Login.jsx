import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../context/ContextoAutenticacion';
import api from '../services/api';
import { Loader2, LogIn, GraduationCap } from 'lucide-react';

export default function Login() {
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const { iniciarSesion } = useAutenticacion();
    const navegar = useNavigate();

    const manejarEnvio = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            const res = await api.post('/auth/login', { email: correo, password: contrasena });
            iniciarSesion(res.data.token, res.data.teacher);
            navegar('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Error de conexión. Intenta de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0EBE1] p-4">
            <div className="w-full max-w-md -mt-16">
                {/* Logo / Header */}
                <div className="text-center mb-5">
                    <div className="flex justify-center -mb-2">
                        <img src="/logo.png" alt="Logo UTS" className="h-64 w-auto object-contain drop-shadow-md" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight mt-0">
                        Control de Asistencia<br/><span className="text-blue-600">Telecomunicaciones</span>
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium text-sm">
                        Portal para Profesores
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
                    <h2 className="text-xl font-bold text-slate-800 mb-5 text-center">Iniciar Sesión</h2>

                    <form onSubmit={manejarEnvio} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                value={correo}
                                onChange={e => setCorreo(e.target.value)}
                                placeholder="tu@correo.edu"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Contraseña
                                </label>
                                <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <input
                                type="password"
                                value={contrasena}
                                onChange={e => setContrasena(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={cargando}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {cargando ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <LogIn size={20} />
                            )}
                            {cargando ? 'Iniciando sesión...' : 'Entrar'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-xs mt-6">
                    Sistema de Control de Asistencia · Telecomunicaciones
                </p>
            </div>
        </div>
    );
}
