import { NextRequest, NextResponse } from 'next/server';
import { addLog } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, details } = body;

    // 验证必需参数
    if (!userId || !action || !details) {
      return NextResponse.json(
        { success: false, message: '缺少必需参数: userId, action, details' },
        { status: 400 }
      );
    }

    // 验证参数类型
    if (typeof userId !== 'string' || typeof action !== 'string' || typeof details !== 'string') {
      return NextResponse.json(
        { success: false, message: '参数类型错误: userId, action, details 必须是字符串' },
        { status: 400 }
      );
    }

    // 验证参数长度
    if (userId.length === 0 || action.length === 0 || details.length === 0) {
      return NextResponse.json(
        { success: false, message: '参数不能为空' },
        { status: 400 }
      );
    }

    // 限制参数长度以防止滥用
    if (action.length > 100 || details.length > 1000) {
      return NextResponse.json(
        { success: false, message: '参数长度超出限制: action <= 100, details <= 1000' },
        { status: 400 }
      );
    }

    // 调用现有的 addLog 函数
    await addLog(userId, action, details);

    return NextResponse.json({
      success: true,
      message: '日志记录成功',
      data: {
        userId,
        action,
        details,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Add log API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，日志记录失败' },
      { status: 500 }
    );
  }
}

// 可选：添加 GET 方法用于测试
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: '日志记录API',
    usage: {
      method: 'POST',
      url: '/api/logs/add',
      body: {
        userId: 'string (必需)',
        action: 'string (必需)',
        details: 'string (必需)'
      },
      example: {
        userId: 'user123',
        action: '用户操作',
        details: '用户执行了某个操作'
      }
    }
  });
}
