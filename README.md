# 出纳管理系统 - 安全加密版

本系统通过 GitHub Actions + Staticrypt + GitHub Secrets 实现**密码环境变量部署**，密码不写入任何代码文件。

## 🚀 部署步骤

### 1. 添加 GitHub Secret
- 进入仓库 `Settings` → `Secrets and variables` → `Actions`
- 点击 `New repository secret`
- Name：`LOGIN_PASSWORD`
- Secret：输入您想设置的密码（例如 `admin123`）

### 2. 设置 Pages 源
- 仓库 `Settings` → `Pages`
- Source 选择 **GitHub Actions**

### 3. 推送代码
将以下三个文件推送到 `main` 分支：
- `.github/workflows/deploy.yml`
- `main.html`
- `README.md`

### 4. 访问系统
等待约 2-3 分钟，访问 `https://你的用户名.github.io/仓库名/`  
页面会弹出密码框，输入您在 Secret 中设置的密码即可进入系统。

## 🔐 安全说明
- ✅ 密码仅存在于 GitHub Secrets，不写入任何文件
- ✅ 加密后的 `index.html` 无法被逆向获取密码
- ✅ 每次推送代码都会自动重新加密部署

## 📝 功能清单
- 供应商管理（名称、产品、付款类型、入库金额）
- 供应商账户（对公/私用）
- 多币种支出记录（CNY/USD/EUR）
- 支出类别（原材料采购、办公费用等）
- 资金账户管理（银行/微信/支付宝/现金）
- 账户间转账
- 月度预算设置与执行率
- 利润表/现金流量图表
- 近6月支出趋势图

## ⚠️ 常见问题
**Q: 部署后还是弹出旧的登录框？**  
A: 请强制刷新浏览器（Ctrl+F5），并检查 GitHub Actions 是否为绿色通过。如果 Pages 源未设置为 GitHub Actions，请修改。

**Q: 密码错误无法进入？**  
A: 确认 Secret 名称是 `LOGIN_PASSWORD`（注意大小写），并确保 Actions 运行成功后重新访问。

**Q: 数据会丢失吗？**  
A: 所有数据存储在浏览器 IndexedDB 中，清除浏览器缓存会导致数据丢失，建议定期备份（可自行添加导出功能）。
