import { Routes, Route, Navigate } from 'react-router-dom';
import PanelPrincipal from './pages/Home.jsx';
import Cursos from './pages/Courses.jsx';
import Estudiantes from './pages/Students.jsx';
import Asistencia from './pages/Attendance.jsx';
import Historial from './pages/History.jsx';
import Reportes from './pages/Reports.jsx';
import Configuracion from './pages/Configuracion.jsx';
import Perfil from './pages/Perfil.jsx';
import Login from './pages/Login.jsx';
import RutaPrivada from './components/RutaPrivada.jsx';
import LayoutPrincipal from './components/LayoutPrincipal.jsx';

export default function EnrutadorApp() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/*"
                element={
                    <RutaPrivada>
                        <LayoutPrincipal>
                            <Routes>
                                <Route path="/" element={<PanelPrincipal />} />
                                <Route path="/cursos" element={<Cursos />} />
                                <Route path="/estudiantes" element={<Estudiantes />} />
                                <Route path="/asistencia" element={<Asistencia />} />
                                <Route path="/historial" element={<Historial />} />
                                <Route path="/reportes" element={<Reportes />} />
                                <Route path="/configuracion" element={<Configuracion />} />
                                <Route path="/perfil" element={<Perfil />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </LayoutPrincipal>
                    </RutaPrivada>
                }
            />
        </Routes>
    );
}
