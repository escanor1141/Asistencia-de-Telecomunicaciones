import { Link } from 'react-router-dom';
import { Users, CheckSquare, Clock, BarChart2 } from 'lucide-react';

export default function Home() {
    const cards = [
        { to: '/attendance', title: 'Registrar Asistencia', icon: CheckSquare, color: 'bg-brand-green/10 text-brand-green border-brand-green/20 hover:bg-brand-green hover:text-white', desc: 'Toma lista para la fecha de hoy' },
        { to: '/students', title: 'Estudiantes', icon: Users, color: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20 hover:bg-brand-blue hover:text-white', desc: 'Gestiona la lista de alumnos' },
        { to: '/history', title: 'Historial', icon: Clock, color: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20 hover:bg-brand-purple hover:text-white', desc: 'Consulta días anteriores' },
        { to: '/reports', title: 'Reportes', icon: BarChart2, color: 'bg-indigo-100 text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white', desc: 'Estadísticas y exportación' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                    Panel de Control
                </h1>
                <p className="mt-3 text-xl text-gray-500 font-medium">
                    Sistema de automatización de control de asistencia - Telecomunicaciones
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={i}
                            to={card.to}
                            className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl ${card.color} group cursor-pointer`}
                        >
                            <div className="p-4 bg-white/50 rounded-2xl mb-4 group-hover:bg-white/20 transition-colors">
                                <Icon size={48} className="transform group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 tracking-wide">{card.title}</h2>
                            <p className="text-sm opacity-90 text-center font-medium">{card.desc}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
