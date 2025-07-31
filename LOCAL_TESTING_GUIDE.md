# 本地测试指南

## 📋 前置要求

### 系统要求
- **Node.js**: 版本 18.0 或更高
- **npm**: 版本 8.0 或更高  
- **操作系统**: Windows 10/11, macOS, 或 Linux
- **浏览器**: Chrome, Firefox, Safari, Edge（最新版本）

### 检查环境
```bash
# 检查 Node.js 版本
node --version
# 应该显示 v18.x.x 或更高

# 检查 npm 版本  
npm --version
# 应该显示 8.x.x 或更高
```

## 🚀 快速开始

### 步骤 1: 打开项目目录
```bash
# Windows (使用命令提示符或PowerShell)
cd C:\Users\cn1st\OneDrive\SelfSoftware\instantmsg

# 确认当前目录
dir
# 应该看到 package.json, src/ 等文件和文件夹
```

### 步骤 2: 确认项目结构
确保以下文件存在：
```
instantmsg/
├── package.json                 # 项目配置和依赖
├── .env.local                   # 环境变量配置
├── next.config.js               # Next.js 配置
├── tailwind.config.ts           # Tailwind CSS 配置
├── tsconfig.json                # TypeScript 配置
├── src/                         # 源代码目录
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API 路由
│   │   ├── reset-password/      # 密码重置页面
│   │   ├── globals.css          # 全局样式
│   │   ├── layout.tsx           # 根布局
│   │   └── page.tsx             # 首页
│   ├── components/              # React 组件
│   │   ├── AdminPanel.tsx       # 管理员面板
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── LoginForm.tsx        # 登录表单
│   │   ├── LogsViewer.tsx       # 日志查看器
│   │   ├── RegisterForm.tsx     # 注册表单
│   │   ├── TradingSignalForm.tsx # 交易信号表单
│   │   └── WebhookConfig.tsx    # Webhook配置
│   ├── lib/                     # 工具库
│   │   └── auth.ts              # 认证逻辑
│   └── types/                   # TypeScript 类型定义
│       └── index.ts
└── ...其他配置文件
```

### 步骤 3: 安装项目依赖
```bash
# 安装所有依赖包
npm install

# 如果安装速度慢，可以使用国内镜像
npm install --registry https://registry.npmmirror.com

# 安装完成后检查
npm list --depth=0
# 应该看到 react, next, resend 等依赖包
```

**可能遇到的问题：**
```bash
# 如果遇到权限问题 (Windows)
# 以管理员身份运行命令提示符

# 如果遇到网络问题
npm config set registry https://registry.npmmirror.com
npm install

# 如果依赖冲突，清理后重装
rmdir /s node_modules    # Windows
rm -rf node_modules      # macOS/Linux
npm install
```

### 步骤 4: 配置环境变量
检查 `.env.local` 文件内容：
```env
# ============================================
# 交易信号发送器 - 环境配置文件
# ============================================

# 注意：超级用户(admin)已不再使用全局Webhook配置
# 每个普通用户需要在应用中配置自己的Webhook设置

# ============================================
# 邮件服务配置 (可选 - 用于邮件验证和密码重置)
# ============================================
# 如需测试邮件功能，请配置以下参数：
# 1. 访问 https://resend.com 注册账户
# 2. 创建API密钥并替换下面的值
# 3. 配置已验证的发件人域名和邮箱

RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# ============================================
# 应用配置 (可选)
# ============================================
# 生产环境URL (本地开发时通常不需要设置)
# NEXTAUTH_URL=http://localhost:3000

# ============================================
# 已移除的配置 (仅供参考)
# ============================================
# 以下配置在新版本中已不再使用：
# WEBHOOK_URL - 超级用户不再使用全局webhook
# WEBHOOK_TOKEN - 改为用户级别的token配置
```

**重要变更说明：**
- ✅ **已移除全局Webhook配置**：`WEBHOOK_URL` 和 `WEBHOOK_TOKEN` 不再需要
- ✅ **用户级配置**：每个用户在应用内独立配置自己的Webhook
- ✅ **超级用户调整**：admin用户专注于管理功能，不发送交易信号

