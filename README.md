# 出纳管理系统（安全加密版）

增强功能：供应商往来 + 多币种付款 + 费用类别 + 账户转账 + 预算管理。

## 🔐 密码安全配置（关键步骤）

密码通过 GitHub Secrets 环境变量设置，**密码永远不会出现在代码仓库中**，任何人（包括仓库协作者）都无法看到密码原文。

### 第一步：配置 GitHub Secret

1. 进入 GitHub 仓库 → `Settings` → `Secrets and variables` → `Actions`
2. 点击 `New repository secret`
3. Name（名称）填写：`STATICRYPT_PASSWORD`
4. Secret 填写您想设置的密码（例如 `MySecurePass2026!`），点击保存

### 第二步：启用 GitHub Pages

1. 仓库 `Settings` → `Pages`
2. Source 选择 `GitHub Actions`

### 第三步：推送代码

将以上文件推送到 `main` 分支，GitHub Actions 自动构建加密并部署。

## 📁 文件结构说明
- `.github/workflows/deploy.yml`：CI/CD 自动加密部署
- `main.html`：源文件（未被加密，开发用）
- 部署后的 `index.html`：已被 Staticrypt 加密，密码仅存在于 Secret 中

## 🚀 访问系统
部署完成后访问 `https://用户名.github.io/仓库名/`，页面会提示输入密码，输入 Secret 中设置的密码即可正常使用。

## 💡 安全性说明
- ✅ 密码 100% 不出现在代码库中
- ✅ 即使 GitHub Pages 公开部署，也需要密码才能访问
- ✅ 无法绕过前端验证（加密后的 HTML 必须通过密码解密）
- ⚠️ 使用高复杂度密码，避免弱口令
