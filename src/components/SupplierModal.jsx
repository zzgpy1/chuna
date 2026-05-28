import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { db } from '../db';

function SupplierModal({ visible, onCancel, onSuccess, editingSupplier }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (editingSupplier) form.setFieldsValue(editingSupplier);
    else form.resetFields();
  }, [editingSupplier, visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editingSupplier) {
        await db.suppliers.update(editingSupplier.id, { ...values, updatedAt: new Date() });
        message.success('更新成功');
      } else {
        await db.suppliers.add({ ...values, createdAt: new Date() });
        message.success('添加成功');
      }
      onSuccess();
      onCancel();
    } finally { setLoading(false); }
  };

  return (
    <Modal title={editingSupplier ? "编辑供应商" : "新增供应商"} open={visible} onCancel={onCancel} footer={null} width={600}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="name" label="供应商名称" rules={[{ required: true }]}><Input placeholder="例：宏达电子" /></Form.Item>
        <Form.Item name="products" label="供应产品" rules={[{ required: true }]}><Input placeholder="芯片,电阻,电容" /></Form.Item>
        <Form.Item name="contacts" label="联系人"><Input /></Form.Item>
        <Form.Item name="phone" label="联系电话"><Input /></Form.Item>
        <Form.Item name="remark" label="备注"><Input.TextArea rows={3} placeholder="付款条件、账期等" /></Form.Item>
        <Form.Item style={{ textAlign: 'right' }}><Button onClick={onCancel}>取消</Button><Button type="primary" htmlType="submit" loading={loading} style={{ marginLeft: 8 }}>保存</Button></Form.Item>
      </Form>
    </Modal>
  );
}
export default SupplierModal;
