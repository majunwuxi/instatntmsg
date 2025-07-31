# 安全配置指南

## 🚨 上传到GitHub前的安全检查清单

### ✅ 已修复的安全问题

1. **✅ 硬编码密码移除**
   - 管理员密码现在通过环境变量 `ADMIN_PASSWORD` 配置
   - 生产环境必须设置，否则系统拒绝启动
   - 开发环境有默认密码 `admin123`

2. **✅ 调试信息保护**
   - 敏感token只显示前8位
   - 调试日志仅在开发环境显示
   - 生产环境不输出敏感信息

3. **✅ 前端环境变量保护**
   - 移除前端直接访问 `process.env`
   - 敏感配置只在服务器端处理

4. **✅ 文档安全更新**
   - 所有文档移除硬编码密码
   - 添加环境变量配置指导

## 🔒 必须配置的环境变量

### 生产环境必需
```bash
# 管理员密码 - 必须设置强密码
ADMIN_PASSWORD=your_very_secure_password_here

# 邮件服务（如果需要）
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# 应用URL
NEXTAUTH_URL=https://yourdomain.com
```

### 密码强度要求
- **最少12位字符**
- **包含大写字母**
- **包含小写字母** 
- **包含数字**
- **包含特殊字符**
- **示例**：`Admin@2024$ecure!`

## 🛡️ 安全最佳实践

### 1. 环境变量管理
```bash
# 创建 .env.local 文件
cp env.example .env.local

# 设置正确的权限（Linux/Mac）
chmod 600 .env.local

# 永远不要提交 .env.local 到版本控制
echo ".env.local" >> .gitignore
```

### 2. 生产部署安全
- 使用 HTTPS
- 设置防火墙规则
- 定期更新依赖包
- 启用日志监控
- 设置备份策略

### 3. 密码策略
- 管理员首次登录后立即修改密码
- 定期更换密码（建议90天）
- 不要在多个服务使用相同密码
- 考虑启用双因素认证

## 🔍 代码安全审查

### 已验证安全的部分
- ✅ 无硬编码密码
- ✅ 无API密钥泄露
- ✅ 调试信息已保护
- ✅ 环境变量正确使用
- ✅ 输入验证到位
- ✅ SQL注入防护（使用内存存储）
- ✅ XSS防护（React自动转义）

### 仍需注意的部分
- ⚠️ 使用SHA-256密码哈希（建议升级到bcrypt）
- ⚠️ 无登录尝试限制（建议添加）
- ⚠️ 无会话管理（建议添加JWT）
- ⚠️ 无CSRF保护（建议添加）

## 📋 GitHub上传前检查

### 文件检查
```bash
# 检查是否包含敏感信息
grep -r "ki&ysgDqmz" . --exclude-dir=node_modules
grep -r "password.*=" . --exclude-dir=node_modules --exclude="*.md"
grep -r "api.*key" . --exclude-dir=node_modules --exclude="*.md"
grep -r "secret" . --exclude-dir=node_modules --exclude="*.md"
```

### .gitignore 验证
确保包含以下内容：
```
# 环境变量文件
.env*.local
.env

# 日志文件
*.log

# 临时文件
.DS_Store
Thumbs.db
```

### 提交前最后检查
1. **环境变量文件**：确保 `.env.local` 不在版本控制中
2. **配置文件**：检查没有硬编码的密钥
3. **日志文件**：确保没有敏感信息
4. **测试文件**：移除测试用的真实密钥

## 🚀 部署后安全设置

### 1. 服务器安全
```bash
# 设置环境变量
export ADMIN_PASSWORD="your_secure_password"
export NODE_ENV="production"

# 限制文件权限
chmod 700 /path/to/app
chown app:app /path/to/app -R
```

### 2. 监控设置
- 设置日志监控
- 配置异常报警
- 监控登录异常
- 定期安全扫描

### 3. 备份策略
- 定期备份用户数据
- 加密存储备份
- 测试备份恢复流程

## 🆘 安全事件响应

### 如果发现安全问题
1. **立即修复**：修补漏洞
2. **更换密钥**：更新所有受影响的密码和API密钥
3. **通知用户**：如果用户数据受影响
4. **审查日志**：检查是否有异常访问
5. **加强监控**：提高安全监控级别

### 联系方式
- 发现安全问题请立即联系系统管理员
- 不要在公开渠道讨论安全漏洞

## 📚 进一步改进建议

### 短期改进
1. 实施bcrypt密码哈希
2. 添加登录尝试限制
3. 实施会话管理
4. 添加CSRF保护

### 长期改进
1. 实施双因素认证
2. 添加安全头部
3. 实施内容安全策略
4. 定期安全审计

---

**重要提醒**：在上传到任何公开代码仓库前，请确保已完成上述所有安全检查！ 