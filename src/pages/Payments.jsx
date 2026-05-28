import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Select, DatePicker, message, Card, Modal, Form, InputNumber, Input, Radio, Alert } from 'antd';
import { CheckCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { db } from '../db';
import dayjs from 'dayjs';

const { Option } = Select;

function Payments() {
  const [payments, setPayments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [availablePurchases, setAvailablePurchases] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const supList = await db.suppliers.toArray();
    const accList = await db.accounts.toArray();
    const purList = await db.purchases.toArray();
    const payList = await db.payments.reverse().toArray();
    setSuppliers(supList);
    setAccounts(accList.filter(a => a.isActive));
    setPurchases(purList);
    const enriched = payList.map(p => ({ ...p, supplierName: supList.find(s => s.id === p.supplierId)?.name || '未知', accountName: accList.find(a => a.id === p.accountId)?.name || '未知' }));
    setPayments(enriched);
    setLoading(false);
  };

  const handleConfirm = async (id) => {
    const payment = await db.payments.get(id);
    if (!payment || payment.confirmed) return;
    if (payment.purchaseId) {
      const purchase = await db.purchases.get(payment.purchaseId);
      if (purchase) {
        const newPaid = purchase.paidAmount + payment.amount;
        let status = 'partial';
        if (newPaid >= purchase.amount) status = 'paid';
        await db.purchases.update(payment.purchaseId, { paidAmount: newPaid, status });
      }
    }
    await db.payments.update(id, { confirmed: true, confirmDate: new Date() });
    message.success('已确认打款');
    loadData();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (values.purchaseId) {
      const purchase = await db.purchases.get(values.purchaseId);
      const remaining = purchase.amount - purchase.paidAmount;
      if (values.amount > remaining) {
        message.error(`付款金额超过未付金额 (剩余¥${remaining.toLocaleString()})`);
        return;
      }
    }
    await db.payments.add({ ...values, paymentDate: values.paymentDate?.toDate() || new Date(), confirmed: false, confirmDate: null });
    message.success('付款单已创建，请确认打款');
    setModalVisible(false);
    form.resetFields();
    loadData();
  };

  const onSupplierChange = (supplierId) => {
    setSelectedSupplier(supplierId);
    const unpaidPurchases = purchases.filter(p => p.supplierId === supplierId && p.amount > p.paidAmount);
    setAvailablePurchases(unpaidPurchases);
    form.setFieldsValue({ purchaseId: undefined });
  };

  const columns = [
    { title: '供应商', dataIndex: 'supplierName' },
    { title: '金额', dataIndex: 'amount', render: v => `¥${v.toLocaleString()}` },
    { title: '付款账户', dataIndex: 'accountName' },
    { title: '类型', dataIndex: 'type', render: v => <Tag color={v === 'prepayment' ? 'blue' : 'green'}>{v === 'prepayment' ? '预付款' : '后付款'}</Tag> },
    { title: '付款日期', dataIndex: 'paymentDate', render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: '状态', dataIndex: 'confirmed', render: v => v ? <Tag color="success">已打款</Tag> : <Tag color="warning">待确认</Tag> },
    { title: '操作', render: (_, r) => !r.confirmed && <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleConfirm(r.id)}>确认打款</Button> }
  ];

  return (
    <div>
      <Card title="付款管理" extra={<Button type="primary" icon={<DollarOutlined />} onClick={() => setModalVisible(true)}>新增付款</Button>}>
        <Table columns={columns} dataSource={payments} rowKey="id" loading={loading} scroll={{ x: 1000 }} />
      </Card>
      <Modal title="新增付款单" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={550}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}><Select placeholder="选择供应商" onChange={onSupplierChange}>{suppliers.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select></Form.Item>
          <Form.Item name="purchaseId" label="关联入库单" rules={[{ required: true }]}><Select placeholder="选择待付款入库单" disabled={!selectedSupplier}>{availablePurchases.map(p => <Option key={p.id} value={p.id}>单号:{p.invoiceNo} 未付:¥{(p.amount - p.paidAmount).toLocaleString()}</Option>)}</Select></Form.Item>
          <Form.Item name="amount" label="付款金额" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0.01} step={100} placeholder="金额" prefix="¥" /></Form.Item>
          <Form.Item name="type" label="付款类型" rules={[{ required: true }]}><Radio.Group><Radio value="prepayment">预付款</Radio><Radio value="postpayment">后付款</Radio></Radio.Group></Form.Item>
          <Form.Item name="accountId" label="付款账户" rules={[{ required: true }]}><Select placeholder="选择账户">{accounts.map(a => <Option key={a.id} value={a.id}>{a.name}({a.accountNo}) - {a.type === 'public' ? '对公' : '私账'}</Option>)}</Select></Form.Item>
          <Form.Item name="paymentDate" label="付款日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block>创建待确认付款单</Button></Form.Item>
        </Form>
        <Alert message="创建后需在列表中点击「确认打款」才生效，同时更新入库单付款状态。" type="info" showIcon />
      </Modal>
    </div>
  );
}
export default Payments;
