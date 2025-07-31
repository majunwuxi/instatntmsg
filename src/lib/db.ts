import { sql } from '@vercel/postgres';

// 初始化数据库表
export async function initializeDatabase() {
  try {
    // 创建用户表
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token TEXT,
        password_reset_token TEXT,
        password_reset_expires TIMESTAMP,
        is_admin BOOLEAN DEFAULT FALSE,
        webhook_url TEXT,
        webhook_token TEXT,
        webhook_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 创建日志表
    await sql`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// 检查管理员用户是否存在，如果不存在则创建
export async function ensureAdminUser() {
  try {
    const result = await sql`
      SELECT * FROM users WHERE username = 'admin' LIMIT 1
    `;

    if (result.rows.length === 0) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const adminPassword = process.env.ADMIN_PASSWORD || (isDevelopment ? 'admin123' : '');
      
      if (!adminPassword) {
        throw new Error('生产环境必须设置 ADMIN_PASSWORD 环境变量');
      }

      // 使用简单的SHA256哈希（与原代码保持一致）
      const crypto = await import('crypto');
      const hashedPassword = crypto.createHash('sha256').update(adminPassword).digest('hex');

      await sql`
        INSERT INTO users (
          id, username, email, password, email_verified, is_admin, created_at
        ) VALUES (
          ${`admin-${Date.now()}`}, 'admin', 'admin@system.local', 
          ${hashedPassword}, TRUE, TRUE, CURRENT_TIMESTAMP
        )
      `;

      // 添加初始化日志
      const adminResult = await sql`
        SELECT id FROM users WHERE username = 'admin' LIMIT 1
      `;
      
      if (adminResult.rows.length > 0) {
        await sql`
          INSERT INTO logs (user_id, action, details)
          VALUES (${adminResult.rows[0].id}, '系统初始化', '超级用户admin创建成功')
        `;
      }

      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error ensuring admin user:', error);
    throw error;
  }
}

// 初始化数据库（在应用启动时调用）
export async function initDB() {
  // 只在有数据库连接时才初始化
  if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
    await initializeDatabase();
    await ensureAdminUser();
  }
}