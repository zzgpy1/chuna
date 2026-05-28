import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Button, Table, Statistic, Radio, message, Typography } from 'antd';
import { SearchOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons';
import { db } from '../db';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title } = Typography;

function Reports() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [queryType, setQueryType] = useState('month');
  const [customRange, setCustomRange] = useState(null);
  const [result, setResult] = useState({ payments: [], total: 0, purchasesTotal: 0, unpaidTotal: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => { db.suppliers.toArray().then(setSuppliers); }, []);

  const getDateRange = () => {
    if (queryType === 'day') return { start: dayjs().startOf('day').toDate(), end: dayjs().endOf('day').toDate() };
    if (queryType === 'month') return { start: dayjs().startOf('month').toDate(), end: dayjs().endOf('month').toDate() };
    if (queryType === 'year') return { start: dayjs().startOf('year').toDate(), end: dayjs().endOf('year').toDate() };
    if (queryType === 'custom' && customRange) return { start: customRange[0].toDate(), end: customRange[1].toDate() };
    return null;
  };

  const handleQuery = async () => {
    const range = getDateRange();
    if (!range && queryType === 'custom') { message.warning('请选择日期范围'); return; }
    setLoading(true);
    try {
      let paymentsQuery = db.payments.where('confirmed').equals(1);
      let purchasesQuery = db.purchases;
      if (selectedSupplier) { paymentsQuery = paymentsQuery.and(p => p.supplierId === selectedSupplier); purchasesQuery = purchasesQuery.and(p => p.supplierId === selectedSupplier); }
      let payments = await paymentsQuery.toArray();
      let purchases = await purchasesQuery.toArray();
      if (range) {
        payments = payments.filter(p => dayjs(p.paymentDate).isBetween(range.start, range.end, null, '[]'));
        purchases = purchases.filter(p => dayjs(p.purchaseDate).isBetween(range.start, range.end, null, '[]'));
      }
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const purchasesTotal = purchases.reduce((sum, p) => sum + p.amount, 0);
      const totalPaidForPurchases = payments.filter(p => p.purchaseId).reduce((sum, p) => sum + p.amount, 0);
      const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));
      setResult({ payments: payments.map(p => ({ ...p, supplierName: supplierMap.get(p.supplierId) || '未知' })), total: totalPaid, purchasesTotal, unpaidTotal: Math.max(0, purchasesTotal - totalPaidForPurchases) });
    } finally { setLoading(false); }
  };

  const columns = [
    { title: '供应商', dataIndex: 'supplierName' },
    { title: '金额', dataIndex: 'amount', render: v => `¥${v.toLocaleString()}` },
    { title: '类型', dataIndex: 'type', render: v => v === 'prepayment' ? '预付款' : '后付款' },
    { title: '付款日期', dataIndex: 'paymentDate', render: v => dayjs(v).format('YYYY-MM-DD') },
  ];

  return (
    <div>
      <Title level={3}>付款统计报表</Title>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}><Select placeholder="选择供应商 (可选)" allowClear style={{ width: '100%' }} onChange={setSelectedSupplier}><Select.Option value={null}>全部供应商</Select.Option>{suppliers.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}</Select></Col>
          <Col span={6}><Radio.Group value={queryType} onChange={e => setQueryType(e.target.value)}><Radio.Button value="day">日</Radio.Button><Radio.Button value="month">月</Radio.Button><Radio.Button value="year">年</Radio.Button><Radio.Button value="custom">自定义</Radio.Button></Radio.Group></Col>
          <Col span={8}>{queryType === 'custom' && <RangePicker onChange={setCustomRange} style={{ width: '100%' }} />}</Col>
          <Col span={4}><Button type="primary" icon={<SearchOutlined />} onClick={handleQuery} loading={loading} block>查询</Button></Col>
        </Row>
      </Card>
      {result.payments.length > 0 && (<><Row gutter={16} style={{ marginBottom: 24 }}><Col span={8}><Card><Statistic title="付款总额" value={result.total} prefix="¥" precision={2} valueStyle={{ color: '#52c41a' }} /></Card></Col><Col span={8}><Card><Statistic title="入库总额" value={result.purchasesTotal} prefix="¥" precision={2} valueStyle={{ color: '#1677ff' }} /></Card></Col><Col span={8}><Card><Statistic title="未付金额" value={result.unpaidTotal} prefix="¥" precision={2} valueStyle={{ color: '#faad14' }} /></Card></Col></Row><Table columns={columns} dataSource={result.payments} rowKey="id" pagination={{ pageSize: 10 }} /></>)}
      {result.payments.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据，请调整查询条件</div>}
    </div>
  );
}
export default Reports;
