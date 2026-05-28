import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Payments from './pages/Payments';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import DataManager from './pages/DataManager';
import MainLayout from './layouts/MainLayout';
import { isAuthenticated } from './auth';

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 直接完成加载，不调用任何自动初始化
    setLoading(false);
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>;

  return (
    <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm }}>
      <BrowserRouter basename="/">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="payments" element={<Payments />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="reports" element={<Reports />} />
            <Route path="data-manager" element={<DataManager />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
