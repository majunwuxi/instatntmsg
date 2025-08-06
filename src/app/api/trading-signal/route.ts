import { NextRequest, NextResponse } from 'next/server';
import { addLog, getUserWebhookConfig } from '@/lib/auth';

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
    const { userId, symbol, action, price } = body;

    if (!userId || !symbol || !action || !price) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    
    const webhookData = {
      message_type: "EMA_CCI_Signal",
      data: {
        symbol,
        price,
        timestamp,
        action
      }
    };

    // 获取用户的webhook配置
    const userWebhookConfig = await getUserWebhookConfig(userId);

    if (!userWebhookConfig) {
      await addLog(userId, '发送失败', '用户未配置webhook');
      return NextResponse.json(
        { success: false, message: '请先配置您的webhook设置' },
        { status: 400 }
      );
    }

    if (!userWebhookConfig.isActive) {
      await addLog(userId, '发送失败', 'Webhook配置已禁用');
      return NextResponse.json(
        { success: false, message: 'Webhook配置已禁用，请在设置中启用' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userWebhookConfig.token) {
      headers['X-Token'] = userWebhookConfig.token;
    }

    const response = await fetch(userWebhookConfig.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(webhookData),
      signal: AbortSignal.timeout(120000), // 120秒超时
    });

    const signalDetails = `标的: ${symbol}, 动作: ${action}, 价格: ${price}`;
    const webhookUrl = userWebhookConfig.url;
    
    if (response.ok) {
      await addLog(userId, '交易信号发送', `成功发送到 ${webhookUrl} - ${signalDetails}`);
      return NextResponse.json({
        success: true,
        message: '交易信号发送成功',
        data: webhookData
      });
    } else {
      const errorText = await response.text();
      await addLog(userId, '发送失败', `发送到 ${webhookUrl} 失败: ${response.status} - ${errorText}, 信号: ${signalDetails}`);
      return NextResponse.json(
        { success: false, message: `发送失败: ${response.status}` },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('Trading signal API error:', error);
    
    // 检查是否为超时错误
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    const logDetails = isTimeout 
      ? `发送超时（120秒）: ${errorMessage}${body ? `, 信号: ${body.symbol}, 动作: ${body.action}, 价格: ${body.price}` : ''}`
      : `发送异常: ${errorMessage}${body ? `, 信号: ${body.symbol}, 动作: ${body.action}, 价格: ${body.price}` : ''}`;
    
    if (body?.userId) {
      await addLog(body.userId, '发送失败', logDetails);
    }
    
    const message = isTimeout 
      ? '发送超时，接收端处理时间过长' 
      : '网络错误，请重试';
    
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}