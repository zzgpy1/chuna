import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, message, Popconfirm, Card, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { db } from '../db';
import SupplierModal from '../components/SupplierModal';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

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

  const columns = [
    { title: '供应商名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '供应产品', dataIndex: 'products', key: 'products', ellipsis: true },
    { title: '联系人', dataIndex: 'contacts', key: 'contacts', width: 100 },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '操作', key: 'action', width: 150, fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingSupplier(record); setModalVisible(true); }}>编辑</Button>
          <Popconfirm title="确定删除该供应商？" onConfirm={() => handleDelete(record.id)}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card title="供应商管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingSupplier(null); setModalVisible(true); }}>新增供应商</Button>}>
        <Table columns={columns} dataSource={suppliers} rowKey="id" loading={loading} scroll={{ x: 800 }} />
      </Card>
      <SupplierModal visible={modalVisible} onCancel={() => { setModalVisible(false); setEditingSupplier(null); }} onSuccess={loadSuppliers} editingSupplier={editingSupplier} />
    </div>
  );
}

export default Suppliers;
