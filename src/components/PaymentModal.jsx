import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, Radio, DatePicker, Button, message, Alert } from 'antd';
import { db } from '../db';
import dayjs from 'dayjs';

const { Option } = Select;

function PaymentModal({ visible, onCancel, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [availablePurchases, setAvailablePurchases] = useState([]);

  useEffect(() => {
    if (visible) {
      db.suppliers.toArray().then(setSuppliers);
      db.accounts.toArray().then(acc => setAccounts(acc.filter(a => a.isActive)));
      db.purchases.toArray().then(setPurchases);
    }
  }, [visible]);

  const onSupplierChange = (supplierId) => {
    setSelectedSupplier(supplierId);
    const unpaidPurchases = purchases.filter(p => p.supplierId === supplierId && p.amount > p.paidAmount);
    setAvailablePurchases(unpaidPurchases);
    form.setFieldsValue({ purchaseId: undefined });
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (values.purchaseId) {
        const purchase = await db.purchases.get(values.purchaseId);
        const remaining = purchase.amount - purchase.paidAmount;
        if (values.amount > remaining) {
          message.error(`付款金额超过未付金额 (剩余¥${remaining.toLocaleString()})`);
          setLoading(false);
          return;
        }
      }
      await db.payments.add({ ...values, paymentDate: values.paymentDate?.toDate() || new Date(), confirmed: false, confirmDate: null });
      message.success('付款单已创建，请确认打款');
      onSuccess();
      onCancel();
      form.resetFields();
    } finally { setLoading(false); }
  };

  return (
    <Modal title="新增付款单" open={visible} onCancel={onCancel} footer={null} width={550}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}><Select placeholder="选择供应商" onChange={onSupplierChange}>{suppliers.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select></Form.Item>
        <Form.Item name="purchaseId" label="关联入库单" rules={[{ required: true }]}><Select placeholder="选择待付款入库单" disabled={!selectedSupplier}>{availablePurchases.map(p => <Option key={p.id} value={p.id}>单号:{p.invoiceNo} 未付:¥{(p.amount - p.paidAmount).toLocaleString()}</Option>)}</Select></Form.Item>
        <Form.Item name="amount" label="付款金额" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0.01} step={100} placeholder="金额" prefix="¥" /></Form.Item>
        <Form.Item name="type" label="付款类型" rules={[{ required: true }]}><Radio.Group><Radio value="prepayment">预付款</Radio><Radio value="postpayment">后付款</Radio></Radio.Group></Form.Item>
        <Form.Item name="accountId" label="付款账户" rules={[{ required: true }]}><Select placeholder="选择账户">{accounts.map(a => <Option key={a.id} value={a.id}>{a.name}({a.accountNo}) - {a.type === 'public' ? '对公' : '私账'}</Option>)}</Select></Form.Item>
        <Form.Item name="paymentDate" label="付款日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item><Button type="primary" htmlType="submit" loading={loading} block>创建待确认付款单</Button></Form.Item>
      </Form>
      <Alert message="创建后需在列表中点击「确认打款」才生效，同时更新入库单付款状态。" type="info" showIcon />
    </Modal>
  );
}
export default PaymentModal;
