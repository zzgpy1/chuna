// 在文件最前面添加
async function initDB(env) {
    const createTables = [
        `CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            products TEXT,
            remark TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            account_no TEXT,
            bank_info TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_id INTEGER NOT NULL,
            account_id INTEGER,
            payment_type TEXT NOT NULL,
            amount REAL NOT NULL,
            stock_amount REAL,
            is_confirmed INTEGER DEFAULT 0,
            payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            remark TEXT,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
            FOREIGN KEY (account_id) REFERENCES accounts(id)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_payments_supplier ON payments(supplier_id)`,
        `CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date)`,
        `CREATE INDEX IF NOT EXISTS idx_payments_confirmed ON payments(is_confirmed)`
    ];
    for (const sql of createTables) {
        await env.DB.prepare(sql).run();
    }
}

// worker/src/index.js
import { Router } from 'itty-router';

const router = Router();

// ---------- 工具函数 ----------
// 校验JWT（简易）
function verifyToken(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        // 仅验证时效，实际生产可增加签名验证
        if (payload.exp && Date.now() > payload.exp) return null;
        return payload;
    } catch (e) {
        return null;
    }
}

// 获取请求体JSON
async function getJson(request) {
    try {
        return await request.json();
    } catch {
        return null;
    }
}

// 统一响应封装
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

// ---------- 登录接口 ----------
router.post('/api/auth/login', async (request, env) => {
    const { username, password } = await getJson(request);
    const validUser = env.ADMIN_USER || 'admin';
    const validPass = env.ADMIN_PASS || 'admin123';
    if (username === validUser && password === validPass) {
        // 生成简易JWT (仅用于演示)
        const payload = { username, exp: Date.now() + 8 * 3600 * 1000 };
        const token = btoa(JSON.stringify(payload)); // 简易，生产建议使用HMAC
        return jsonResponse({ token, username });
    }
    return jsonResponse({ error: '用户名或密码错误' }, 401);
});

// ---------- 中间件：鉴权 ----------
const authMiddleware = (request, env) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return jsonResponse({ error: '未授权' }, 401);
    }
    const token = authHeader.slice(7);
    const payload = verifyToken(token, env.JWT_SECRET || 'secret');
    if (!payload) {
        return jsonResponse({ error: 'Token无效或已过期' }, 401);
    }
    return payload;
};

// 包装路由，自动鉴权
const apiRouter = (request, env) => {
    // 登录接口不鉴权
    if (request.url.includes('/api/auth/login')) {
        return router.handle(request, env);
    }
    // 其他API需要鉴权
    const authResult = authMiddleware(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }
    return router.handle(request, env, authResult);
};

// ---------- 供应商 CRUD ----------
router.get('/api/suppliers', async (request, env) => {
    const { results } = await env.DB.prepare('SELECT * FROM suppliers ORDER BY id DESC').all();
    return jsonResponse(results);
});

router.post('/api/suppliers', async (request, env) => {
    const body = await getJson(request);
    const { name, products, remark } = body;
    if (!name) return jsonResponse({ error: '供应商名称必填' }, 400);
    const { success } = await env.DB.prepare(
        'INSERT INTO suppliers (name, products, remark) VALUES (?, ?, ?)'
    ).bind(name, products || '', remark || '').run();
    if (success) {
        const { results } = await env.DB.prepare('SELECT * FROM suppliers WHERE id = last_insert_rowid()').all();
        return jsonResponse(results[0]);
    }
    return jsonResponse({ error: '创建失败' }, 500);
});

router.put('/api/suppliers/:id', async (request, env) => {
    const id = parseInt(request.params.id);
    const body = await getJson(request);
    const { name, products, remark } = body;
    if (!name) return jsonResponse({ error: '名称必填' }, 400);
    const { success } = await env.DB.prepare(
        'UPDATE suppliers SET name = ?, products = ?, remark = ? WHERE id = ?'
    ).bind(name, products || '', remark || '', id).run();
    if (success) {
        const { results } = await env.DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(id).all();
        return jsonResponse(results[0]);
    }
    return jsonResponse({ error: '更新失败' }, 500);
});

