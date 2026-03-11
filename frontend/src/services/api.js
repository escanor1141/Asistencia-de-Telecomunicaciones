import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000/api', // Backend running on port 4000
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// If token expired/invalid, clear it
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

// Courses API
export const getCourses = () => api.get('/courses').then(res => res.data);
export const createCourse = (data) => api.post('/courses', data).then(res => res.data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data).then(res => res.data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`).then(res => res.data);

// Students API
export const getStudents = (courseId) => api.get('/students', { params: { courseId } }).then(res => res.data);
export const createStudent = (courseId, data) => api.post('/students', data, { params: { courseId } }).then(res => res.data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data).then(res => res.data);
export const deleteStudent = (id) => api.delete(`/students/${id}`).then(res => res.data);

// Attendance API
export const getAttendance = (courseId, date) => {
    const params = { courseId, ...(date && { date }) };
    return api.get('/attendance', { params }).then(res => res.data);
};
export const saveAttendance = (data) => api.post('/attendance', data).then(res => res.data);

// Reports API
export const getReports = (courseId, params) => api.get('/reports', { params: { ...params, courseId } }).then(res => res.data);

export default api;
