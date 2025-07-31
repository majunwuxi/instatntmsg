import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: '请提供邮箱地址' },
        { status: 400 }
      );
    }

    const result = await sendVerificationEmail(email);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Send verification email error:', error);
    return NextResponse.json(
      { success: false, message: '发送验证邮件失败，请稍后重试' },
      { status: 500 }
    );
  }
}