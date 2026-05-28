import Dexie from 'dexie';

export const db = new Dexie('CashierDB');
db.version(1).stores({
  suppliers: '++id, name, createdAt',
  purchases: '++id, supplierId, invoiceNo, amount, paidAmount, status, purchaseDate, notes',
  payments: '++id, supplierId, purchaseId, amount, type, accountId, paymentDate, confirmed, confirmDate, notes',
  accounts: '++id, name, accountNo, bankName, type, balance, isActive'
});

export async function initSampleData() {
  // 不自动添加示例数据
  console.log('数据库已就绪');
}
