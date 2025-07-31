import { User, LoginData, RegisterData, ForgotPasswordData, ResetPasswordData, WebhookConfig, WebhookConfigData } from '@/types';
import crypto from 'crypto';
import { Resend } from 'resend';
import { sql } from '@vercel/postgres';
import { initDB } from './db';

// 简单的密码哈希函数（生产环境应使用bcrypt）
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// 使用全局变量保持数据在热重载之间的持久性（仅用于开发环境备用）
declare global {
  var __appUsers: User[] | undefined;
  var __appLogs: { userId: string; timestamp: Date; action: string; details: string }[] | undefined;
  var __dbInitialized: boolean | undefined;
}

// 检查是否使用数据库
const useDatabase = () => {
  return !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
};

// 初始化数据库（如果配置了的话）
async function ensureDatabaseInitialized() {
  if (useDatabase() && !global.__dbInitialized) {
    try {
      await initDB();
      global.__dbInitialized = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      // 回退到内存存储
      initMemoryStorage();
    }
  } else if (!useDatabase()) {
    initMemoryStorage();
  }
}

// 初始化内存存储（开发环境备用）
function initMemoryStorage() {
  if (!global.__appUsers) {
    global.__appUsers = [];
  }
  if (!global.__appLogs) {
    global.__appLogs = [];
  }
  
  // 初始化管理员用户
  const users = global.__appUsers;
  if (!users.find(u => u.username === 'admin')) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const adminPassword = process.env.ADMIN_PASSWORD || (isDevelopment ? 'admin123' : '');
    
    if (adminPassword) {
      const adminUser: User = {
        id: 'admin-' + Date.now().toString(),
        username: 'admin',
        email: 'admin@system.local',
        password: hashPassword(adminPassword),
        emailVerified: true,
        isAdmin: true,
        createdAt: new Date()
      };
      users.push(adminUser);
      if (global.__appLogs) {
        global.__appLogs.push({
          userId: adminUser.id,
          timestamp: new Date(),
          action: '系统初始化',
          details: '超级用户admin创建成功'
        });
      }
    }
  }
}

// 确保初始化
ensureDatabaseInitialized().catch(console.error);

// 发送验证邮件函数
export async function sendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  const user = await getUserByEmail(email);
  
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

export async function registerUser(data: RegisterData): Promise<{ success: boolean; message: string; user?: User; needsVerification?: boolean }> {
  await ensureDatabaseInitialized();
  
  if (useDatabase()) {
    try {
      // 检查用户名是否已存在
      const existingUsername = await sql`
        SELECT id FROM users WHERE username = ${data.username} LIMIT 1
      `;
      
      if (existingUsername.rows.length > 0) {
        return { success: false, message: '用户名已存在' };
      }
      
      // 检查邮箱是否已被注册
      const existingEmail = await sql`
        SELECT id FROM users WHERE email = ${data.email} LIMIT 1
      `;
      
      if (existingEmail.rows.length > 0) {
        return { success: false, message: '邮箱已被注册' };
      }

      const emailVerificationToken = crypto.randomUUID();
      const userId = Date.now().toString();
      
      // 插入新用户
      await sql`
        INSERT INTO users (
          id, username, email, password, email_verified, 
          email_verification_token, is_admin, created_at
        ) VALUES (
          ${userId}, ${data.username}, ${data.email}, 
          ${hashPassword(data.password)}, FALSE, 
          ${emailVerificationToken}, FALSE, CURRENT_TIMESTAMP
        )
      `;
      
      // 添加日志
      await addLog(userId, '用户注册', `用户 ${data.username} 注册成功，等待邮件验证`);
      
      const user: User = {
        id: userId,
        username: data.username,
        email: data.email,
        password: hashPassword(data.password),
        emailVerified: false,
        emailVerificationToken,
        isAdmin: false,
        createdAt: new Date()
      };
      
      return { success: true, message: '注册成功，请检查邮箱并点击验证链接', user, needsVerification: true };
    } catch (error) {
      console.error('Database register error:', error);
      return { success: false, message: '注册失败，请稍后重试' };
    }
  } else {
    // 回退到内存存储
    const users = global.__appUsers || [];
    
    if (users.find(u => u.username === data.username)) {
      return { success: false, message: '用户名已存在' };
    }
    
    if (users.find(u => u.email === data.email)) {
      return { success: false, message: '邮箱已被注册' };
    }

    const emailVerificationToken = crypto.randomUUID();
    
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
    await addLog(user.id, '用户注册', `用户 ${user.username} 注册成功，等待邮件验证`);
    
    return { success: true, message: '注册成功，请检查邮箱并点击验证链接', user, needsVerification: true };
  }
}

