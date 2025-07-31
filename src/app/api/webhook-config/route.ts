import { NextRequest, NextResponse } from 'next/server';
import { updateUserWebhookConfig, getUserWebhookConfig } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '缺少用户ID' },
        { status: 400 }
      );
    }

    const config = await getUserWebhookConfig(userId);
    
    return NextResponse.json({
      success: true,
      config: config || null
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '获取配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, url, token, isActive } = body;

    if (!userId || !url) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    const result = await updateUserWebhookConfig(userId, {
      url,
      token: token || undefined,
      isActive: isActive !== false // 默认为true
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '更新配置失败' },
      { status: 500 }
    );
  }
}