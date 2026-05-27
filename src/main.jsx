// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Ant Design v5 不需要单独引入 reset.css，改为引入完整样式
import 'antd/dist/reset.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
