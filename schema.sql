-- 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  products TEXT,
  contact TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 账户表
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'public',  -- public / private
  account_number TEXT,
  bank TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 交易表
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  account_id INTEGER,
  type TEXT DEFAULT 'prepay',   -- prepay / postpay
  transaction_date DATE NOT NULL,
  amount REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  note TEXT,
  status TEXT DEFAULT 'pending', -- pending / paid
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
