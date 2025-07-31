import { User, LoginData, RegisterData, ForgotPasswordData, ResetPasswordData, WebhookConfig, WebhookConfigData } from '@/types';
import crypto from 'crypto';
import { Resend } from 'resend';

// 简单的密码哈希函数（生产环境应使用bcrypt）
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// 使用全局变量保持数据在热重载之间的持久性
declare global {
  var __appUsers: User[] | undefined;
  var __appLogs: { userId: string; timestamp: Date; action: string; details: string }[] | undefined;
}

// 如果全局变量不存在，则初始化
if (!global.__appUsers) {
  global.__appUsers = [];
}
if (!global.__appLogs) {
  global.__appLogs = [];
}

const users = global.__appUsers;
const logs = global.__appLogs;

// 初始化超级用户admin
function initializeAdminUser() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('=== 初始化管理员用户 ===');
    console.log('当前用户数量:', users.length);
  }
  
  if (!users.find(u => u.username === 'admin')) {
    // 从环境变量获取管理员密码，如果没有设置则使用默认值（仅开发环境）
    const adminPassword = process.env.ADMIN_PASSWORD || (isDevelopment ? 'admin123' : '');
    
    if (!adminPassword) {
      throw new Error('生产环境必须设置 ADMIN_PASSWORD 环境变量');
    }
    
    if (isDevelopment) {
      console.log('创建管理员用户...');
    }
    
    const adminUser: User = {
      id: 'admin-' + Date.now().toString(),
      username: 'admin',
      email: 'admin@system.local',
      password: hashPassword(adminPassword),
      emailVerified: true, // 管理员账户默认已验证
      isAdmin: true,
      createdAt: new Date()
    };
    users.push(adminUser);
    addLog(adminUser.id, '系统初始化', '超级用户admin创建成功');
    
    if (isDevelopment) {
      console.log('管理员用户创建完成');
    }
  } else {
    if (isDevelopment) {
      console.log('管理员用户已存在，跳过创建');
    }
  }
  
  if (isDevelopment) {
    console.log('初始化完成，当前用户数量:', users.length);
  }
}

// 在模块加载时初始化管理员用户
initializeAdminUser();

// 发送验证邮件函数
export async function sendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  const user = getUserByEmail(email);
  
  if (!user) {
    return { success: false, message: '用户不存在' };
  }

  if (user.emailVerified) {
    return { success: false, message: '邮箱已经验证过了' };
  }

  if (!user.emailVerificationToken) {
    return { success: false, message: '验证令牌不存在' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email send');
    return { success: true, message: '验证邮件已发送（开发模式）' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${user.emailVerificationToken}`;
    const fromEmail = process.env.FROM_EMAIL || 'noreply@yourdomain.com';

    await resend.emails.send({
      from: fromEmail,
      to: [user.email],
      subject: '验证您的邮箱地址 - 交易信号发送器',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">欢迎注册交易信号发送器</h2>
          <p>您好 ${user.username}，</p>
          <p>感谢您注册我们的交易信号发送器。请点击下面的链接来验证您的邮箱地址：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              验证邮箱地址
            </a>
          </div>
          <p>或者复制以下链接到浏览器中打开：</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${verificationUrl}
          </p>
          <p>如果您没有注册我们的服务，请忽略此邮件。</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            此邮件由交易信号发送器系统自动发送，请勿回复。
          </p>
        </div>
      `,
    });

    return { success: true, message: '验证邮件已发送，请检查您的邮箱' };
  } catch (error) {
    console.error('Send verification email error:', error);
    return { success: false, message: '发送验证邮件失败，请稍后重试' };
  }
}

export function registerUser(data: RegisterData): { success: boolean; message: string; user?: User; needsVerification?: boolean } {
  if (users.find(u => u.username === data.username)) {
    return { success: false, message: '用户名已存在' };
  }
  
  if (users.find(u => u.email === data.email)) {
    return { success: false, message: '邮箱已被注册' };
  }

  const emailVerificationToken = crypto.randomUUID();
  
  // 只在开发环境显示调试信息
  if (process.env.NODE_ENV === 'development') {
    console.log('=== 用户注册调试信息 ===');
    console.log('生成的验证token:', emailVerificationToken.substring(0, 8) + '...');
  }

  const user: User = {
    id: Date.now().toString(),
    username: data.username,
    email: data.email,
    password: hashPassword(data.password),
    emailVerified: false,
    emailVerificationToken,
    isAdmin: false,
    createdAt: new Date()
  };

  users.push(user);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('用户已添加到数组，当前用户总数:', users.length);
    console.log('新用户信息:', { 
      username: user.username, 
      tokenPrefix: user.emailVerificationToken?.substring(0, 8) + '...',
      verified: user.emailVerified 
    });
  }
  
  addLog(user.id, '用户注册', `用户 ${user.username} 注册成功，等待邮件验证`);
  
  return { success: true, message: '注册成功，请检查邮箱并点击验证链接', user, needsVerification: true };
}

export function loginUser(data: LoginData): { success: boolean; message: string; user?: User } {
  const user = users.find(u => u.username === data.username);
  
  if (!user) {
    return { success: false, message: '用户不存在' };
  }

  if (!verifyPassword(data.password, user.password)) {
    return { success: false, message: '密码错误' };
  }

  if (!user.emailVerified && !user.isAdmin) {
    return { success: false, message: '请先验证邮箱后再登录' };
  }

  addLog(user.id, '用户登录', `用户 ${user.username} 登录成功`);
  
  return { success: true, message: '登录成功', user };
}

