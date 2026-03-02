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

export const getStudents = () => api.get('/students').then(res => res.data);
export const createStudent = (data) => api.post('/students', data).then(res => res.data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data).then(res => res.data);
export const deleteStudent = (id) => api.delete(`/students/${id}`).then(res => res.data);

export const getAttendance = (date) => {
    const params = date ? { date } : {};
    return api.get('/attendance', { params }).then(res => res.data);
};
export const saveAttendance = (data) => api.post('/attendance', data).then(res => res.data);

export const getReports = (params) => api.get('/reports', { params }).then(res => res.data);

export default api;