**配置说明：**
- `RESEND_API_KEY`: 测试邮件功能时需要，从 [resend.com](https://resend.com) 获取
- `FROM_EMAIL`: 发送邮件的邮箱地址（需要在Resend中验证域名）
- `NEXTAUTH_URL`: 生产环境URL，本地开发通常不需要设置
- **不配置邮件API不影响其他功能测试**

## 🎯 启动应用

### 步骤 5: 启动开发服务器
```bash
# 启动开发服务器
npm run dev

# 你应该看到类似这样的输出：
# > instantmsg@0.1.0 dev
# > next dev
# 
#   ▲ Next.js 14.2.5
#   - Local:        http://localhost:3000
#   - Environments: .env.local
# 
#  ✓ Starting...
#  ✓ Ready in 3.2s
```

**启动成功的标志：**
- 看到 `✓ Ready in X.Xs` 消息
- 显示 `Local: http://localhost:3000`
- 没有红色错误信息

**如果启动失败：**
```bash
# 检查端口占用
netstat -ano | findstr :3000    # Windows
lsof -ti:3000                   # macOS/Linux

# 使用其他端口启动
npm run dev -- -p 3001

# 清理缓存重试
npx next clean
npm run dev
```

### 步骤 6: 验证应用运行
1. **打开浏览器**
   - 访问：`http://localhost:3000`
   - 或者按 `Ctrl+点击` 终端中的链接

2. **验证页面加载**
   - 应该看到"交易信号发送器"标题
   - 看到登录表单（用户名、密码输入框）
   - 看到"没有账户？点击注册"链接

3. **检查开发者工具**
   - 按 `F12` 打开开发者工具
   - 检查 Console 标签页，确保没有错误信息
   - 如果有红色错误，记录下来用于排查

### 步骤 7: 验证后端API
测试API是否正常工作：
```bash
# 在新的终端窗口中测试（保持 npm run dev 继续运行）

# 测试健康检查（如果有的话）
curl http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d "{}"

# 应该返回错误信息，表示API正在工作
# {"success":false,"message":"请填写用户名和密码"}
```

## 🔧 开发环境设置

### 推荐的VS Code扩展
如果使用VS Code，建议安装：
```
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense  
- TypeScript Importer
- Auto Rename Tag
- Prettier - Code formatter
```

### 终端窗口管理
建议开启多个终端窗口：
```bash
# 终端 1: 运行开发服务器
npm run dev

# 终端 2: 用于其他命令（测试、安装包等）
# 保持在项目根目录
```

### 热重载验证
测试代码修改是否能实时更新：
1. 修改 `src/app/page.tsx` 中的标题文字
2. 保存文件
3. 浏览器应该自动刷新显示新内容
4. 如果没有自动更新，检查终端是否有编译错误

## ✅ 快速启动检查清单

在开始测试前，确保完成以下步骤：

### 环境检查
- [ ] Node.js 版本 ≥ 18.0
- [ ] npm 版本 ≥ 8.0
- [ ] 项目目录正确
- [ ] 所有必要文件存在

### 依赖安装
- [ ] `npm install` 执行成功
- [ ] 没有严重的依赖冲突警告
- [ ] `node_modules` 文件夹已创建

### 环境配置  
- [ ] `.env.local` 文件存在
- [ ] 环境变量格式正确
- [ ] 邮件配置（可选）已设置

### 应用启动
- [ ] `npm run dev` 执行成功
- [ ] 看到 "Ready in X.Xs" 消息
- [ ] 浏览器可以访问 localhost:3000
- [ ] 页面正常加载，无控制台错误

### 基础功能验证
- [ ] 登录页面显示正常
- [ ] 注册页面可以切换
- [ ] 忘记密码链接可见
- [ ] 表单样式正常

## 🚨 常见启动问题及解决方案

### 问题1: "node: command not found"
```bash
# 解决方案：安装 Node.js
# 访问 https://nodejs.org/ 下载并安装
# 或使用包管理器：
# Windows: choco install nodejs
# macOS: brew install node
```

### 问题2: "npm install 失败"
```bash
# 解决方案1：清理npm缓存
npm cache clean --force
npm install

# 解决方案2：删除package-lock.json重新安装
del package-lock.json     # Windows
rm package-lock.json      # macOS/Linux
npm install

# 解决方案3：使用yarn替代npm
npm install -g yarn
yarn install
yarn dev
```

### 问题3: "端口3000被占用"
```bash
# 解决方案1：查找并杀死占用进程
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID号> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# 解决方案2：使用其他端口
npm run dev -- -p 3001
```

### 问题4: "编译错误"
```bash
# 解决方案1：清理Next.js缓存
npx next clean
npm run dev

# 解决方案2：重新安装依赖
rmdir /s node_modules .next    # Windows  
rm -rf node_modules .next      # macOS/Linux
npm install
npm run dev

# 解决方案3：检查TypeScript错误
npx tsc --noEmit
```

### 问题5: "页面显示错误"
```bash
# 解决方案：查看详细错误信息
# 1. 检查终端输出的错误信息
# 2. 打开浏览器开发者工具(F12)
# 3. 查看Console和Network标签页
# 4. 记录具体错误信息进行排查
```

## 🔄 重新开始的完整流程

如果遇到无法解决的问题，可以完全重新开始：

```bash
# 1. 停止当前服务器 (Ctrl+C)

# 2. 清理所有生成文件
rmdir /s node_modules .next          # Windows
rm -rf node_modules .next            # macOS/Linux

# 3. 清理npm缓存
npm cache clean --force

# 4. 重新安装依赖
npm install

# 5. 重新启动
npm run dev
```

## 测试流程

### 阶段一：基础功能测试

#### 1. 超级用户登录测试
1. **登录超级用户**
   - 用户名：`admin`
   - 密码：环境变量配置的密码（开发环境默认：`admin123`）
   - 应该直接登录成功（无需邮箱验证）

2. **验证管理员界面**
   - 页面标题应显示"管理员控制台"
   - 右上角显示"超级管理员"标签
   - 导航只显示"系统日志"和"退出登录"
   - 默认显示用户管理界面

3. **用户管理功能**
   - 查看用户列表（初始只有admin用户）
   - 用户列表应显示admin的"管理员"标签
   - 管理员用户的操作列应为空（无法操作）

4. **邮件配置界面**
   - 点击"邮件配置"标签
   - 应显示当前API配置状态
   - 显示配置说明和指导

#### 2. 普通用户注册测试
1. **退出管理员账户**
   - 点击"退出登录"
   - 返回登录页面

2. **注册新用户**
   - 点击"没有账户？点击注册"
   - 填写注册信息：
     - 用户名：`testuser1`
     - 邮箱：`test@example.com`
     - 密码：`123456`
   - 点击注册
   - 应显示："注册成功！请检查您的邮箱并点击验证链接完成注册"

3. **验证注册结果**
   - 表单应被清空
   - 返回登录界面
   - 此时用户未验证，无法登录

#### 3. 用户管理测试
1. **重新登录管理员**
   - 用户名：`admin`
   - 密码：环境变量配置的密码（开发环境默认：`admin123`）

2. **查看新注册用户**
   - 用户列表应显示2个用户：admin和testuser1
   - testuser1状态应为"未验证"
   - Webhook状态应为"未配置"

3. **测试用户管理操作**
   - 点击testuser1的"启用"按钮
   - 应显示操作成功消息
   - 用户状态变为"已验证"
   - 刷新列表确认状态更新

### 阶段二：用户功能测试

#### 1. 普通用户登录
1. **退出管理员账户**
2. **登录测试用户**
   - 用户名：`testuser1`
   - 密码：`123456`
   - 应该登录成功（因为管理员已启用）

3. **验证普通用户界面**
   - 页面标题：交易信号发送器
   - 导航包含：发送信号、Webhook设置、查看日志、退出登录
   - 默认显示交易信号发送界面

#### 2. Webhook配置测试
1. **尝试发送信号（应该失败）**
   - 选择标的：MES
   - 选择动作：BUY
   - 点击"确认"
   - 应显示错误："请先配置您的webhook设置"

2. **配置Webhook**
   - 点击"Webhook设置"
   - 填写配置：
     - URL：`https://httpbin.org/post`（测试URL）
     - Token：`test-token-123`（可选）
     - 启用：勾选
   - 点击"保存配置"
   - 应显示成功消息

3. **测试Webhook连接**
   - 点击"测试连接"
   - 应显示连接测试结果
   - 如果URL有效，应显示成功状态

#### 3. 交易信号发送测试
1. **返回发送信号界面**
   - 点击"发送信号"

2. **发送测试信号**
   - 选择标的：MES
   - 选择动作：BUY
   - 点击"确认"
   - 应显示："交易信号发送成功！"

3. **验证信号内容**
   - 如果使用httpbin.org，可以查看请求详情
   - JSON格式应为：
   ```json
   {
     "message_type": "EMA_CCI_Signal",
     "data": {
       "symbol": "MES",
       "price": 168.88,
       "timestamp": "2025-07-31T...",
       "action": "BUY"
     }
   }
   ```

#### 4. 日志功能测试
1. **查看操作日志**
   - 点击"查看日志"
   - 应显示用户的操作记录：
     - 用户注册
     - 账户状态变更（管理员启用）
     - Webhook配置更新
     - 交易信号发送

### 阶段三：高级功能测试

#### 1. 多用户隔离测试
1. **注册第二个用户**
   - 退出当前用户
   - 注册用户：`testuser2`
   - 管理员启用该用户

2. **验证数据隔离**
   - testuser2登录后应看不到testuser1的配置
   - testuser2需要独立配置自己的Webhook
   - 日志只显示自己的操作记录

#### 2. 管理员权限测试
1. **用户删除测试**
   - 管理员登录
   - 尝试删除testuser2
   - 确认删除提示
   - 用户应从列表中消失

2. **权限边界测试**
   - 管理员无法删除其他管理员
   - 管理员看不到用户的Webhook详细配置
   - 普通用户无法访问管理功能

#### 3. 忘记密码功能测试（需要邮件配置）
1. **配置邮件API**
   - 在`.env.local`中设置有效的RESEND_API_KEY
   - 设置FROM_EMAIL为验证过的邮箱

2. **测试密码重置**
   - 退出登录
   - 点击"忘记密码？"
   - 输入注册邮箱
   - 应收到重置邮件
   - 点击邮件中的链接
   - 设置新密码
   - 用新密码登录

## 测试用的Webhook端点

### 1. HTTPBin（推荐用于测试）
```
URL: https://httpbin.org/post
Token: 可选
```
- 优势：返回详细的请求信息
- 可以验证JSON格式和头部信息

### 2. Webhook.site
```
URL: https://webhook.site/your-unique-id
Token: 可选
```
- 优势：提供实时查看界面
- 可以看到完整的请求历史

### 3. RequestBin
```
URL: https://requestbin.net/r/your-bin-id
Token: 可选
```
- 优势：简单易用
- 支持请求历史查看

## 常见问题排查

### 1. 启动失败
**症状**：npm run dev 失败
**解决**：
- 检查node版本：`node --version`（需要18+）
- 删除node_modules重新安装：`rm -rf node_modules && npm install`
- 检查端口占用：确保3000端口未被占用

### 2. 登录失败
**症状**：管理员无法登录
**解决**：
- 确认用户名：`admin`（全小写）
- 确认密码：检查 `.env.local` 中的 `ADMIN_PASSWORD` 设置（开发环境默认：`admin123`）
- 检查浏览器控制台是否有错误

### 3. Webhook测试失败
**症状**：测试连接失败
**解决**：
- 检查URL格式是否正确
- 确认网络连接正常
- 尝试其他测试端点

### 4. 邮件发送失败
**症状**：注册后未收到验证邮件
**解决**：
- 检查RESEND_API_KEY配置
- 检查FROM_EMAIL是否已验证
- 查看服务器日志错误信息

## 性能测试

### 1. 并发用户测试
- 开启多个浏览器标签页
- 同时注册多个用户
- 验证数据隔离是否正常

### 2. 大量数据测试
- 注册10+用户
- 每个用户发送多条信号
- 检查日志加载性能

### 3. 长时间运行测试
- 保持应用运行数小时
- 定期执行操作
- 检查内存泄漏情况

## 测试检查清单

### ✅ 基础功能
- [ ] 管理员登录成功
- [ ] 普通用户注册成功
- [ ] 用户状态管理正常
- [ ] 用户删除功能正常

### ✅ 业务功能
- [ ] Webhook配置保存成功
- [ ] Webhook连接测试正常
- [ ] 交易信号发送成功
- [ ] JSON格式正确

### ✅ 安全功能
- [ ] 用户数据完全隔离
- [ ] 管理员权限控制正确
- [ ] 登录验证有效
- [ ] 操作日志记录完整

### ✅ 界面功能
- [ ] 导航切换正常
- [ ] 错误提示清晰
- [ ] 成功反馈及时
- [ ] 响应式布局正常

完成这个测试指南后，你就可以全面验证系统的所有功能是否正常工作！