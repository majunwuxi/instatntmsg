import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: '缺少验证令牌' },
        { status: 400 }
      );
    }

    const result = verifyEmail(token);
    
    if (result.success) {
      // 重定向到登录页面，带有成功消息
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('verified', 'true');
      return NextResponse.redirect(redirectUrl);
    } else {
      // 重定向到错误页面
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('error', encodeURIComponent(result.message));
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('error', encodeURIComponent('验证过程中发生错误'));
    return NextResponse.redirect(redirectUrl);
  }
}