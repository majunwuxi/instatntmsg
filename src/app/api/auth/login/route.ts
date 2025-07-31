import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '请填写用户名和密码' },
        { status: 400 }
      );
    }

    const result = await loginUser({ username, password });
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}