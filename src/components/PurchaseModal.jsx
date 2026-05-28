import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, InputNumber, DatePicker, Button, message } from 'antd';
import { db } from '../db';
import dayjs from 'dayjs';

const { Option } = Select;

function PurchaseModal({ visible, onCancel, onSuccess, editingPurchase }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    db.suppliers.toArray().then(setSuppliers);
    if (editingPurchase) form.setFieldsValue({ ...editingPurchase, purchaseDate: dayjs(editingPurchase.purchaseDate) });
    else form.resetFields();
  }, [editingPurchase, visible]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const newPurchase = { ...values, purchaseDate: values.purchaseDate?.toDate() || new Date(), paidAmount: editingPurchase?.paidAmount || 0, status: editingPurchase?.status || 'unpaid' };
      if (editingPurchase) await db.purchases.update(editingPurchase.id, newPurchase);
      else await db.purchases.add(newPurchase);
      message.success(editingPurchase ? '更新成功' : '添加成功');
      onSuccess();
      onCancel();
    } finally { setLoading(false); }
  };

  return (
    <Modal title={editingPurchase ? "编辑入库单" : "新增入库单"} open={visible} onCancel={onCancel} footer={null} width={500}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}><Select placeholder="选择供应商">{suppliers.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select></Form.Item>
        <Form.Item name="invoiceNo" label="入库单号" rules={[{ required: true }]}><Input placeholder="PO-2025-001" /></Form.Item>
        <Form.Item name="amount" label="入库金额" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0.01} step={100} placeholder="金额" prefix="¥" /></Form.Item>
        <Form.Item name="purchaseDate" label="入库日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item style={{ textAlign: 'right' }}><Button onClick={onCancel}>取消</Button><Button type="primary" htmlType="submit" loading={loading} style={{ marginLeft: 8 }}>保存</Button></Form.Item>
      </Form>
    </Modal>
  );
}
export default PurchaseModal;
