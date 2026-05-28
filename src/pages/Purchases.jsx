import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Select, DatePicker, message, Popconfirm, Card, Modal, Form, InputNumber, Input, Grid } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { db } from '../db';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ supplierId: null, dateRange: null });
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const supList = await db.suppliers.toArray();
    setSuppliers(supList);
    let purchaseList = await db.purchases.reverse().toArray();
    purchaseList = purchaseList.map(p => ({ ...p, supplierName: supList.find(s => s.id === p.supplierId)?.name || '未知' }));
    setPurchases(purchaseList);
    setLoading(false);
  };

  const handleDelete = async (id) => { await db.purchases.delete(id); message.success('删除成功'); loadData(); };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    const newPurchase = { ...values, purchaseDate: values.purchaseDate?.toDate() || new Date(), paidAmount: 0, status: 'unpaid' };
    if (editing) await db.purchases.update(editing.id, newPurchase);
    else await db.purchases.add(newPurchase);
    message.success(editing ? '更新成功' : '添加成功');
    setModalVisible(false);
    form.resetFields();
    loadData();
  };

  const statusMap = { unpaid: '未付款', partial: '部分付款', paid: '已付清' };
  const statusColor = { unpaid: 'red', partial: 'orange', paid: 'green' };
  
  const columns = [
    { title: '单号', dataIndex: 'invoiceNo', width: isMobile ? 100 : 150, fixed: isMobile ? 'left' : undefined },
    { title: '供应商', dataIndex: 'supplierName', ellipsis: true, width: isMobile ? 80 : undefined },
    { title: '金额', dataIndex: 'amount', render: v => `¥${v.toLocaleString()}`, width: isMobile ? 80 : undefined },
    { title: '已付', dataIndex: 'paidAmount', render: v => `¥${v.toLocaleString()}`, responsive: ['sm'] },
    { title: '未付', render: (_, r) => `¥${(r.amount - r.paidAmount).toLocaleString()}`, responsive: ['sm'] },
    { title: '状态', dataIndex: 'status', render: v => <Tag color={statusColor[v]}>{statusMap[v]}</Tag>, width: isMobile ? 70 : undefined },
    { title: '日期', dataIndex: 'purchaseDate', render: v => isMobile ? dayjs(v).format('MM-DD') : dayjs(v).format('YYYY-MM-DD'), width: isMobile ? 70 : undefined },
    { 
      title: '操作', 
      width: isMobile ? 80 : 120, 
      fixed: isMobile ? 'right' : undefined,
      render: (_, r) => (
        <Space size={isMobile ? 'small' : 'middle'}>
          <Button type="link" size={isMobile ? 'small' : 'middle'} icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue({ ...r, purchaseDate: dayjs(r.purchaseDate) }); setModalVisible(true); }}>{!isMobile && '编辑'}</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}><Button type="link" size={isMobile ? 'small' : 'middle'} danger icon={<DeleteOutlined />}>{!isMobile && '删除'}</Button></Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card title="入库单管理" size={isMobile ? 'small' : 'default'} extra={<Button type="primary" size={isMobile ? 'small' : 'middle'} icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>{isMobile ? '新增' : '新增入库单'}</Button>}>
        <Space style={{ marginBottom: 16 }} wrap size={isMobile ? 'small' : 'middle'}>
          <Select placeholder="筛选供应商" allowClear style={{ width: isMobile ? 120 : 180 }} size={isMobile ? 'small' : 'middle'} onChange={v => setFilters({ ...filters, supplierId: v })}>
            <Option value="">全部</Option>{suppliers.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
          </Select>
          <RangePicker size={isMobile ? 'small' : 'middle'} onChange={(dates) => setFilters({ ...filters, dateRange: dates })} />
          <Button icon={<SearchOutlined />} size={isMobile ? 'small' : 'middle'} onClick={loadData}>查询</Button>
        </Space>
        <Table columns={columns} dataSource={purchases.filter(p => (!filters.supplierId || p.supplierId === filters.supplierId) && (!filters.dateRange || (dayjs(p.purchaseDate).isAfter(filters.dateRange[0]) && dayjs(p.purchaseDate).isBefore(filters.dateRange[1]))))} rowKey="id" loading={loading} scroll={{ x: isMobile ? 700 : 1000 }} size={isMobile ? 'small' : 'middle'} pagination={{ pageSize: isMobile ? 10 : 20, size: isMobile ? 'small' : 'default' }} />
      </Card>
      <Modal title={editing ? "编辑入库单" : "新增入库单"} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={isMobile ? '95%' : 500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}><Select placeholder="选择供应商">{suppliers.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select></Form.Item>
          <Form.Item name="invoiceNo" label="入库单号" rules={[{ required: true }]}><Input placeholder="PO-2025-001" /></Form.Item>
          <Form.Item name="amount" label="入库金额" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0.01} step={100} placeholder="金额" prefix="¥" /></Form.Item>
          <Form.Item name="purchaseDate" label="入库日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ textAlign: 'right' }}><Button onClick={() => setModalVisible(false)}>取消</Button><Button type="primary" htmlType="submit" style={{ marginLeft: 8 }}>保存</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
export default Purchases;
