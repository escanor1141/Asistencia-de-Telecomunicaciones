import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Loader2, KeyRound } from 'lucide-react';

export default function ResetPassword() {
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);
    const [cargando, setCargando] = useState(false);
    const navegar = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('No se proporcionó un token de seguridad válido. Por favor, solicita un nuevo enlace de recuperación.');
        }
    }, [token]);

    const manejarEnvio = async (e) => {
        e.preventDefault();
        setError('');

        if (nuevaContrasena !== confirmarContrasena) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (nuevaContrasena.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setCargando(true);
        try {
            await api.post('/auth/reset-password', { token, newPassword: nuevaContrasena });
            setExito(true);
            setTimeout(() => {
                navegar('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al restablecer la contraseña. Puede que el enlace haya expirado.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0EBE1] p-4">
            <div className="w-full max-w-md -mt-16">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
                    <div className="flex justify-center mb-4">
                        <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                            <KeyRound size={28} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Crear Nueva Contraseña</h2>
                    <p className="text-slate-600 mb-6 text-sm text-center">
                        Ingresa tu nueva contraseña para el sistema.
                    </p>

                    {exito ? (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-5 rounded-xl text-center">
                            <p className="font-semibold mb-2">¡Contraseña actualizada!</p>
                            <p className="text-sm">Serás redirigido al inicio de sesión en unos segundos...</p>
                        </div>
                    ) : (
                        <form onSubmit={manejarEnvio} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={nuevaContrasena}
                                    onChange={e => setNuevaContrasena(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={!token}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Confirmar Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={confirmarContrasena}
                                    onChange={e => setConfirmarContrasena(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={!token}
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
                                disabled={cargando || !token}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {cargando ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <KeyRound size={20} />
                                )}
                                {cargando ? 'Guardando...' : 'Restablecer Contraseña'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