router.delete('/api/suppliers/:id', async (request, env) => {
    const id = parseInt(request.params.id);
    await env.DB.prepare('DELETE FROM suppliers WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
});

// ---------- 账户 CRUD ----------
router.get('/api/accounts', async (request, env) => {
    const { results } = await env.DB.prepare('SELECT * FROM accounts ORDER BY id DESC').all();
    return jsonResponse(results);
});

router.post('/api/accounts', async (request, env) => {
    const body = await getJson(request);
    const { name, type, account_no, bank_info } = body;
    if (!name || !type) return jsonResponse({ error: '名称和类型必填' }, 400);
    const { success } = await env.DB.prepare(
        'INSERT INTO accounts (name, type, account_no, bank_info) VALUES (?, ?, ?, ?)'
    ).bind(name, type, account_no || '', bank_info || '').run();
    if (success) {
        const { results } = await env.DB.prepare('SELECT * FROM accounts WHERE id = last_insert_rowid()').all();
        return jsonResponse(results[0]);
    }
    return jsonResponse({ error: '创建失败' }, 500);
});

router.put('/api/accounts/:id', async (request, env) => {
    const id = parseInt(request.params.id);
    const body = await getJson(request);
    const { name, type, account_no, bank_info } = body;
    const { success } = await env.DB.prepare(
        'UPDATE accounts SET name = ?, type = ?, account_no = ?, bank_info = ? WHERE id = ?'
    ).bind(name, type, account_no || '', bank_info || '', id).run();
    if (success) {
        const { results } = await env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(id).all();
        return jsonResponse(results[0]);
    }
    return jsonResponse({ error: '更新失败' }, 500);
});

router.delete('/api/accounts/:id', async (request, env) => {
    const id = parseInt(request.params.id);
    await env.DB.prepare('DELETE FROM accounts WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
});

// ---------- 付款记录 CRUD ----------
router.get('/api/payments', async (request, env) => {
    const { results } = await env.DB.prepare(`
        SELECT p.*, s.name as supplier_name, a.name as account_name 
        FROM payments p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        LEFT JOIN accounts a ON p.account_id = a.id
        ORDER BY p.payment_date DESC
    `).all();
    return jsonResponse(results);
});

router.post('/api/payments', async (request, env) => {
    const body = await getJson(request);
    const { supplier_id, account_id, payment_type, amount, stock_amount, remark } = body;
    if (!supplier_id || !payment_type || amount == null) {
        return jsonResponse({ error: '供应商、付款类型、金额必填' }, 400);
    }
    const { success } = await env.DB.prepare(
        `INSERT INTO payments 
        (supplier_id, account_id, payment_type, amount, stock_amount, remark) 
        VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(supplier_id, account_id || null, payment_type, amount, stock_amount || null, remark || '').run();
    if (success) {
        const { results } = await env.DB.prepare('SELECT * FROM payments WHERE id = last_insert_rowid()').all();
        return jsonResponse(results[0]);
    }
    return jsonResponse({ error: '创建失败' }, 500);
});

router.put('/api/payments/:id', async (request, env) => {
    const id = parseInt(request.params.id);
    const body = await getJson(request);
    const { supplier_id, account_id, payment_type, amount, stock_amount, remark } = body;
    const { success } = await env.DB.prepare(
        `UPDATE payments SET 
            supplier_id = ?, account_id = ?, payment_type = ?, 
            amount = ?, stock_amount = ?, remark = ? 
        WHERE id = ?`
    ).bind(supplier_id, account_id || null, payment_type, amount, stock_amount || null, remark || '', id).run();
    if (success) {
        const { results } = await env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind(id).all();
        return jsonResponse(results[0]);
    }
    return jsonResponse({ error: '更新失败' }, 500);
});

// 确认打款（单独接口）
router.patch('/api/payments/:id/confirm', async (request, env) => {
    const id = parseInt(request.params.id);
    const { success } = await env.DB.prepare(
        'UPDATE payments SET is_confirmed = 1 WHERE id = ?'
    ).bind(id).run();
    if (success) {
        const { results } = await env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind(id).all();
        return jsonResponse(results[0]);
    }
    return jsonResponse({ error: '确认失败' }, 500);
});

router.delete('/api/payments/:id', async (request, env) => {
    const id = parseInt(request.params.id);
    await env.DB.prepare('DELETE FROM payments WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
});

// ---------- 统计查询 ----------
// 按日/月/年 查询某供应商或所有供应商的付款汇总
router.get('/api/statistics', async (request, env) => {
    const url = new URL(request.url);
    const supplierId = url.searchParams.get('supplierId');
    const period = url.searchParams.get('period'); // day, month, year
    const dateStr = url.searchParams.get('date'); // 格式 YYYY-MM-DD 或 YYYY-MM 或 YYYY

    let dateCondition = '';
    let params = [];
    if (period === 'day') {
        dateCondition = 'DATE(payment_date) = ?';
        params.push(dateStr);
    } else if (period === 'month') {
        dateCondition = "strftime('%Y-%m', payment_date) = ?";
        params.push(dateStr);
    } else if (period === 'year') {
        dateCondition = "strftime('%Y', payment_date) = ?";
        params.push(dateStr);
    } else {
        return jsonResponse({ error: '请指定period和date' }, 400);
    }

    let supplierCondition = '';
    if (supplierId && supplierId !== 'all') {
        supplierCondition = 'AND supplier_id = ?';
        params.push(parseInt(supplierId));
    }

    const sql = `
        SELECT 
            COUNT(*) as total_count,
            SUM(amount) as total_amount,
            SUM(CASE WHEN is_confirmed = 1 THEN amount ELSE 0 END) as confirmed_amount,
            SUM(CASE WHEN is_confirmed = 0 THEN amount ELSE 0 END) as unconfirmed_amount
        FROM payments
        WHERE ${dateCondition}
        ${supplierCondition}
    `;
    const { results } = await env.DB.prepare(sql).bind(...params).all();
    return jsonResponse(results[0] || { total_count: 0, total_amount: 0, confirmed_amount: 0, unconfirmed_amount: 0 });
});

// ---------- 仪表盘快速统计 ----------
router.get('/api/dashboard', async (request, env) => {
    const today = new Date().toISOString().slice(0,10);
    const month = today.slice(0,7);
    const year = today.slice(0,4);
    // 今日
    const todayRes = await env.DB.prepare(
        `SELECT COUNT(*) as count, SUM(amount) as amount FROM payments WHERE DATE(payment_date) = ?`
    ).bind(today).first();
    // 本月
    const monthRes = await env.DB.prepare(
        `SELECT COUNT(*) as count, SUM(amount) as amount FROM payments WHERE strftime('%Y-%m', payment_date) = ?`
    ).bind(month).first();
    // 本年
    const yearRes = await env.DB.prepare(
        `SELECT COUNT(*) as count, SUM(amount) as amount FROM payments WHERE strftime('%Y', payment_date) = ?`
    ).bind(year).first();
    return jsonResponse({
        today: { count: todayRes?.count || 0, amount: todayRes?.amount || 0 },
        month: { count: monthRes?.count || 0, amount: monthRes?.amount || 0 },
        year: { count: yearRes?.count || 0, amount: yearRes?.amount || 0 }
    });
});

// 错误处理
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
    async fetch(request, env) {
        // 绑定D1
        return apiRouter(request, env);
    }
};
