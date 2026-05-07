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

// ── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Construye el objeto de query params para filtros opcionales.
 * Omite claves con valor null / undefined / ''.
 *
 * Filtros globales (topbar):  codigo, grupo, docenteId
 * Filtros locales (Historial): anio, periodo, modalidad, docenteIdLocal
 */
function filtrosGlobales({ cursoId, codigo, grupo, docenteId, anio, periodo, modalidad, docenteIdLocal } = {}) {
    const params = {};
    if (cursoId)       params.cursoId       = cursoId;
    if (codigo)        params.codigo        = codigo;
    if (grupo)         params.grupo         = grupo;
    if (docenteId)     params.docenteId     = docenteId;
    if (anio)          params.anio          = anio;
    if (periodo)       params.periodo       = periodo;
    if (modalidad)     params.modalidad     = modalidad;
    // docenteIdLocal overrides docenteId when set (used in Historial local filter)
    if (docenteIdLocal) params.docenteId   = docenteIdLocal;
    return params;
}


// ── Cursos ───────────────────────────────────────────────────────────────────
export const obtenerCursos   = ()         => api.get('/courses').then(res => res.data);
export const crearCurso      = (datos)    => api.post('/courses', datos).then(res => res.data);
export const actualizarCurso = (id, datos)=> api.put(`/courses/${id}`, datos).then(res => res.data);
export const eliminarCurso   = (id)       => api.delete(`/courses/${id}`).then(res => res.data);

// ── Estudiantes ───────────────────────────────────────────────────────────────
/**
 * @param {string} idCurso   - ID del curso activo (courseId legacy)
 * @param {object} filtros   - { codigo, grupo, docenteId } opcionales
 */
export const obtenerEstudiantes = (idCurso, filtros = {}) =>
    api.get('/students', {
        params: {
            courseId: idCurso,
            ...filtrosGlobales({ ...filtros }),
        },
    }).then(res => res.data);

export const crearEstudiante    = (idCurso, datos) =>
    api.post('/students', datos, { params: { courseId: idCurso } }).then(res => res.data);

export const actualizarEstudiante = (id, datos) =>
    api.put(`/students/${id}`, datos).then(res => res.data);

export const eliminarEstudiante = (idCurso, id) =>
    api.delete(`/students/${id}`, { params: { courseId: idCurso } }).then(res => res.data);

// ── Asistencia ────────────────────────────────────────────────────────────────
/**
 * @param {string} idCurso   - ID del curso activo
 * @param {string} fecha     - Fecha ISO (opcional)
 * @param {object} filtros   - { codigo, grupo, docenteId } opcionales
 */
export const obtenerAsistencia = (idCurso, fecha, filtros = {}) => {
    const params = {
        courseId: idCurso,
        ...(fecha && { date: fecha }),
        ...filtrosGlobales({ ...filtros }),
    };
    return api.get('/attendance', { params }).then(res => res.data);
};

export const guardarAsistencia = (datos) =>
    api.post('/attendance', datos).then(res => res.data);

// ── Reportes ──────────────────────────────────────────────────────────────────
/**
 * @param {string} idCurso   - ID del curso activo
 * @param {object} params    - Parámetros adicionales (startDate, endDate, etc.)
 * @param {object} filtros   - { codigo, grupo, docenteId } opcionales
 */
export const obtenerReportes = (idCurso, params = {}, filtros = {}) =>
    api.get('/reports', {
        params: {
            ...(idCurso ? { courseId: idCurso } : {}),
            ...params,
            ...filtrosGlobales({ ...filtros }),
        },
    }).then(res => res.data);

/**
 * Reporte semanal agregado (Chart A + B).
 * @param {object} params - Cualquier combinación de courseId, docenteId, modalidad,
 *                          periodo, anio, startDate, endDate, etc.
 */
export const obtenerReportesSemanal = (params = {}) =>
    api.get('/reports/semanal', { params }).then(res => res.data);

// ── Docentes ──────────────────────────────────────────────────────────────────
export const obtenerDocentes = () =>
    api.get('/teachers').then(res => res.data.filter(u => u.role === 'TEACHER' || u.role === 'DOCENTE'));

/**
 * Asistencia de hoy por materia (para el dashboard del admin).
 * @param {string} [docenteId] - Opcional: filtrar por docente
 */
export const obtenerAsistenciaHoyPorCurso = (docenteId) =>
    api.get('/attendance/hoy', { params: docenteId ? { docenteId } : {} })
        .then(res => res.data.cursos);

export default api;
