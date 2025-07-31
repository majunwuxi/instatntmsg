# 交易信号发送器

一个基于 Next.js 的现代化 Web 应用，用于安全地发送交易信号到自定义 Webhook 端点。

## ✨ 特性

- 🔐 **安全的用户认证系统**：邮箱验证、密码重置
- 👥 **多用户支持**：完全隔离的用户数据和配置
- 🎯 **个性化 Webhook 配置**：每个用户独立的信号发送端点
- 📊 **实时操作日志**：详细的操作审计和历史记录
- 🛡️ **管理员控制台**：用户管理和系统监控
- 📱 **响应式设计**：支持桌面和移动设备

## 🚀 快速开始

### 系统要求

- Node.js 18.0+ 
- npm 8.0+

### 安装步骤

1. **克隆项目**
```bash
git clone <your-repo-url>
cd instantmsg
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp env.example .env.local

# 编辑 .env.local 文件
# 至少需要设置 ADMIN_PASSWORD
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开浏览器访问 `http://localhost:3000`

## ⚙️ 环境配置

### 必需配置

在 `.env.local` 文件中设置以下变量：

```bash
# 管理员密码 (必需)
ADMIN_PASSWORD=your_secure_admin_password

# 邮件服务 (可选 - 用于邮箱验证和密码重置)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# 生产环境URL (可选)
NEXTAUTH_URL=https://yourdomain.com
```

### 邮件服务配置

1. 访问 [Resend.com](https://resend.com) 注册账户
2. 创建 API 密钥
3. 验证发件人域名
4. 在环境变量中配置密钥和邮箱

## 👤 用户角色

### 管理员 (admin)
- **登录凭据**：用户名 `admin`，密码通过 `ADMIN_PASSWORD` 环境变量设置
- **权限**：用户管理、系统日志查看、邮件配置管理
- **限制**：无法发送交易信号，专注于系统管理

### 普通用户
- **注册流程**：邮箱验证后可使用
- **功能**：配置个人 Webhook、发送交易信号、查看操作日志
- **隔离性**：完全独立的配置和数据

## 📡 交易信号

### 支持的标的
- **MES**：微型标普500期货
- **N225MC**：日经225迷你期货

### 操作类型
- **BUY**：买入信号
- **SELL**：卖出信号  
- **FLAT**：平仓信号

### 信号格式
```json
{
  "message_type": "EMA_CCI_Signal",
  "data": {
    "symbol": "MES",
    "price": 168.88,
    "timestamp": "2025-01-31T12:34:56.789Z",
    "action": "BUY"
  }
}
```

## 🔧 Webhook 配置

### 配置步骤
1. 登录用户账户
2. 进入"Webhook设置"
3. 填写目标URL
4. 可选：设置认证Token
5. 测试连接
6. 保存配置

### 安全特性
- URL 格式验证
- 连接测试功能
- 可选的 X-Token 认证头
- 用户级配置隔离

## 📚 文档

- [管理员指南](ADMIN_USER_GUIDE.md)
- [本地测试指南](LOCAL_TESTING_GUIDE.md)
- [安全配置指南](SECURITY_GUIDE.md)
- [Webhook安全指南](WEBHOOK_SECURITY_GUIDE.md)
- [邮件设置指南](EMAIL_SETUP.md)
- [密码重置指南](PASSWORD_RESET_GUIDE.md)

## 🛡️ 安全特性

### 已实现的安全措施
- ✅ 环境变量管理敏感配置
- ✅ 密码哈希存储
- ✅ 邮箱验证机制
- ✅ 用户权限隔离
- ✅ 操作审计日志
- ✅ 输入验证和过滤
- ✅ XSS 防护 (React 自动转义)

### 部署建议
- 使用 HTTPS
- 设置强密码策略
- 定期更新依赖
- 启用日志监控
- 配置防火墙规则

## 🏗️ 技术栈

- **前端**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, Node.js
- **数据存储**: 内存存储 (适合MVP，可扩展到数据库)
- **邮件服务**: Resend API
- **部署**: 支持Vercel、Netlify等平台

## 📦 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── reset-password/    # 密码重置页面
│   └── ...               # 其他页面
├── components/           # React 组件
├── lib/                 # 工具库和认证逻辑
└── types/              # TypeScript 类型定义
```

## 🔄 开发脚本

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 安全检查
node security-check.cjs
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请：
- 提交 Issue
- 查看文档目录中的详细指南
- 联系项目维护者

---

**⚠️ 重要提醒**: 部署到生产环境前，请务必阅读 [安全配置指南](SECURITY_GUIDE.md) 并完成所有安全检查！ 