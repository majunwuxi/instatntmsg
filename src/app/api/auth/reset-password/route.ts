import { NextRequest, NextResponse } from 'next/server';
import { resetPassword, getUserByResetToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: '密码长度至少6位' },
        { status: 400 }
      );
    }

    const result = resetPassword(token, newPassword);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '重置密码失败，请重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: '缺少重置令牌' },
        { status: 400 }
      );
    }

    const user = getUserByResetToken(token);
    
    if (user) {
      return NextResponse.json({
        success: true,
        message: '令牌有效',
        username: user.username
      });
    } else {
      return NextResponse.json(
        { success: false, message: '重置链接无效或已过期' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '验证令牌失败' },
      { status: 500 }
    );
  }
}