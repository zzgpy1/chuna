import Dexie from 'dexie';

export const db = new Dexie('CashierDB');
db.version(1).stores({
  suppliers: '++id, name, createdAt',
  purchases: '++id, supplierId, invoiceNo, amount, paidAmount, status, purchaseDate, notes',
  payments: '++id, supplierId, purchaseId, amount, type, accountId, paymentDate, confirmed, confirmDate, notes',
  accounts: '++id, name, accountNo, bankName, type, balance, isActive'
});

// 不再自动添加任何示例数据，保持数据库完全由用户控制
export async function initSampleData() {
  // 此函数保留但不执行任何操作，避免自动填充测试数据
  console.log('数据库已就绪，不会自动添加示例数据');
}
