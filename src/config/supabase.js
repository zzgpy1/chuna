import { createClient } from '@supabase/supabase-js';

// 请在 https://supabase.com 注册并创建项目后获取
// 这些值需要通过 GitHub Secrets 注入，或直接在 Supabase 控制台配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 表结构定义（需要在 Supabase SQL Editor 中执行）
export const initSupabaseTables = async () => {
  // 这个函数仅供参考，实际需要在 Supabase 控制台执行 SQL
  console.log('请在 Supabase SQL Editor 中执行以下 SQL：');
  console.log(`
-- 供应商表
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  products TEXT,
  contacts VARCHAR(100),
  phone VARCHAR(50),
  remark TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 入库单表
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  invoice_no VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'unpaid',
  purchase_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 付款记录表
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  purchase_id INTEGER REFERENCES purchases(id),
  amount DECIMAL(12,2) NOT NULL,
  type VARCHAR(20) DEFAULT 'postpayment',
  account_id INTEGER REFERENCES accounts(id),
  payment_date DATE NOT NULL,
  confirmed BOOLEAN DEFAULT FALSE,
  confirm_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 账户表
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  account_no VARCHAR(50) NOT NULL,
  bank_name VARCHAR(100),
  type VARCHAR(20) DEFAULT 'public',
  balance DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
  `);
};
