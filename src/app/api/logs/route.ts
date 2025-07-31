import { NextRequest, NextResponse } from 'next/server';
import { getUserLogs, getAllLogs } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const logs = await getUserLogs(userId);
      return NextResponse.json({ success: true, logs });
    } else {
      const logs = await getAllLogs();
      return NextResponse.json({ success: true, logs });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '获取日志失败' },
      { status: 500 }
    );
  }
}