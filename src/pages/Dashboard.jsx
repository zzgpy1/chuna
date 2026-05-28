import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Spin, Tag } from 'antd';
import { DollarOutlined, ShoppingOutlined, TeamOutlined, BankOutlined } from '@ant-design/icons';
import { db } from '../db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import dayjs from 'dayjs';

const { Title } = Typography;

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ supplierCount: 0, purchaseTotal: 0, paidTotal: 0, unpaidTotal: 0, accountTotal: 0 });
  const [recentPayments, setRecentPayments] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const suppliers = await db.suppliers.toArray();
      const purchases = await db.purchases.toArray();
      const payments = await db.payments.where('confirmed').equals(1).toArray();
      const accounts = await db.accounts.toArray();
      const purchaseTotal = purchases.reduce((sum, p) => sum + p.amount, 0);
      const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
      setStats({
        supplierCount: suppliers.length,
        purchaseTotal,
        paidTotal,
        unpaidTotal: Math.max(0, purchaseTotal - paidTotal),
        accountTotal: accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
      });
      const recent = await db.payments.where('confirmed').equals(1).reverse().limit(5).toArray();
      const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));
      setRecentPayments(recent.map(p => ({ ...p, supplierName: supplierMap.get(p.supplierId) || '未知' })));
      const currentYear = new Date().getFullYear();
      const monthlyStats = {};
      for (let i = 1; i <= 12; i++) monthlyStats[i] = { purchase: 0, payment: 0 };
      purchases.forEach(p => { if (dayjs(p.purchaseDate).year() === currentYear) monthlyStats[dayjs(p.purchaseDate).month() + 1].purchase += p.amount; });
      payments.forEach(p => { if (p.confirmed && dayjs(p.paymentDate).year() === currentYear) monthlyStats[dayjs(p.paymentDate).month() + 1].payment += p.amount; });
      setMonthlyData(Object.entries(monthlyStats).map(([month, data]) => ({ month: `${month}月`, 入库金额: data.purchase, 付款金额: data.payment })));
      const supplierPayable = new Map();
      purchases.forEach(p => {
        const paid = payments.filter(pay => pay.purchaseId === p.id && pay.confirmed).reduce((sum, pay) => sum + pay.amount, 0);
        const unpaid = p.amount - paid;
        if (unpaid > 0) supplierPayable.set(p.supplierId, (supplierPayable.get(p.supplierId) || 0) + unpaid);
      });
      setSupplierData(Array.from(supplierPayable.entries()).map(([id, amount]) => ({ name: supplierMap.get(id) || `ID:${id}`, value: amount })));
    } finally { setLoading(false); }
  };

  const columns = [
    { title: '供应商', dataIndex: 'supplierName' },
    { title: '金额', dataIndex: 'amount', render: v => `¥${v.toLocaleString()}` },
    { title: '付款日期', dataIndex: 'paymentDate', render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: '类型', dataIndex: 'type', render: v => <Tag color={v === 'prepayment' ? 'blue' : 'green'}>{v === 'prepayment' ? '预付款' : '后付款'}</Tag> }
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) return <Spin size="large" />;
  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>数据仪表盘</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="供应商数量" value={stats.supplierCount} prefix={<TeamOutlined />} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="入库总额" value={stats.purchaseTotal} prefix={<ShoppingOutlined />} suffix="元" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="已付总额" value={stats.paidTotal} prefix={<DollarOutlined />} suffix="元" valueStyle={{ color: '#722ed1' }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="应付余额" value={stats.unpaidTotal} prefix={<DollarOutlined />} suffix="元" valueStyle={{ color: '#faad14' }} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}><Card title="月度趋势 (本年)"><ResponsiveContainer width="100%" height={300}><BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(value) => `¥${value.toLocaleString()}`} /><Legend /><Bar dataKey="入库金额" fill="#1677ff" /><Bar dataKey="付款金额" fill="#52c41a" /></BarChart></ResponsiveContainer></Card></Col>
        <Col xs={24} lg={10}><Card title="应付账款分布"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={supplierData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">{supplierData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => `¥${value.toLocaleString()}`} /></PieChart></ResponsiveContainer></Card></Col>
      </Row>
      <Card title="最近付款记录" style={{ marginTop: 24 }}><Table dataSource={recentPayments} columns={columns} rowKey="id" pagination={false} size="small" /></Card>
    </div>
  );
}
export default Dashboard;