export async function loginUser(data: LoginData): Promise<{ success: boolean; message: string; user?: User }> {
  await ensureDatabaseInitialized();
  
  if (useDatabase()) {
    try {
      const result = await sql`
        SELECT * FROM users WHERE username = ${data.username} LIMIT 1
      `;
      
      if (result.rows.length === 0) {
        return { success: false, message: '用户不存在' };
      }
      
      const userData = result.rows[0];
      
      if (!verifyPassword(data.password, userData.password)) {
        return { success: false, message: '密码错误' };
      }

      if (!userData.email_verified && !userData.is_admin) {
        return { success: false, message: '请先验证邮箱后再登录' };
      }
      
      const user: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        emailVerified: userData.email_verified,
        emailVerificationToken: userData.email_verification_token,
        passwordResetToken: userData.password_reset_token,
        passwordResetExpires: userData.password_reset_expires ? new Date(userData.password_reset_expires) : undefined,
        isAdmin: userData.is_admin,
        webhookConfig: userData.webhook_url ? {
          url: userData.webhook_url,
          token: userData.webhook_token,
          isActive: userData.webhook_active
        } : undefined,
        createdAt: new Date(userData.created_at)
      };

      await addLog(user.id, '用户登录', `用户 ${user.username} 登录成功`);
      
      return { success: true, message: '登录成功', user };
    } catch (error) {
      console.error('Database login error:', error);
      return { success: false, message: '登录失败，请稍后重试' };
    }
  } else {
    // 回退到内存存储
    const users = global.__appUsers || [];
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

    await addLog(user.id, '用户登录', `用户 ${user.username} 登录成功`);
    
    return { success: true, message: '登录成功', user };
  }
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string; user?: User }> {
  await ensureDatabaseInitialized();
  
  if (useDatabase()) {
    try {
      const result = await sql`
        SELECT * FROM users WHERE email_verification_token = ${token} LIMIT 1
      `;
      
      if (result.rows.length === 0) {
        return { success: false, message: '验证链接无效或已过期' };
      }
      
      const userData = result.rows[0];
      
      if (userData.email_verified) {
        return { success: false, message: '邮箱已经验证过了' };
      }
      
      // 更新用户验证状态
      await sql`
        UPDATE users 
        SET email_verified = TRUE, email_verification_token = NULL 
        WHERE id = ${userData.id}
      `;
      
      await addLog(userData.id, '邮件验证', `用户 ${userData.username} 邮件验证成功`);
      
      const user: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        emailVerified: true,
        isAdmin: userData.is_admin,
        createdAt: new Date(userData.created_at)
      };
      
      return { success: true, message: '邮箱验证成功，现在可以登录了', user };
    } catch (error) {
      console.error('Database verify email error:', error);
      return { success: false, message: '验证失败，请稍后重试' };
    }
  } else {
    // 回退到内存存储
    const users = global.__appUsers || [];
    const user = users.find(u => u.emailVerificationToken === token);
    
    if (!user) {
      return { success: false, message: '验证链接无效或已过期' };
    }

    if (user.emailVerified) {
      return { success: false, message: '邮箱已经验证过了' };
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;

    await addLog(user.id, '邮件验证', `用户 ${user.username} 邮件验证成功`);
    
    return { success: true, message: '邮箱验证成功，现在可以登录了', user };
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  await ensureDatabaseInitialized();
  
  if (useDatabase()) {
    try {
      const result = await sql`
        SELECT * FROM users WHERE email = ${email} LIMIT 1
      `;
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const userData = result.rows[0];
      return {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        emailVerified: userData.email_verified,
        emailVerificationToken: userData.email_verification_token,
        passwordResetToken: userData.password_reset_token,
        passwordResetExpires: userData.password_reset_expires ? new Date(userData.password_reset_expires) : undefined,
        isAdmin: userData.is_admin,
        webhookConfig: userData.webhook_url ? {
          url: userData.webhook_url,
          token: userData.webhook_token,
          isActive: userData.webhook_active
        } : undefined,
        createdAt: new Date(userData.created_at)
      };
    } catch (error) {
      console.error('Database getUserByEmail error:', error);
      return undefined;
    }
  } else {
    // 回退到内存存储
    const users = global.__appUsers || [];
    return users.find(u => u.email === email);
  }
}

export async function initiatePasswordReset(email: string): Promise<{ success: boolean; message: string; user?: User }> {
  const user = await getUserByEmail(email);
  
  if (!user) {
    return { success: false, message: '邮箱地址不存在' };
  }

  const resetToken = crypto.randomUUID();
  const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

  if (useDatabase()) {
    try {
      await sql`
        UPDATE users 
        SET password_reset_token = ${resetToken}, password_reset_expires = ${resetExpires.toISOString()}
        WHERE id = ${user.id}
      `;
    } catch (error) {
      console.error('Database initiatePasswordReset error:', error);
      return { success: false, message: '重置请求失败，请稍后重试' };
    }
  } else {
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
  }

  await addLog(user.id, '密码重置请求', `用户 ${user.username} 请求重置密码`);
  
  return { success: true, message: '密码重置邮件已发送', user };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string; user?: User }> {
  await ensureDatabaseInitialized();
  
  if (useDatabase()) {
    try {
      const result = await sql`
        SELECT * FROM users 
        WHERE password_reset_token = ${token} 
        AND password_reset_expires > CURRENT_TIMESTAMP
        LIMIT 1
      `;
      
      if (result.rows.length === 0) {
        return { success: false, message: '重置链接无效或已过期' };
      }
      
      const userData = result.rows[0];
      
      await sql`
        UPDATE users 
        SET password = ${hashPassword(newPassword)}, 
            password_reset_token = NULL, 
            password_reset_expires = NULL
        WHERE id = ${userData.id}
      `;
      
      await addLog(userData.id, '密码重置', `用户 ${userData.username} 密码重置成功`);
      
      const user: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        password: hashPassword(newPassword),
        emailVerified: userData.email_verified,
        isAdmin: userData.is_admin,
        createdAt: new Date(userData.created_at)
      };
      
      return { success: true, message: '密码重置成功，请使用新密码登录', user };
    } catch (error) {
      console.error('Database resetPassword error:', error);
      return { success: false, message: '重置失败，请稍后重试' };
    }
  } else {
    // 回退到内存存储
    const users = global.__appUsers || [];
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

    await addLog(user.id, '密码重置', `用户 ${user.username} 密码重置成功`);
    
    return { success: true, message: '密码重置成功，请使用新密码登录', user };
  }
}

