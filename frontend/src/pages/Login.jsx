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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <img src="/logo.png" alt="Logo UTS" className="h-96 w-auto object-contain drop-shadow-xl" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">
                        Control de Asistencia<br/><span className="text-cyan-400">Telecomunicaciones</span>
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">
                        Portal para Profesores
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6">Iniciar Sesión</h2>

                    <form onSubmit={manejarEnvio} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                value={correo}
                                onChange={e => setCorreo(e.target.value)}
                                placeholder="tu@correo.edu"
                                required
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={contrasena}
                                onChange={e => setContrasena(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={cargando}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
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

                <p className="text-center text-slate-600 text-xs mt-6">
                    Sistema de Control de Asistencia · Telecomunicaciones
                </p>
            </div>
        </div>
    );
}
