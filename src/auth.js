const validUsername = import.meta.env.VITE_LOGIN_USERNAME || 'admin';
const validPassword = import.meta.env.VITE_LOGIN_PASSWORD || 'admin123';

export function login(username, password) {
  if (username === validUsername && password === validPassword) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('loginTime', new Date().toISOString());
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('loginTime');
}

export function isAuthenticated() {
  return localStorage.getItem('isLoggedIn') === 'true';
}