export function verifyEmail(token: string): { success: boolean; message: string; user?: User } {
  if (process.env.NODE_ENV === 'development') {
    console.log('=== 邮箱验证调试信息 ===');
    console.log('收到的token:', token.substring(0, 8) + '...');
    console.log('当前用户总数:', users.length);
    console.log('所有用户的验证token:', users.map(u => ({ 
      username: u.username, 
      tokenPrefix: u.emailVerificationToken?.substring(0, 8) + '...',
      verified: u.emailVerified 
    })));
  }
  
  const user = users.find(u => u.emailVerificationToken === token);
  
  if (!user) {
    if (process.env.NODE_ENV === 'development') {
      console.log('未找到匹配的用户');
    }
    return { success: false, message: '验证链接无效或已过期' };
  }

  if (user.emailVerified) {
    if (process.env.NODE_ENV === 'development') {
      console.log('用户已经验证过了:', user.username);
    }
    return { success: false, message: '邮箱已经验证过了' };
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('找到用户，正在验证:', user.username);
  }
  user.emailVerified = true;
  user.emailVerificationToken = undefined;

  addLog(user.id, '邮件验证', `用户 ${user.username} 邮件验证成功`);
  
  return { success: true, message: '邮箱验证成功，现在可以登录了', user };
}

export function getUserByEmail(email: string): User | undefined {
  return users.find(u => u.email === email);
}

export function initiatePasswordReset(email: string): { success: boolean; message: string; user?: User } {
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return { success: false, message: '邮箱地址不存在' };
  }

  const resetToken = crypto.randomUUID();
  const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

  user.passwordResetToken = resetToken;
  user.passwordResetExpires = resetExpires;

  addLog(user.id, '密码重置请求', `用户 ${user.username} 请求重置密码`);
  
  return { success: true, message: '密码重置邮件已发送', user };
}

export function resetPassword(token: string, newPassword: string): { success: boolean; message: string; user?: User } {
  const user = users.find(u => u.passwordResetToken === token);
  
  if (!user) {
    return { success: false, message: '重置链接无效或已过期' };
  }

  if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
    return { success: false, message: '重置链接已过期，请重新申请' };
  }

  user.password = hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  addLog(user.id, '密码重置', `用户 ${user.username} 密码重置成功`);
  
  return { success: true, message: '密码重置成功，请使用新密码登录', user };
}

export function getUserByResetToken(token: string): User | undefined {
  return users.find(u => u.passwordResetToken === token && u.passwordResetExpires && u.passwordResetExpires > new Date());
}

export function addLog(userId: string, action: string, details: string) {
  logs.push({
    userId,
    timestamp: new Date(),
    action,
    details
  });
}

export function getUserLogs(userId: string) {
  return logs.filter(log => log.userId === userId);
}

export function getAllLogs() {
  return logs;
}

export function updateUserWebhookConfig(userId: string, config: WebhookConfigData): { success: boolean; message: string } {
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return { success: false, message: '用户不存在' };
  }

  // 验证URL格式
  try {
    new URL(config.url);
  } catch {
    return { success: false, message: 'webhook URL格式无效' };
  }

  user.webhookConfig = {
    url: config.url,
    token: config.token || undefined,
    isActive: config.isActive
  };

  addLog(userId, 'Webhook配置更新', `更新webhook配置: ${config.url}`);
  
  return { success: true, message: 'Webhook配置更新成功' };
}

export function getUserWebhookConfig(userId: string): WebhookConfig | null {
  const user = users.find(u => u.id === userId);
  return user?.webhookConfig || null;
}

export function getUserById(userId: string): User | undefined {
  return users.find(u => u.id === userId);
}

// 管理员专用函数
export function getAllUsers(): User[] {
  return users.map(user => ({
    ...user,
    password: '[HIDDEN]' // 隐藏密码
  })) as User[];
}

export function toggleUserStatus(adminId: string, targetUserId: string): { success: boolean; message: string } {
  const admin = users.find(u => u.id === adminId);
  
  if (!admin || !admin.isAdmin) {
    return { success: false, message: '权限不足' };
  }

  const targetUser = users.find(u => u.id === targetUserId);
  
  if (!targetUser) {
    return { success: false, message: '目标用户不存在' };
  }

  if (targetUser.isAdmin) {
    return { success: false, message: '不能操作管理员账户' };
  }

  targetUser.emailVerified = !targetUser.emailVerified;
  const action = targetUser.emailVerified ? '启用' : '禁用';
  
  addLog(adminId, '用户管理', `${action}用户: ${targetUser.username}`);
  addLog(targetUserId, '账户状态变更', `账户被管理员${action}`);
  
  return { success: true, message: `用户${action}成功` };
}

export function deleteUser(adminId: string, targetUserId: string): { success: boolean; message: string } {
  const admin = users.find(u => u.id === adminId);
  
  if (!admin || !admin.isAdmin) {
    return { success: false, message: '权限不足' };
  }

  const targetUserIndex = users.findIndex(u => u.id === targetUserId);
  
  if (targetUserIndex === -1) {
    return { success: false, message: '目标用户不存在' };
  }

  const targetUser = users[targetUserIndex];
  
  if (targetUser.isAdmin) {
    return { success: false, message: '不能删除管理员账户' };
  }

  users.splice(targetUserIndex, 1);
  
  addLog(adminId, '用户管理', `删除用户: ${targetUser.username}`);
  
  return { success: true, message: '用户删除成功' };
}