# 邮件验证设置指南

## 环境变量配置

要启用邮件验证功能，请在 `.env.local` 文件中配置以下变量：

```env
# Resend API配置
RESEND_API_KEY=your_actual_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# 可选：如果部署到生产环境，设置正确的URL
NEXTAUTH_URL=https://yourdomain.com
```

## 获取Resend API密钥

1. 访问 [Resend.com](https://resend.com)
2. 创建账户并登录
3. 在控制台中创建API密钥
4. 将API密钥复制到 `RESEND_API_KEY` 环境变量中

## 发件人邮箱设置

- `FROM_EMAIL` 应该是你拥有的域名下的邮箱地址
- 如果使用Resend，需要在Resend控制台中验证你的域名
- 对于测试，可以使用Resend提供的测试域名

## 邮件验证流程

1. **用户注册**: 用户填写注册表单后，系统会：
   - 创建用户账户（emailVerified: false）
   - 自动发送验证邮件到用户邮箱
   - 显示提示消息要求用户检查邮箱

2. **邮件验证**: 用户收到邮件后：
   - 点击邮件中的验证链接
   - 系统验证token并更新用户状态（emailVerified: true）
   - 重定向到主页并显示成功消息

3. **登录限制**: 
   - 只有验证邮箱的用户才能登录使用交易信号功能
   - 未验证用户登录时会显示"请先验证邮箱后再登录"的错误消息

## 测试邮件验证

如果没有配置Resend API密钥，注册功能仍然可以工作，但不会发送验证邮件。用户将无法登录，因为邮箱未验证。

## 日志记录

系统会记录以下邮件相关操作：
- 用户注册（等待邮件验证）
- 邮件验证成功
- 登录尝试（成功/失败）

所有日志都可以在应用的"查看日志"功能中查看。