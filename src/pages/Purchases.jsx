import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, DatePicker, message, Popconfirm, Card, Modal, Form, InputNumber, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DollarOutlined } from '@ant-design/icons';
import { db } from '../db';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ supplierId: null, dateRange: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const supList = await db.suppliers.toArray();
    setSuppliers(supList);
    let purchaseList = await db.purchases.reverse().toArray();
    // 关联供应商名称
    purchaseList = purchaseList.map(p => ({ ...p, supplierName: supList.find(s => s.id === p.supplierId)?.name || '未知' }));
    setPurchases(purchaseList);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await db.purchases.delete(id);
    message.success('删除成功');
    loadData();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const newPurchase = {
      ...values,
      purchaseDate: values.purchaseDate?.toDate() || new Date(),
      paidAmount: 0,
      status: 'unpaid'
    };
    if (editing) {
      await db.purchases.update(editing.id, newPurchase);
      message.success('更新成功');
    } else {
      await db.purchases.add(newPurchase);
      message.success('添加入库单成功');
    }
    setModalVisible(false);
    form.resetFields();
    loadData();
  };

  const statusMap = { unpaid: '未付款', partial: '部分付款', paid: '已付清' };
  const statusColor = { unpaid: 'red', partial: 'orange', paid: 'green' };

  const columns = [
    { title: '入库单号', dataIndex: 'invoiceNo', key: 'invoiceNo', width: 150 },
    { title: '供应商', dataIndex: 'supplierName', key: 'supplierName' },
    { title: '入库金额', dataIndex: 'amount', key: 'amount', render: v => `¥${v.toLocaleString()}` },
    { title: '已付金额', dataIndex: 'paidAmount', key: 'paidAmount', render: v => `¥${v.toLocaleString()}` },
    { title: '未付金额', key: 'unpaid', render: (_, r) => `¥${(r.amount - r.paidAmount).toLocaleString()}` },
    { title: '状态', dataIndex: 'status', render: v => <Tag color={statusColor[v]}>{statusMap[v]}</Tag> },
    { title: '入库日期', dataIndex: 'purchaseDate', render: v => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '操作', fixed: 'right', width: 120,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue({ ...r, purchaseDate: dayjs(r.purchaseDate) }); setModalVisible(true); }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card title="入库单管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增入库单</Button>}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select placeholder="筛选供应商" allowClear style={{ width: 180 }} onChange={v => setFilters({ ...filters, supplierId: v })}><Option value="">全部</Option>{suppliers.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select>
          <RangePicker onChange={(dates) => setFilters({ ...filters, dateRange: dates })} />
          <Button icon={<SearchOutlined />} onClick={() => loadData()}>查询</Button>
        </Space>
        <Table columns={columns} dataSource={purchases.filter(p => (!filters.supplierId || p.supplierId === filters.supplierId) && (!filters.dateRange || (dayjs(p.purchaseDate).isAfter(filters.dateRange[0]) && dayjs(p.purchaseDate).isBefore(filters.dateRange[1]))))} rowKey="id" loading={loading} scroll={{ x: 1000 }} />
      </Card>
      <Modal title={editing ? "编辑入库单" : "新增入库单"} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}><Select placeholder="选择供应商">{suppliers.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select></Form.Item>
          <Form.Item name="invoiceNo" label="入库单号" rules={[{ required: true }]}><Input placeholder="PO-2025-001" /></Form.Item>
          <Form.Item name="amount" label="入库金额" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0.01} step={100} placeholder="金额" prefix="¥" /></Form.Item>
          <Form.Item name="purchaseDate" label="入库日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}><Button onClick={() => setModalVisible(false)}>取消</Button><Button type="primary" htmlType="submit" style={{ marginLeft: 8 }}>保存</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Purchases;
