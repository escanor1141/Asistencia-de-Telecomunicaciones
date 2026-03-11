import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Courses from './pages/Courses.jsx';
import Students from './pages/Students.jsx';
import Attendance from './pages/Attendance.jsx';
import History from './pages/History.jsx';
import Reports from './pages/Reports.jsx';
import Teachers from './pages/Teachers.jsx';
import Login from './pages/Login.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Layout from './components/Layout.jsx';

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/*"
                element={
                    <PrivateRoute>
                        <Layout>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/courses" element={<Courses />} />
                                <Route path="/students" element={<Students />} />
                                <Route path="/attendance" element={<Attendance />} />
                                <Route path="/history" element={<History />} />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/teachers" element={<Teachers />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Layout>
                    </PrivateRoute>
                }
            />
        </Routes>
    );
}
