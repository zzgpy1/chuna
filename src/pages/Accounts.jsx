import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Popconfirm, message, Card, Modal, Form, Input, InputNumber, Radio, Switch, Grid } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { db } from '../db';

const { useBreakpoint } = Grid;

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    setLoading(true);
    const data = await db.accounts.toArray();
    setAccounts(data);
    setLoading(false);
  };

  const handleDelete = async (id) => { await db.accounts.delete(id); message.success('删除成功'); loadAccounts(); };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) await db.accounts.update(editing.id, values);
    else await db.accounts.add(values);
    message.success(editing ? '更新成功' : '添加成功');
    setModalVisible(false);
    loadAccounts();
  };

  const columns = [
    { title: '账户名称', dataIndex: 'name', ellipsis: true, width: isMobile ? 100 : undefined },
    { title: '账号', dataIndex: 'accountNo', ellipsis: true, responsive: ['sm'] },
    { title: '开户行', dataIndex: 'bankName', responsive: ['md'] },
    { title: '类型', dataIndex: 'type', render: v => <Tag color={v === 'public' ? 'blue' : 'green'} size="small">{v === 'public' ? '对公' : '私账'}</Tag>, width: isMobile ? 50 : undefined },
    { title: '余额', dataIndex: 'balance', render: v => `¥${v?.toLocaleString() || 0}`, width: isMobile ? 80 : undefined },
    { title: '状态', dataIndex: 'isActive', render: v => v ? <Tag color="success" size="small">启用</Tag> : <Tag size="small">禁用</Tag>, width: isMobile ? 50 : undefined },
    { 
      title: '操作', 
      width: isMobile ? 80 : 150, 
      fixed: isMobile ? 'right' : undefined,
      render: (_, r) => (
        <Space size={isMobile ? 'small' : 'middle'}>
          <Button type="link" size={isMobile ? 'small' : 'middle'} icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalVisible(true); }}>{!isMobile && '编辑'}</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}><Button type="link" size={isMobile ? 'small' : 'middle'} danger icon={<DeleteOutlined />}>{!isMobile && '删除'}</Button></Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card title="资金账户管理" size={isMobile ? 'small' : 'default'} extra={<Button type="primary" size={isMobile ? 'small' : 'middle'} icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>{isMobile ? '添加' : '添加账户'}</Button>}>
        <Table columns={columns} dataSource={accounts} rowKey="id" loading={loading} scroll={{ x: isMobile ? 500 : undefined }} size={isMobile ? 'small' : 'middle'} pagination={{ pageSize: isMobile ? 10 : 20, size: isMobile ? 'small' : 'default' }} />
      </Card>
      <Modal title={editing ? "编辑账户" : "新增账户"} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={isMobile ? '95%' : 500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="账户名称" rules={[{ required: true }]}><Input placeholder="例：建设银行对公户" /></Form.Item>
          <Form.Item name="accountNo" label="银行账号" rules={[{ required: true }]}><Input placeholder="卡号/账号" /></Form.Item>
          <Form.Item name="bankName" label="开户行"><Input placeholder="银行名称" /></Form.Item>
          <Form.Item name="type" label="账户类型" rules={[{ required: true }]}><Radio.Group><Radio value="public">对公账户</Radio><Radio value="private">私用账户</Radio></Radio.Group></Form.Item>
          <Form.Item name="balance" label="初始余额"><InputNumber style={{ width: '100%' }} min={0} step={1000} placeholder="当前余额" /></Form.Item>
          <Form.Item name="isActive" label="启用状态" valuePropName="checked"><Switch defaultChecked /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block>保存</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
export default Accounts;
