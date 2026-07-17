import { TOKEN_KEY, USER_KEY } from './config.js';
import { api } from './api.js';

export const auth = {
    isLoggedIn() {
        return !!localStorage.getItem(TOKEN_KEY);
    },
    getUser() {
        return localStorage.getItem(USER_KEY) || '管理员';
    },
    async login(username, password) {
        const data = await api.login(username, password);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, data.username);
        return data;
    },
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.reload();
    }
};
