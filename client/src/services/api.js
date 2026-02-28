import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('aa_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 globally
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('aa_token');
            localStorage.removeItem('aa_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ─── Auth ───
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
    changePassword: (data) => api.put('/auth/password', data),
};

// ─── Profile ───
export const profileAPI = {
    get: () => api.get('/profile'),
    update: (data) => api.put('/profile', data),
    parseResume: (file) => {
        const form = new FormData();
        form.append('resume', file);
        return api.post('/profile/parse-resume', form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

// ─── Jobs ───
export const jobsAPI = {
    search: (params) => api.get('/jobs', { params }),
    getById: (id) => api.get(`/jobs/${id}`)
};

// ─── Applications ───
export const applicationsAPI = {
    list: (params) => api.get('/applications', { params }),
    get: (id) => api.get(`/applications/${id}`),
    create: (data) => api.post('/applications', data),
    update: (id, data) => api.put(`/applications/${id}`, data),
    delete: (id) => api.delete(`/applications/${id}`)
};

// ─── AI ───
export const aiAPI = {
    detectRole: (text) => api.post('/ai/detect-role', { text }),
    formFill: (profile, fields) => api.post('/ai/form-fill', { profile, fields })
};

export default api;