export async function getUserByResetToken(token: string): Promise<User | undefined> {
  await ensureDatabaseInitialized();
  
  if (useDatabase()) {
    try {
      const result = await sql`
        SELECT * FROM users 
        WHERE password_reset_token = ${token} 
        AND password_reset_expires > CURRENT_TIMESTAMP
        LIMIT 1
      `;
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const userData = result.rows[0];
      return {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        emailVerified: userData.email_verified,
        passwordResetToken: userData.password_reset_token,
        passwordResetExpires: userData.password_reset_expires ? new Date(userData.password_reset_expires) : undefined,
        isAdmin: userData.is_admin,
        createdAt: new Date(userData.created_at)
      };
    } catch (error) {
      console.error('Database getUserByResetToken error:', error);
      return undefined;
    }
  } else {
    // 回退到内存存储
    const users = global.__appUsers || [];
    return users.find(u => u.passwordResetToken === token && u.passwordResetExpires && u.passwordResetExpires > new Date());
  }
}

export async function addLog(userId: string, action: string, details: string): Promise<void> {
  await ensureDatabaseInitialized();
  
  if (useDatabase()) {
    try {
      await sql`
        INSERT INTO logs (user_id, action, details, timestamp)
        VALUES (${userId}, ${action}, ${details}, CURRENT_TIMESTAMP)
      `;
    } catch (error) {
      console.error('Database addLog error:', error);
    }
  } else {
    // 回退到内存存储
    const logs = global.__appLogs || [];
    logs.push({
      userId,
      timestamp: new Date(),
      action,
      details
    });
  }
}

