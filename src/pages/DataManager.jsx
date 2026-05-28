import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Space, message, Modal, Alert, Upload } from 'antd';
import { DeleteOutlined, ExportOutlined, ImportOutlined, WarningOutlined } from '@ant-design/icons';
import { db } from '../db';

function DataManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 导出全部数据
  const exportData = async () => {
    setLoading(true);
    try {
      const suppliers = await db.suppliers.toArray();
      const purchases = await db.purchases.toArray();
      const payments = await db.payments.toArray();
      const accounts = await db.accounts.toArray();
      const exportObj = { suppliers, purchases, payments, accounts, version: '1.0', exportTime: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cashier_backup_${new Date().toISOString().slice(0,19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('数据导出成功');
    } catch (error) {
      message.error('导出失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 导入数据（覆盖）
  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      setLoading(true);
      try {
        const data = JSON.parse(e.target.result);
        if (!data.suppliers || !data.purchases || !data.payments || !data.accounts) {
          throw new Error('无效的备份文件格式');
        }
        await db.suppliers.clear();
        await db.purchases.clear();
        await db.payments.clear();
        await db.accounts.clear();
        if (data.suppliers.length) await db.suppliers.bulkAdd(data.suppliers);
        if (data.purchases.length) await db.purchases.bulkAdd(data.purchases);
        if (data.payments.length) await db.payments.bulkAdd(data.payments);
        if (data.accounts.length) await db.accounts.bulkAdd(data.accounts);
        message.success('数据导入成功，即将跳转至仪表盘');
        navigate('/dashboard');
      } catch (error) {
        message.error('导入失败：' + error.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // 清空数据
  const clearAllData = async (keepAccounts = false) => {
    setLoading(true);
    try {
      await db.suppliers.clear();
      await db.purchases.clear();
      await db.payments.clear();
      if (!keepAccounts) await db.accounts.clear();
      message.success(keepAccounts ? '已清空业务数据，账户信息已保留' : '所有数据已清空');
      navigate('/dashboard');
    } catch (error) {
      message.error('清空失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmClear = () => {
    Modal.confirm({
      title: '警告',
      icon: <WarningOutlined />,
      content: (
        <div>
          <p>此操作将删除所有业务数据（供应商、入库单、付款记录）。</p>
          <p>是否保留账户信息？</p>
        </div>
      ),
      okText: '保留账户',
      cancelText: '完全清空',
      onOk: () => clearAllData(true),
      onCancel: () => clearAllData(false),
    });
  };

  return (
    <div>
      <Card title="数据管理（备份/恢复/清空）" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Alert
          message="注意：导入数据将覆盖当前所有数据，建议先导出备份。清空操作不可恢复！"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space wrap>
            <Button type="primary" icon={<ExportOutlined />} onClick={exportData} loading={loading}>
              导出全部数据（JSON）
            </Button>
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={(file) => {
                importData(file);
                return false;
              }}
            >
              <Button icon={<ImportOutlined />} loading={loading}>导入数据（恢复备份）</Button>
            </Upload>
            <Button danger icon={<DeleteOutlined />} onClick={confirmClear} loading={loading}>
              清空数据
            </Button>
          </Space>
          <Alert message="提示：IndexedDB 数据会长期保存在您的浏览器中，除非手动清除或卸载浏览器。建议定期导出备份。" type="info" showIcon />
        </Space>
      </Card>
    </div>
  );
}

export default DataManager;
