/**
 * API Service Layer
 * Handles all HTTP requests to the backend
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Generic API request handler
const createApiRequest = async (url, method = 'GET', data = null) => {
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            // Add a mock token for development
            'Authorization': 'Bearer mock-token-for-development'
        },
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

// Analytics API
export const analyticsAPI = {
    getDashboard: () => createApiRequest(`${API_URL}/analytics/dashboard`),
    getWorkload: (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return createApiRequest(`${API_URL}/analytics/workload?${query}`);
    },
    getEfficiency: (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return createApiRequest(`${API_URL}/analytics/efficiency?${query}`);
    },
    getPredictions: (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return createApiRequest(`${API_URL}/analytics/predictions?${query}`);
    }
};

// User API
export const userAPI = {
    getAll: (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return createApiRequest(`${API_URL}/users?${query}`);
    },
    getById: (id) => createApiRequest(`${API_URL}/users/${id}`),
    create: (userData) => createApiRequest(`${API_URL}/users`, 'POST', userData),
    update: (id, userData) => createApiRequest(`${API_URL}/users/${id}`, 'PUT', userData),
    delete: (id) => createApiRequest(`${API_URL}/users/${id}`, 'DELETE'),
    getByDepartment: (department) => createApiRequest(`${API_URL}/users/department/${department}`),
    updateWorkload: (id, workloadData) => createApiRequest(`${API_URL}/users/${id}/workload`, 'PUT', workloadData)
};

// Shift API
export const shiftAPI = {
    getAll: (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return createApiRequest(`${API_URL}/shifts?${query}`);
    },
    getById: (id) => createApiRequest(`${API_URL}/shifts/${id}`),
    create: (shiftData) => createApiRequest(`${API_URL}/shifts`, 'POST', shiftData),
    update: (id, shiftData) => createApiRequest(`${API_URL}/shifts/${id}`, 'PUT', shiftData),
    delete: (id) => createApiRequest(`${API_URL}/shifts/${id}`, 'DELETE'),
    assign: (id, assignmentData) => createApiRequest(`${API_URL}/shifts/${id}/assign`, 'PUT', assignmentData),
    unassign: (id) => createApiRequest(`${API_URL}/shifts/${id}/unassign`, 'PUT'),
    autoAssign: (id) => createApiRequest(`${API_URL}/shifts/${id}/auto-assign`, 'POST'),
    getAvailable: (staffId, filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return createApiRequest(`${API_URL}/shifts/available/${staffId}?${query}`);
    }
};

// Leave API
export const leaveAPI = {
    getAll: (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return createApiRequest(`${API_URL}/leaves?${query}`);
    },
    getById: (id) => createApiRequest(`${API_URL}/leaves/${id}`),
    create: (leaveData) => createApiRequest(`${API_URL}/leaves`, 'POST', leaveData),
    update: (id, leaveData) => createApiRequest(`${API_URL}/leaves/${id}`, 'PUT', leaveData),
    delete: (id) => createApiRequest(`${API_URL}/leaves/${id}`, 'DELETE'),
    approve: (id, reviewData) => createApiRequest(`${API_URL}/leaves/${id}/approve`, 'PUT', reviewData),
    reject: (id, reviewData) => createApiRequest(`${API_URL}/leaves/${id}/reject`, 'PUT', reviewData)
};

// Auth API
export const authAPI = {
    verify: (token) => createApiRequest(`${API_URL}/auth/verify`, 'POST', { token }),
    refresh: (refreshToken) => createApiRequest(`${API_URL}/auth/refresh`, 'POST', { refreshToken })
};

const api = {
    analyticsAPI,
    userAPI,
    shiftAPI,
    leaveAPI,
    authAPI
};

export default api;