export async function getUserLogs(userId: string) {
  await ensureDatabaseInitialized();
  
  if (useDatabase()) {
    try {
      const result = await sql`
        SELECT * FROM logs WHERE user_id = ${userId} ORDER BY timestamp DESC
      `;
      
      return result.rows.map(row => ({
        userId: row.user_id,
        timestamp: new Date(row.timestamp),
        action: row.action,
        details: row.details
      }));
    } catch (error) {
      console.error('Database getUserLogs error:', error);
      return [];
    }
  } else {
    // 回退到内存存储
    const logs = global.__appLogs || [];
    return logs.filter(log => log.userId === userId);
  }
}

export async function getAllLogs() {
  await ensureDatabaseInitialized();
  
  if (useDatabase()) {
    try {
      const result = await sql`
        SELECT * FROM logs ORDER BY timestamp DESC
      `;
      
      return result.rows.map(row => ({
        userId: row.user_id,
        timestamp: new Date(row.timestamp),
        action: row.action,
        details: row.details
      }));
    } catch (error) {
      console.error('Database getAllLogs error:', error);
      return [];
    }
  } else {
    // 回退到内存存储
    return global.__appLogs || [];
  }
}

export async function updateUserWebhookConfig(userId: string, config: WebhookConfigData): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseInitialized();
  
  // 验证URL格式
  try {
    new URL(config.url);
  } catch {
    return { success: false, message: 'webhook URL格式无效' };
  }

  if (useDatabase()) {
    try {
      await sql`
        UPDATE users 
        SET webhook_url = ${config.url}, 
            webhook_token = ${config.token || null}, 
            webhook_active = ${config.isActive}
        WHERE id = ${userId}
      `;
      
      await addLog(userId, 'Webhook配置更新', `更新webhook配置: ${config.url}`);
      
      return { success: true, message: 'Webhook配置更新成功' };
    } catch (error) {
      console.error('Database updateUserWebhookConfig error:', error);
      return { success: false, message: '更新失败，请稍后重试' };
    }
  } else {
    // 回退到内存存储
    const users = global.__appUsers || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    user.webhookConfig = {
      url: config.url,
      token: config.token || undefined,
      isActive: config.isActive
    };

    await addLog(userId, 'Webhook配置更新', `更新webhook配置: ${config.url}`);
    
    return { success: true, message: 'Webhook配置更新成功' };
  }
}

export async function getUserWebhookConfig(userId: string): Promise<WebhookConfig | null> {
  await ensureDatabaseInitialized();
  
  if (useDatabase()) {
    try {
      const result = await sql`
        SELECT webhook_url, webhook_token, webhook_active 
        FROM users WHERE id = ${userId} LIMIT 1
      `;
      
      if (result.rows.length === 0 || !result.rows[0].webhook_url) {
        return null;
      }
      
      const userData = result.rows[0];
      return {
        url: userData.webhook_url,
        token: userData.webhook_token,
        isActive: userData.webhook_active
      };
    } catch (error) {
      console.error('Database getUserWebhookConfig error:', error);
      return null;
    }
  } else {
    // 回退到内存存储
    const users = global.__appUsers || [];
    const user = users.find(u => u.id === userId);
    return user?.webhookConfig || null;
  }
}

export async function getUserById(userId: string): Promise<User | undefined> {
  await ensureDatabaseInitialized();
  
  if (useDatabase()) {
    try {
      const result = await sql`
        SELECT * FROM users WHERE id = ${userId} LIMIT 1
      `;
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const userData = result.rows[0];
      return {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        emailVerified: userData.email_verified,
        emailVerificationToken: userData.email_verification_token,
        passwordResetToken: userData.password_reset_token,
        passwordResetExpires: userData.password_reset_expires ? new Date(userData.password_reset_expires) : undefined,
        isAdmin: userData.is_admin,
        webhookConfig: userData.webhook_url ? {
          url: userData.webhook_url,
          token: userData.webhook_token,
          isActive: userData.webhook_active
        } : undefined,
        createdAt: new Date(userData.created_at)
      };
    } catch (error) {
      console.error('Database getUserById error:', error);
      return undefined;
    }
  } else {
    // 回退到内存存储
    const users = global.__appUsers || [];
    return users.find(u => u.id === userId);
  }
}

