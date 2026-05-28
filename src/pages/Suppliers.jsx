import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, message, Card, Modal, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { db } from '../db';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    const data = await db.suppliers.reverse().toArray();
    setSuppliers(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await db.suppliers.delete(id);
    message.success('删除成功');
    loadSuppliers();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingSupplier) {
      await db.suppliers.update(editingSupplier.id, { ...values, updatedAt: new Date() });
      message.success('更新成功');
    } else {
      await db.suppliers.add({ ...values, createdAt: new Date() });
      message.success('添加成功');
    }
    setModalVisible(false);
    form.resetFields();
    loadSuppliers();
  };

  const columns = [
    { title: '供应商名称', dataIndex: 'name', width: 150 },
    { title: '供应产品', dataIndex: 'products' },
    { title: '联系人', dataIndex: 'contacts', width: 100 },
    { title: '联系电话', dataIndex: 'phone', width: 130 },
    { title: '备注', dataIndex: 'remark' },
    { title: '操作', width: 150, render: (_, record) => (<Space><Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingSupplier(record); form.setFieldsValue(record); setModalVisible(true); }}>编辑</Button><Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm></Space>) }
  ];

  return (
    <div>
      <Card title="供应商管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingSupplier(null); form.resetFields(); setModalVisible(true); }}>新增供应商</Button>}>
        <Table columns={columns} dataSource={suppliers} rowKey="id" loading={loading} scroll={{ x: 800 }} />
      </Card>
      <Modal title={editingSupplier ? "编辑供应商" : "新增供应商"} open={modalVisible} onCancel={() => { setModalVisible(false); setEditingSupplier(null); form.resetFields(); }} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="供应商名称" rules={[{ required: true }]}><Input placeholder="例：宏达电子" /></Form.Item>
          <Form.Item name="products" label="供应产品" rules={[{ required: true }]}><Input placeholder="芯片,电阻,电容" /></Form.Item>
          <Form.Item name="contacts" label="联系人"><Input /></Form.Item>
          <Form.Item name="phone" label="联系电话"><Input /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item style={{ textAlign: 'right' }}><Button onClick={() => setModalVisible(false)}>取消</Button><Button type="primary" htmlType="submit" style={{ marginLeft: 8 }}>保存</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
export default Suppliers;
