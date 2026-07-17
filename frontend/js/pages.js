import { api } from './api.js';
import { auth } from './auth.js';

// 公共渲染函数
export const pages = {
    // 仪表盘
    async dashboard() {
        const main = document.getElementById('mainContent');
        try {
            const data = await api.getDashboard();
            main.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="card text-white bg-primary">
                            <div class="card-body">
                                <h6 class="card-title">今日付款</h6>
                                <h2 class="mb-0">¥${(data.today.amount || 0).toFixed(2)}</h2>
                                <small>${data.today.count || 0} 笔</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card text-white bg-success">
                            <div class="card-body">
                                <h6 class="card-title">本月付款</h6>
                                <h2 class="mb-0">¥${(data.month.amount || 0).toFixed(2)}</h2>
                                <small>${data.month.count || 0} 笔</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card text-white bg-info">
                            <div class="card-body">
                                <h6 class="card-title">本年付款</h6>
                                <h2 class="mb-0">¥${(data.year.amount || 0).toFixed(2)}</h2>
                                <small>${data.year.count || 0} 笔</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-4">
                    <div class="card">
                        <div class="card-header">最近付款记录</div>
                        <div class="card-body">
                            <div id="recentPayments">加载中...</div>
                        </div>
                    </div>
                </div>
            `;
            // 加载最近5条付款
            const payments = await api.getPayments();
            const recent = payments.slice(0, 5);
            const html = recent.map(p => `
                <div class="d-flex justify-content-between border-bottom py-2">
                    <span><strong>${p.supplier_name || '#'+p.supplier_id}</strong> ${p.remark || ''}</span>
                    <span>¥${p.amount.toFixed(2)} ${p.is_confirmed ? '✅' : '⏳'}</span>
                </div>
            `).join('');
            document.querySelector('#recentPayments').innerHTML = html || '暂无记录';
        } catch (e) {
            main.innerHTML = `<div class="alert alert-danger">加载仪表盘失败</div>`;
        }
    },

    // 供应商列表
    async suppliers() {
        const main = document.getElementById('mainContent');
        try {
            const list = await api.getSuppliers();
            let html = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4><i class="bi bi-people"></i> 供应商管理</h4>
                    <button class="btn btn-primary btn-sm" onclick="window.openModal('supplier')">+ 新增</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead><tr><th>ID</th><th>名称</th><th>供应产品</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody>
                    `;
            list.forEach(s => {
                html += `
                    <tr>
                        <td>${s.id}</td>
                        <td>${s.name}</td>
                        <td>${s.products || '-'}</td>
                        <td>${s.remark || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="window.openModal('supplier', ${s.id})">编辑</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="window.deleteItem('supplier', ${s.id})">删除</button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table></div>';
            main.innerHTML = html;
        } catch (e) {
            main.innerHTML = `<div class="alert alert-danger">加载供应商失败</div>`;
        }
    },

    // 账户列表
    async accounts() {
        const main = document.getElementById('mainContent');
        try {
            const list = await api.getAccounts();
            let html = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4><i class="bi bi-bank"></i> 账户管理</h4>
                    <button class="btn btn-primary btn-sm" onclick="window.openModal('account')">+ 新增</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead><tr><th>ID</th><th>名称</th><th>类型</th><th>账号</th><th>银行信息</th><th>操作</th></tr></thead>
                        <tbody>
                    `;
            list.forEach(a => {
                const typeLabel = a.type === 'public' ? '对公' : '私用';
                html += `
                    <tr>
                        <td>${a.id}</td>
                        <td>${a.name}</td>
                        <td><span class="badge bg-secondary">${typeLabel}</span></td>
                        <td>${a.account_no || '-'}</td>
                        <td>${a.bank_info || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="window.openModal('account', ${a.id})">编辑</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="window.deleteItem('account', ${a.id})">删除</button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table></div>';
            main.innerHTML = html;
        } catch (e) {
            main.innerHTML = `<div class="alert alert-danger">加载账户失败</div>`;
        }
    },

    // 付款记录
    async payments() {
        const main = document.getElementById('mainContent');
        try {
            const list = await api.getPayments();
            let html = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4><i class="bi bi-receipt"></i> 付款记录</h4>
                    <button class="btn btn-primary btn-sm" onclick="window.openModal('payment')">+ 新增</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead><tr><th>ID</th><th>供应商</th><th>账户</th><th>类型</th><th>实付金额</th><th>入库金额</th><th>状态</th><th>日期</th><th>操作</th></tr></thead>
                        <tbody>
                    `;
            list.forEach(p => {
                const typeLabel = p.payment_type === 'prepaid' ? '预付款' : '后付款';
                const status = p.is_confirmed ? '<span class="badge badge-confirmed">已确认</span>' : '<span class="badge badge-unconfirmed">未确认</span>';
                html += `
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.supplier_name || '#'+p.supplier_id}</td>
                        <td>${p.account_name || '-'}</td>
                        <td>${typeLabel}</td>
                        <td>¥${p.amount.toFixed(2)}</td>
                        <td>${p.stock_amount ? '¥'+p.stock_amount.toFixed(2) : '-'}</td>
                        <td>${status}</td>
                        <td>${new Date(p.payment_date).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="window.openModal('payment', ${p.id})">编辑</button>
                            ${!p.is_confirmed ? `<button class="btn btn-sm btn-outline-success" onclick="window.confirmPayment(${p.id})">确认</button>` : ''}
                            <button class="btn btn-sm btn-outline-danger" onclick="window.deleteItem('payment', ${p.id})">删除</button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table></div>';
            main.innerHTML = html;
        } catch (e) {
            main.innerHTML = `<div class="alert alert-danger">加载付款记录失败</div>`;
        }
    },

    // 统计查询
    async statistics() {
        const main = document.getElementById('mainContent');
        // 加载供应商列表用于筛选
        const suppliers = await api.getSuppliers();
        const supplierOptions = suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        main.innerHTML = `
            <h4><i class="bi bi-bar-chart"></i> 统计查询</h4>
            <div class="card mt-3">
                <div class="card-body">
                    <form id="statForm" class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">供应商</label>
                            <select id="statSupplier" class="form-select">
                                <option value="all">全部</option>
                                ${supplierOptions}
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">周期</label>
                            <select id="statPeriod" class="form-select">
                                <option value="day">日</option>
                                <option value="month" selected>月</option>
                                <option value="year">年</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">日期</label>
                            <input type="date" id="statDate" class="form-control" value="${new Date().toISOString().slice(0,7)}" />
                        </div>
                        <div class="col-md-3 d-flex align-items-end">
                            <button type="submit" class="btn btn-primary w-100">查询</button>
                        </div>
                    </form>
                </div>
            </div>
            <div id="statResult" class="mt-4"></div>
        `;
        // 绑定查询事件
        document.getElementById('statForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const supplierId = document.getElementById('statSupplier').value;
            const period = document.getElementById('statPeriod').value;
            let date = document.getElementById('statDate').value;
            if (period === 'day') {
                // date 必须是 YYYY-MM-DD
                if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    date = new Date().toISOString().slice(0,10);
                }
            } else if (period === 'month') {
                if (!date.match(/^\d{4}-\d{2}$/)) {
                    date = new Date().toISOString().slice(0,7);
                }
            } else if (period === 'year') {
                if (!date.match(/^\d{4}$/)) {
                    date = new Date().toISOString().slice(0,4);
                }
            }
            try {
                const result = await api.getStatistics({ supplierId, period, date });
                document.getElementById('statResult').innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h5>统计结果</h5>
                            <p>总笔数：${result.total_count || 0}</p>
                            <p>总金额：¥${(result.total_amount || 0).toFixed(2)}</p>
                            <p>已确认金额：¥${(result.confirmed_amount || 0).toFixed(2)}</p>
                            <p>未确认金额：¥${(result.unconfirmed_amount || 0).toFixed(2)}</p>
                        </div>
                    </div>
                `;
            } catch (err) {
                document.getElementById('statResult').innerHTML = `<div class="alert alert-danger">查询失败</div>`;
            }
        });
    }
};
