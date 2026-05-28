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

## 🚀 自动部署

- 推送后，GitHub Actions 会自动运行加密流程
- 运行成功后（约1-2分钟），访问 `https://你的用户名.github.io/仓库名/`
- 页面会弹出密码框，输入您在 Secret 中设置的 `LOGIN_PASSWORD` 即可进入系统

## 📌 注意事项

- **不要手动创建 `index.html`**，它由 Actions 自动生成并覆盖。
- 密码修改：只需在 Secret 中更新 `LOGIN_PASSWORD` 的值，然后重新运行 Actions（或推送任意空提交）即可生效。
- 所有数据存储在浏览器的 IndexedDB 中，清除浏览器缓存会导致数据丢失，请定期备份。

## 🛠️ 本地测试（可选）

```bash
npm install -g staticrypt
staticrypt main.html --passphrase 你的密码 --short -o test.html
# 然后在浏览器打开 test.html 测试

📄 功能清单
供应商管理（名称、产品、付款类型、入库金额）

多币种支出/付款登记（CNY/USD/EUR）

付款确认（确认后自动更新供应商已付金额）

资金账户管理（银行/微信/支付宝/现金），支持账户间转账

月度预算设置与执行率监控

收支报表（利润表、现金流量图）

近6月支出趋势图表


---

## 📌 下一步操作

1. 在您的 GitHub 仓库中，按上述结构创建 `.github/workflows/deploy.yml` 和 `main.html` 文件（直接复制代码）。
2. 在仓库 `Settings` → `Secrets and variables` → `Actions` 中添加 `LOGIN_PASSWORD`（例如 `admin123`）。
3. 在 `Settings` → `Pages` 中将 Source 设为 **GitHub Actions**。
4. 推送代码到 `main` 分支。
5. 等待 Actions 运行成功（绿色 ✅），然后访问您的 GitHub Pages 域名。
6. 输入密码 `admin123`（或您设置的其他密码）即可使用系统。

如果遇到任何问题，请检查：
- Actions 运行日志是否有错误
- Secret 名称是否为 `LOGIN_PASSWORD` 且大小写正确
- Pages 源是否选择了 “GitHub Actions”

完成以上步骤后，您将得到一个功能完整、密码安全的出纳管理系统。
