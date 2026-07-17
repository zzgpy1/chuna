-- 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    products TEXT,               -- 供应产品，逗号分隔
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 账户表
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,          -- 账户名称，如“工行对公”
    type TEXT NOT NULL,          -- 'public' 或 'private'
    account_no TEXT,
    bank_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 付款记录表
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    account_id INTEGER,
    payment_type TEXT NOT NULL,  -- 'prepaid' 预付款, 'postpaid' 后付款
    amount REAL NOT NULL,        -- 实付金额
    stock_amount REAL,           -- 入库金额（可为空）
    is_confirmed INTEGER DEFAULT 0, -- 0未确认 1已确认
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remark TEXT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- 创建索引加速查询
CREATE INDEX idx_payments_supplier ON payments(supplier_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_confirmed ON payments(is_confirmed);
