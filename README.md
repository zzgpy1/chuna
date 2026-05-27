# 出纳管理系统 · 安全加密版

本系统通过 GitHub Actions + Staticrypt 实现**密码不暴露在代码中**的部署方案。  
密码存储在 GitHub Secrets 中，部署后的页面需要输入密码才能访问。

## 🔐 部署前准备

1. **创建 GitHub 仓库**（公开或私有均可）。
2. **启用 GitHub Pages**：
   - 仓库 `Settings` → `Pages` → Source 选择 **GitHub Actions**。
3. **添加密码 Secret**：
   - 仓库 `Settings` → `Secrets and variables` → `Actions`
   - 点击 `New repository secret`
   - Name 填写：`LOGIN_PASSWORD`
   - Secret 填写您想要的密码（例如 `admin123`）

## 📁 上传文件

将以下三个文件/文件夹推送到仓库根目录：
