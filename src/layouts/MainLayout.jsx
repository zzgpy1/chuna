import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, Avatar, Dropdown, Space, Typography, Badge, Drawer, Button, Grid } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ShoppingOutlined,
  DollarOutlined,
  BankOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { logout } from '../auth';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md; // 小于768px为移动端
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/suppliers', icon: <TeamOutlined />, label: '供应商管理' },
    { key: '/purchases', icon: <ShoppingOutlined />, label: '入库管理' },
    { key: '/payments', icon: <DollarOutlined />, label: '付款管理' },
    { key: '/accounts', icon: <BankOutlined />, label: '账户管理' },
    { key: '/reports', icon: <BarChartOutlined />, label: '报表查询' },
    { key: '/data-manager', icon: <DatabaseOutlined />, label: '数据管理' },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile) setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ],
  };

  // 移动端：抽屉菜单
  const MobileDrawer = () => (
    <Drawer
      title="出纳管理系统"
      placement="left"
      onClose={() => setMobileMenuOpen(false)}
      open={mobileMenuOpen}
      bodyStyle={{ padding: 0 }}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Drawer>
  );

  // PC端侧边栏
  const Sidebar = () => (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={setCollapsed} 
      theme="light" 
      style={{ 
        boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
        position: isMobile ? 'fixed' : 'relative',
        zIndex: 100,
        height: '100vh',
        overflow: 'auto'
      }}
      width={250}
      collapsedWidth={80}
      breakpoint="lg"
      onBreakpoint={(broken) => {
        if (broken) setCollapsed(true);
      }}
    >
      <div style={{ 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderBottom: '1px solid #f0f0f0' 
      }}>
        <Title level={4} style={{ margin: 0, color: '#1677ff' }}>
          {collapsed ? '出纳' : '出纳管理系统'}
        </Title>
      </div>
      <Menu mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={handleMenuClick} />
    </Sider>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && <Sidebar />}
      <Layout>
        <Header style={{ 
          padding: '0 16px', 
          background: colorBgContainer, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}>
          {isMobile && (
            <Button 
              type="text" 
              icon={<MenuOutlined />} 
              onClick={() => setMobileMenuOpen(true)}
              style={{ fontSize: '18px' }}
            />
          )}
          <div style={{ fontSize: isMobile ? '14px' : '16px' }}>欢迎使用出纳管理系统</div>
          <Space size="middle">
            <Badge dot><BellOutlined style={{ fontSize: isMobile ? 16 : 18 }} /></Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} size={isMobile ? 'small' : 'default'} />
                {!isMobile && <span>管理员</span>}
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ 
          margin: isMobile ? '12px 8px' : '24px 16px', 
          padding: isMobile ? 12 : 24, 
          background: colorBgContainer, 
          borderRadius: borderRadiusLG, 
          minHeight: 280 
        }}>
          <Outlet />
        </Content>
      </Layout>
      {isMobile && <MobileDrawer />}
    </Layout>
  );
}

export default MainLayout;
