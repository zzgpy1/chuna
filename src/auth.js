// src/auth.js
// 占位符会在 GitHub Actions 构建时被替换为 Secrets 中的实际用户名和密码
const validUsername = '__LOGIN_USERNAME__';
const validPassword = '__LOGIN_PASSWORD__';

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
