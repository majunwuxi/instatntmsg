'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';

interface AdminPanelProps {
  admin: User;
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
  hasWebhookConfig: boolean;
  createdAt: string;
}

export default function AdminPanel({ admin }: AdminPanelProps) {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<'users' | 'email'>('users');

  // 加载用户列表
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users?adminId=${admin.id}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        setMessage(data.message || '加载用户列表失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [admin.id, activeTab]);

  const handleUserAction = async (action: 'toggle' | 'delete', targetUserId: string) => {
    if (action === 'delete' && !confirm('确定要删除这个用户吗？此操作不可恢复。')) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: admin.id,
          action,
          targetUserId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageType('success');
        await loadUsers(); // 重新加载用户列表
      } else {
        setMessage(data.message || '操作失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">管理员控制台</h2>
        <div className="flex space-x-4 text-sm">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1 rounded ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            用户管理
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1 rounded ${
              activeTab === 'email'
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            邮件配置
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm ${
          messageType === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">用户列表</h3>
            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '刷新中...' : '刷新'}
            </button>
          </div>

          {isLoading && users.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">加载用户列表...</p>
            </div>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Webhook</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {user.username}
                          {user.isAdmin && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              管理员
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            user.emailVerified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.emailVerified ? '已验证' : '未验证'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            user.hasWebhookConfig
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.hasWebhookConfig ? '已配置' : '未配置'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {!user.isAdmin && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUserAction('toggle', user.id)}
                                disabled={isLoading}
                                className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                              >
                                {user.emailVerified ? '禁用' : '启用'}
                              </button>
                              <button
                                onClick={() => handleUserAction('delete', user.id)}
                                disabled={isLoading}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                删除
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {users.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">
                  暂无用户数据
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'email' && (
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">邮件API配置</h3>
          <div className="bg-white border rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resend API Key
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="当前配置: [需要在服务器端检查]"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  需要在服务器环境变量中配置 RESEND_API_KEY
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  发件人邮箱
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="当前配置: [需要在服务器端检查]"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  需要在服务器环境变量中配置 FROM_EMAIL
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">配置说明</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• 邮件API配置需要修改服务器的 .env.local 文件</li>
                <li>• RESEND_API_KEY: 从 resend.com 获取的API密钥</li>
                <li>• FROM_EMAIL: 验证过的发件人邮箱地址</li>
                <li>• 修改后需要重启服务器才能生效</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}