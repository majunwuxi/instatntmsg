import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, token } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, message: '缺少URL参数' },
        { status: 400 }
      );
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, message: 'URL格式无效' },
        { status: 400 }
      );
    }

    // 构建测试数据
    const testData = {
      message_type: "EMA_CCI_Signal",
      data: {
        symbol: "MES",
        price: 168.88,
        timestamp: new Date().toISOString(),
        action: "BUY"
      }
    };

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'TradingSignal-Webhook-Test/1.0'
    };

    if (token) {
      headers['X-Token'] = token;
    }

    // 发送测试请求
    const testResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testData),
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    const responseText = await testResponse.text();

    return NextResponse.json({
      success: true,
      message: 'Webhook测试完成',
      result: {
        status: testResponse.status,
        statusText: testResponse.statusText,
        headers: Object.fromEntries(testResponse.headers.entries()),
        body: responseText.substring(0, 500) // 限制响应长度
      }
    });

  } catch (error) {
    let errorMessage = '测试失败';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = '无法连接到目标URL，请检查URL是否正确';
    } else if (error instanceof Error && error.name === 'AbortError') {
      errorMessage = '请求超时，目标服务器响应太慢';
    } else if (error instanceof Error) {
      errorMessage = `测试失败: ${error.message}`;
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}