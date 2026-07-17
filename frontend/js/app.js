import { auth } from './auth.js';
import { pages } from './pages.js';

// 全局暴露一些函数用于onclick
window.openModal = function(type, id) {
    // 简易弹窗编辑 – 此处略，实际可复用模态框，因代码较长，建议使用独立表单
    alert(`编辑 ${type} ID: ${id || '新增'}`);
};
window.deleteItem = async function(type, id) {
    if (!confirm('确认删除？')) return;
    try {
        if (type === 'supplier') await api.deleteSupplier(id);
        else if (type === 'account') await api.deleteAccount(id);
        else if (type === 'payment') await api.deletePayment(id);
        refreshPage();
    } catch (e) {
        alert('删除失败');
    }
};
window.confirmPayment = async function(id) {
    if (!confirm('确认已打款？')) return;
    try {
        await api.confirmPayment(id);
        refreshPage();
    } catch (e) {
        alert('确认失败');
    }
};

// 页面刷新
function refreshPage() {
    const current = document.querySelector('.nav-link.active');
    if (current) {
        const page = current.dataset.page;
        if (pages[page]) pages[page]();
    }
}

// 路由切换
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.isLoggedIn()) {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('appPage').style.display = 'none';
    } else {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appPage').style.display = 'block';
        document.getElementById('userDisplay').innerText = '👤 ' + auth.getUser();
        // 默认加载仪表盘
        pages.dashboard();
        // 导航点击
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                const page = link.dataset.page;
                if (pages[page]) pages[page]();
            });
        });
        // 退出
        document.getElementById('logoutBtn').addEventListener('click', () => auth.logout());
    }

    // 登录表单
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('loginUser').value;
        const pass = document.getElementById('loginPass').value;
        const errDiv = document.getElementById('loginError');
        try {
            await auth.login(user, pass);
            window.location.reload();
        } catch (err) {
            errDiv.style.display = 'block';
            errDiv.innerText = err.message || '登录失败';
        }
    });
});
