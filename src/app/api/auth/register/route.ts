import { NextRequest, NextResponse } from 'next/server';
import { registerUser, sendVerificationEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    const result = registerUser({ username, email, password });
    
    if (result.success && result.needsVerification) {
      // 直接调用发送验证邮件函数
      try {
        await sendVerificationEmail(email);
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: '注册成功！请检查您的邮箱并点击验证链接完成注册',
        needsVerification: true
      });
    } else if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}