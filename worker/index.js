// worker/index.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理 CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 统一响应封装
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    };

    // 辅助：验证 token
    function verifyToken(authHeader) {
      if (!authHeader) return false;
      const token = authHeader.replace('Bearer ', '');
      // 简单验证：对比存储的环境变量（生产用 JWT 更佳，为简化我们直接用固定 token）
      // 此处我们存储的是登录时返回的 token，我们将其与 USERNAME 结合，实际应使用 JWT
      // 为简化，我们假设 token 就是 base64(username:password) 或者随机，但我们直接采用环境变量匹配
      // 更安全方式：使用 JWT，但这里我们使用简单的固定 token（由用户名+密码哈希）
      // 我们在登录时生成一个简单的 token，这里只做验证
      // 为简化，使用 env.API_TOKEN 作为固定 token，登录时返回该 token
      return token === env.API_TOKEN;
    }

    // 路由处理
    try {
      // -------- 登录 --------
      if (path === '/auth/login' && request.method === 'POST') {
        const body = await request.json();
        const { username, password } = body;
        if (username === env.USERNAME && password === env.PASSWORD) {
          // 生成 token（简单使用环境变量中的固定 token）
          const token = env.API_TOKEN || 'default-token-change-me';
          return new Response(JSON.stringify({ success: true, token }), { headers: corsHeaders });
        } else {
          return new Response(JSON.stringify({ error: '用户名或密码错误' }), { status: 401, headers: corsHeaders });
        }
      }

      // 验证 token（除登录外所有请求）
      const authHeader = request.headers.get('Authorization');
      if (!verifyToken(authHeader)) {
        return new Response(JSON.stringify({ error: '未授权' }), { status: 401, headers: corsHeaders });
      }

      // ---------- 供应商 ----------
      if (path === '/suppliers' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM suppliers ORDER BY id').all();
        return new Response(JSON.stringify({ data: results }), { headers: corsHeaders });
      }
      if (path === '/suppliers' && request.method === 'POST') {
        const body = await request.json();
        const { name, products, contact, phone } = body;
        const { success } = await env.DB.prepare(
          'INSERT INTO suppliers (name, products, contact, phone) VALUES (?, ?, ?, ?)'
        ).bind(name, products || '', contact || '', phone || '').run();
        if (success) {
          const { results } = await env.DB.prepare('SELECT * FROM suppliers ORDER BY id DESC LIMIT 1').all();
          return new Response(JSON.stringify({ data: results[0] }), { headers: corsHeaders });
        } else {
          return new Response(JSON.stringify({ error: '创建失败' }), { status: 500, headers: corsHeaders });
        }
      }
      if (path.startsWith('/suppliers/') && request.method === 'PUT') {
        const id = parseInt(path.split('/')[2]);
        const body = await request.json();
        const { name, products, contact, phone } = body;
        await env.DB.prepare(
          'UPDATE suppliers SET name = ?, products = ?, contact = ?, phone = ? WHERE id = ?'
        ).bind(name, products || '', contact || '', phone || '', id).run();
        const { results } = await env.DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(id).all();
        return new Response(JSON.stringify({ data: results[0] }), { headers: corsHeaders });
      }
      if (path.startsWith('/suppliers/') && request.method === 'DELETE') {
        const id = parseInt(path.split('/')[2]);
        await env.DB.prepare('DELETE FROM suppliers WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // ---------- 账户 ----------
      if (path === '/accounts' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM accounts ORDER BY id').all();
        return new Response(JSON.stringify({ data: results }), { headers: corsHeaders });
      }
      if (path === '/accounts' && request.method === 'POST') {
        const body = await request.json();
        const { name, type, account_number, bank, note } = body;
        await env.DB.prepare(
          'INSERT INTO accounts (name, type, account_number, bank, note) VALUES (?, ?, ?, ?, ?)'
        ).bind(name, type || 'public', account_number || '', bank || '', note || '').run();
        const { results } = await env.DB.prepare('SELECT * FROM accounts ORDER BY id DESC LIMIT 1').all();
        return new Response(JSON.stringify({ data: results[0] }), { headers: corsHeaders });
      }
      if (path.startsWith('/accounts/') && request.method === 'PUT') {
        const id = parseInt(path.split('/')[2]);
        const body = await request.json();
        const { name, type, account_number, bank, note } = body;
        await env.DB.prepare(
          'UPDATE accounts SET name = ?, type = ?, account_number = ?, bank = ?, note = ? WHERE id = ?'
        ).bind(name, type || 'public', account_number || '', bank || '', note || '', id).run();
        const { results } = await env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(id).all();
        return new Response(JSON.stringify({ data: results[0] }), { headers: corsHeaders });
      }
      if (path.startsWith('/accounts/') && request.method === 'DELETE') {
        const id = parseInt(path.split('/')[2]);
        await env.DB.prepare('DELETE FROM accounts WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // ---------- 交易 ----------
      if (path === '/transactions' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM transactions ORDER BY id DESC').all();
        return new Response(JSON.stringify({ data: results }), { headers: corsHeaders });
      }
      if (path === '/transactions' && request.method === 'POST') {
        const body = await request.json();
        const { supplier_id, account_id, type, transaction_date, amount, paid_amount, note, status } = body;
        await env.DB.prepare(
          `INSERT INTO transactions 
           (supplier_id, account_id, type, transaction_date, amount, paid_amount, note, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(supplier_id, account_id || null, type || 'prepay', transaction_date, amount || 0, paid_amount || 0, note || '', status || 'pending').run();
        const { results } = await env.DB.prepare('SELECT * FROM transactions ORDER BY id DESC LIMIT 1').all();
        return new Response(JSON.stringify({ data: results[0] }), { headers: corsHeaders });
      }
      if (path.startsWith('/transactions/') && request.method === 'PUT') {
        const id = parseInt(path.split('/')[2]);
        const body = await request.json();
        const { supplier_id, account_id, type, transaction_date, amount, paid_amount, note, status } = body;
        await env.DB.prepare(
          `UPDATE transactions SET 
            supplier_id = ?, account_id = ?, type = ?, transaction_date = ?, amount = ?, paid_amount = ?, note = ?, status = ?
           WHERE id = ?`
        ).bind(supplier_id, account_id || null, type || 'prepay', transaction_date, amount || 0, paid_amount || 0, note || '', status || 'pending', id).run();
        const { results } = await env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).all();
        return new Response(JSON.stringify({ data: results[0] }), { headers: corsHeaders });
      }
      if (path.startsWith('/transactions/') && request.method === 'DELETE') {
        const id = parseInt(path.split('/')[2]);
        await env.DB.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      // 确认打款（更新状态为 paid）
      if (path.startsWith('/transactions/') && path.endsWith('/confirm') && request.method === 'PUT') {
        const id = parseInt(path.split('/')[2]);
        await env.DB.prepare('UPDATE transactions SET status = ? WHERE id = ?').bind('paid', id).run();
        const { results } = await env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).all();
        return new Response(JSON.stringify({ data: results[0] }), { headers: corsHeaders });
      }

      // 404
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
