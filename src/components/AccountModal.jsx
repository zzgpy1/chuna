import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Radio, Switch, Button, message } from 'antd';
import { db } from '../db';

function AccountModal({ visible, onCancel, onSuccess, editingAccount }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (editingAccount) form.setFieldsValue(editingAccount);
    else form.resetFields();
  }, [editingAccount, visible]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (editingAccount) await db.accounts.update(editingAccount.id, values);
      else await db.accounts.add(values);
      message.success(editingAccount ? '更新成功' : '添加成功');
      onSuccess();
      onCancel();
    } finally { setLoading(false); }
  };

  return (
    <Modal title={editingAccount ? "编辑账户" : "新增账户"} open={visible} onCancel={onCancel} footer={null}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="name" label="账户名称" rules={[{ required: true }]}><Input placeholder="例：建设银行对公户" /></Form.Item>
        <Form.Item name="accountNo" label="银行账号" rules={[{ required: true }]}><Input placeholder="卡号/账号" /></Form.Item>
        <Form.Item name="bankName" label="开户行"><Input placeholder="银行名称" /></Form.Item>
        <Form.Item name="type" label="账户类型" rules={[{ required: true }]}><Radio.Group><Radio value="public">对公账户</Radio><Radio value="private">私用账户</Radio></Radio.Group></Form.Item>
        <Form.Item name="balance" label="初始余额"><InputNumber style={{ width: '100%' }} min={0} step={1000} placeholder="当前余额" /></Form.Item>
        <Form.Item name="isActive" label="启用状态" valuePropName="checked"><Switch defaultChecked /></Form.Item>
        <Form.Item><Button type="primary" htmlType="submit" loading={loading} block>保存</Button></Form.Item>
      </Form>
    </Modal>
  );
}
export default AccountModal;
