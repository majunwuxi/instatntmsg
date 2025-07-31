import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, toggleUserStatus, deleteUser, getUserById } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: '缺少管理员ID' },
        { status: 400 }
      );
    }

    const admin = await getUserById(adminId);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    const users = await getAllUsers();
    
    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        isAdmin: user.isAdmin,
        hasWebhookConfig: !!user.webhookConfig,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, action, targetUserId } = body;

    if (!adminId || !action || !targetUserId) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    const admin = await getUserById(adminId);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    let result;
    
    switch (action) {
      case 'toggle':
        result = await toggleUserStatus(adminId, targetUserId);
        break;
      case 'delete':
        result = await deleteUser(adminId, targetUserId);
        break;
      default:
        return NextResponse.json(
          { success: false, message: '无效的操作类型' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '操作失败' },
      { status: 500 }
    );
  }
}