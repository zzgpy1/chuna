import { API_BASE, TOKEN_KEY } from './config.js';

function getHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
}

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const resp = await fetch(url, {
        ...options,
        headers: { ...getHeaders(), ...options.headers },
    });
    const data = await resp.json();
    if (!resp.ok) {
        throw new Error(data.error || '请求失败');
    }
    return data;
}

export const api = {
    // 登录
    login(username, password) {
        return request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },
    // 供应商
    getSuppliers() { return request('/api/suppliers'); },
    addSupplier(data) { return request('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }); },
    updateSupplier(id, data) { return request(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    deleteSupplier(id) { return request(`/api/suppliers/${id}`, { method: 'DELETE' }); },
    // 账户
    getAccounts() { return request('/api/accounts'); },
    addAccount(data) { return request('/api/accounts', { method: 'POST', body: JSON.stringify(data) }); },
    updateAccount(id, data) { return request(`/api/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    deleteAccount(id) { return request(`/api/accounts/${id}`, { method: 'DELETE' }); },
    // 付款
    getPayments() { return request('/api/payments'); },
    addPayment(data) { return request('/api/payments', { method: 'POST', body: JSON.stringify(data) }); },
    updatePayment(id, data) { return request(`/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    confirmPayment(id) { return request(`/api/payments/${id}/confirm`, { method: 'PATCH' }); },
    deletePayment(id) { return request(`/api/payments/${id}`, { method: 'DELETE' }); },
    // 统计
    getStatistics(params) {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/statistics?${qs}`);
    },
    // 仪表盘
    getDashboard() { return request('/api/dashboard'); },
};
