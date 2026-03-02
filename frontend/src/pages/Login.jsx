import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2, LogIn, GraduationCap } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.token, res.data.teacher);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Error de conexión. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-2xl shadow-blue-500/30 mb-4">
                        <GraduationCap size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">
                        Telecom Asistencia
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">
                        Portal para Profesores
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6">Iniciar Sesión</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
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
                                value={password}
                                onChange={e => setPassword(e.target.value)}
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
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <LogIn size={20} />
                            )}
                            {loading ? 'Iniciando sesión...' : 'Entrar'}
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
