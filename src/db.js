import Dexie from 'dexie';

export const db = new Dexie('CashierDB');
db.version(1).stores({
  suppliers: '++id, name, createdAt',
  purchases: '++id, supplierId, invoiceNo, amount, paidAmount, status, purchaseDate, notes',
  payments: '++id, supplierId, purchaseId, amount, type, accountId, paymentDate, confirmed, confirmDate, notes',
  accounts: '++id, name, accountNo, bankName, type, balance, isActive'
});

// 初始化示例数据
export async function initSampleData() {
  const supplierCount = await db.suppliers.count();
  if (supplierCount === 0) {
    await db.suppliers.bulkAdd([
      { name: '宏达电子', products: '芯片,电阻,电容', contacts: '张经理', phone: '13800138001', remark: '月结30天', createdAt: new Date() },
      { name: '宏远包装', products: '纸箱,气泡膜,胶带', contacts: '李经理', phone: '13800138002', remark: '预付款', createdAt: new Date() }
    ]);
    
    await db.accounts.bulkAdd([
      { name: '建设银行对公账户', accountNo: '6217000010001234567', bankName: '建设银行', type: 'public', balance: 100000, isActive: true },
      { name: '招商银行对公账户', accountNo: '6212000020007654321', bankName: '招商银行', type: 'public', balance: 50000, isActive: true },
      { name: '法人私账-工商银行', accountNo: '6215000030001112222', bankName: '工商银行', type: 'private', balance: 20000, isActive: true }
    ]);
  }
}