// 管理员专用函数
export async function getAllUsers(): Promise<User[]> {
  await ensureDatabaseInitialized();
  
  if (useDatabase()) {
    try {
      const result = await sql`
        SELECT * FROM users ORDER BY created_at DESC
      `;
      
      return result.rows.map(userData => ({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        password: '[HIDDEN]', // 隐藏密码
        emailVerified: userData.email_verified,
        isAdmin: userData.is_admin,
        webhookConfig: userData.webhook_url ? {
          url: userData.webhook_url,
          token: userData.webhook_token,
          isActive: userData.webhook_active
        } : undefined,
        createdAt: new Date(userData.created_at)
      })) as User[];
    } catch (error) {
      console.error('Database getAllUsers error:', error);
      return [];
    }
  } else {
    // 回退到内存存储
    const users = global.__appUsers || [];
    return users.map(user => ({
      ...user,
      password: '[HIDDEN]' // 隐藏密码
    })) as User[];
  }
}

export async function toggleUserStatus(adminId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseInitialized();
  
  const admin = await getUserById(adminId);
  
  if (!admin || !admin.isAdmin) {
    return { success: false, message: '权限不足' };
  }

  if (useDatabase()) {
    try {
      const result = await sql`
        SELECT * FROM users WHERE id = ${targetUserId} LIMIT 1
      `;
      
      if (result.rows.length === 0) {
        return { success: false, message: '目标用户不存在' };
      }
      
      const targetUser = result.rows[0];
      
      if (targetUser.is_admin) {
        return { success: false, message: '不能操作管理员账户' };
      }
      
      const newStatus = !targetUser.email_verified;
      
      await sql`
        UPDATE users SET email_verified = ${newStatus} WHERE id = ${targetUserId}
      `;
      
      const action = newStatus ? '启用' : '禁用';
      
      await addLog(adminId, '用户管理', `${action}用户: ${targetUser.username}`);
      await addLog(targetUserId, '账户状态变更', `账户被管理员${action}`);
      
      return { success: true, message: `用户${action}成功` };
    } catch (error) {
      console.error('Database toggleUserStatus error:', error);
      return { success: false, message: '操作失败，请稍后重试' };
    }
  } else {
    // 回退到内存存储
    const users = global.__appUsers || [];
    const targetUser = users.find(u => u.id === targetUserId);
    
    if (!targetUser) {
      return { success: false, message: '目标用户不存在' };
    }

    if (targetUser.isAdmin) {
      return { success: false, message: '不能操作管理员账户' };
    }

    targetUser.emailVerified = !targetUser.emailVerified;
    const action = targetUser.emailVerified ? '启用' : '禁用';
    
    await addLog(adminId, '用户管理', `${action}用户: ${targetUser.username}`);
    await addLog(targetUserId, '账户状态变更', `账户被管理员${action}`);
    
    return { success: true, message: `用户${action}成功` };
  }
}

export async function deleteUser(adminId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseInitialized();
  
  const admin = await getUserById(adminId);
  
  if (!admin || !admin.isAdmin) {
    return { success: false, message: '权限不足' };
  }

  if (useDatabase()) {
    try {
      const result = await sql`
        SELECT * FROM users WHERE id = ${targetUserId} LIMIT 1
      `;
      
      if (result.rows.length === 0) {
        return { success: false, message: '目标用户不存在' };
      }
      
      const targetUser = result.rows[0];
      
      if (targetUser.is_admin) {
        return { success: false, message: '不能删除管理员账户' };
      }
      
      // 删除用户（级联删除日志）
      await sql`
        DELETE FROM users WHERE id = ${targetUserId}
      `;
      
      await addLog(adminId, '用户管理', `删除用户: ${targetUser.username}`);
      
      return { success: true, message: '用户删除成功' };
    } catch (error) {
      console.error('Database deleteUser error:', error);
      return { success: false, message: '删除失败，请稍后重试' };
    }
  } else {
    // 回退到内存存储
    const users = global.__appUsers || [];
    const targetUserIndex = users.findIndex(u => u.id === targetUserId);
    
    if (targetUserIndex === -1) {
      return { success: false, message: '目标用户不存在' };
    }

    const targetUser = users[targetUserIndex];
    
    if (targetUser.isAdmin) {
      return { success: false, message: '不能删除管理员账户' };
    }

    users.splice(targetUserIndex, 1);
    
    await addLog(adminId, '用户管理', `删除用户: ${targetUser.username}`);
    
    return { success: true, message: '用户删除成功' };
  }
}