import axios from 'axios';

// Cliente HTTP base con la URL del backend
const api = axios.create({
    baseURL: 'http://localhost:4000/api',
});

// Interceptor de petición: agrega el token JWT si existe
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de respuesta: redirige al login si el token expiró
api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401 && err.config?.url !== '/auth/login') {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ── Cursos ──
export const obtenerCursos = () => api.get('/courses').then(res => res.data);
export const crearCurso = (datos) => api.post('/courses', datos).then(res => res.data);
export const actualizarCurso = (id, datos) => api.put(`/courses/${id}`, datos).then(res => res.data);
export const eliminarCurso = (id) => api.delete(`/courses/${id}`).then(res => res.data);

// ── Estudiantes ──
export const obtenerEstudiantes = (idCurso) => api.get('/students', { params: { courseId: idCurso } }).then(res => res.data);
export const crearEstudiante = (idCurso, datos) => api.post('/students', datos, { params: { courseId: idCurso } }).then(res => res.data);
export const actualizarEstudiante = (id, datos) => api.put(`/students/${id}`, datos).then(res => res.data);
export const eliminarEstudiante = (id) => api.delete(`/students/${id}`).then(res => res.data);

// ── Asistencia ──
export const obtenerAsistencia = (idCurso, fecha) => {
    const params = { courseId: idCurso, ...(fecha && { date: fecha }) };
    return api.get('/attendance', { params }).then(res => res.data);
};
export const guardarAsistencia = (datos) => api.post('/attendance', datos).then(res => res.data);

// ── Reportes y Docentes ──
export const obtenerReportes = (idCurso, params) => api.get('/reports', { params: { ...params, courseId: idCurso } }).then(res => res.data);
export const obtenerDocentes = () => api.get('/teachers').then((res) => res.data);

export default api;
