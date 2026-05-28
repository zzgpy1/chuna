import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Select, DatePicker, message, Card, Modal, Form, InputNumber, Input, Radio, Alert, Grid } from 'antd';
import { CheckCircleOutlined, DollarOutlined, DeleteOutlined } from '@ant-design/icons';
import { db } from '../db';
import dayjs from 'dayjs';

const { Option } = Select;
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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

  const handleDeletePayment = async (id, payment) => {
    if (payment.confirmed) {
      message.warning('已确认的付款单不能删除');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: '删除后将恢复关联入库单的未付金额，确定删除吗？',
      onOk: async () => {
        setLoading(true);
        try {
          if (payment.purchaseId) {
            const purchase = await db.purchases.get(payment.purchaseId);
            if (purchase) {
              const newPaid = purchase.paidAmount - payment.amount;
              let status = 'unpaid';
              if (newPaid > 0) status = 'partial';
              if (newPaid >= purchase.amount) status = 'paid';
              await db.purchases.update(payment.purchaseId, { paidAmount: Math.max(0, newPaid), status });
            }
          }
          await db.payments.delete(id);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.error('删除失败：' + error.message);
        } finally {
          setLoading(false);
        }
      }
    });
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
    { title: '供应商', dataIndex: 'supplierName', ellipsis: true, width: isMobile ? 80 : undefined },
    { title: '金额', dataIndex: 'amount', render: v => `¥${v.toLocaleString()}`, width: isMobile ? 80 : undefined },
    { title: '账户', dataIndex: 'accountName', responsive: ['sm'] },
    { title: '类型', dataIndex: 'type', render: v => <Tag color={v === 'prepayment' ? 'blue' : 'green'} size="small">{isMobile ? (v === 'prepayment' ? '预' : '后') : (v === 'prepayment' ? '预付款' : '后付款')}</Tag>, width: isMobile ? 50 : undefined },
    { title: '日期', dataIndex: 'paymentDate', render: v => isMobile ? dayjs(v).format('MM-DD') : dayjs(v).format('YYYY-MM-DD'), width: isMobile ? 70 : undefined },
    { title: '状态', dataIndex: 'confirmed', render: v => <Tag color={v ? 'success' : 'warning'} size="small">{v ? (isMobile ? '✓' : '已打款') : (isMobile ? '待' : '待确认')}</Tag>, width: isMobile ? 50 : undefined },
    { 
      title: '操作', 
      width: isMobile ? 100 : 150, 
      fixed: isMobile ? 'right' : undefined,
      render: (_, r) => (
        <Space size={isMobile ? 'small' : 'middle'}>
          {!r.confirmed && (
            <>
              <Button type="link" size={isMobile ? 'small' : 'middle'} icon={<CheckCircleOutlined />} onClick={() => handleConfirm(r.id)}>{!isMobile && '确认'}</Button>
              <Button type="link" size={isMobile ? 'small' : 'middle'} danger icon={<DeleteOutlined />} onClick={() => handleDeletePayment(r.id, r)}>{!isMobile && '删除'}</Button>
            </>
          )}
          {r.confirmed && isMobile && <span>✓</span>}
          {r.confirmed && !isMobile && <span>已确认</span>}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card title="付款管理" size={isMobile ? 'small' : 'default'} extra={<Button type="primary" size={isMobile ? 'small' : 'middle'} icon={<DollarOutlined />} onClick={() => setModalVisible(true)}>{isMobile ? '新增' : '新增付款'}</Button>}>
        <Table columns={columns} dataSource={payments} rowKey="id" loading={loading} scroll={{ x: isMobile ? 600 : 1000 }} size={isMobile ? 'small' : 'middle'} pagination={{ pageSize: isMobile ? 10 : 20, size: isMobile ? 'small' : 'default' }} />
      </Card>
      <Modal title="新增付款单" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={isMobile ? '95%' : 550}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}><Select placeholder="选择供应商" onChange={onSupplierChange}>{suppliers.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select></Form.Item>
          <Form.Item name="purchaseId" label="关联入库单" rules={[{ required: true }]}><Select placeholder="选择待付款入库单" disabled={!selectedSupplier}>{availablePurchases.map(p => <Option key=
