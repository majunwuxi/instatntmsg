import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { initiatePasswordReset } from '@/lib/auth';

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

    const result = initiatePasswordReset(email);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    if (!result.user?.passwordResetToken) {
      return NextResponse.json(
        { success: false, message: '生成重置令牌失败' },
        { status: 500 }
      );
    }

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${result.user.passwordResetToken}`;
    
    const fromEmail = process.env.FROM_EMAIL || 'noreply@yourdomain.com';

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, message: '邮件服务配置错误' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: fromEmail,
      to: [result.user.email],
      subject: '密码重置请求 - 交易信号发送器',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">密码重置请求</h2>
          <p>您好 ${result.user.username}，</p>
          <p>我们收到了您的密码重置请求。请点击下面的链接来重置您的密码：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              重置密码
            </a>
          </div>
          <p>或者复制以下链接到浏览器中打开：</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          <p><strong>注意：</strong>此链接将在24小时后过期。</p>
          <p>如果您没有请求重置密码，请忽略此邮件。您的密码不会被更改。</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            此邮件由交易信号发送器系统自动发送，请勿回复。
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: '密码重置邮件已发送，请检查您的邮箱'
    });

  } catch (error) {
    console.error('Send password reset email error:', error);
    return NextResponse.json(
      { success: false, message: '发送重置邮件失败，请稍后重试' },
      { status: 500 }
    );
  }
}