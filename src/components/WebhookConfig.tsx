'use client';

import { useState, useEffect } from 'react';
import { User, type WebhookConfig } from '@/types';

interface WebhookConfigProps {
  user: User;
}

export default function WebhookConfig({ user }: WebhookConfigProps) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [initialLoading, setInitialLoading] = useState(true);

  // 加载用户当前配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/webhook-config?userId=${user.id}`);
        const data = await response.json();

        if (data.success && data.config) {
          setUrl(data.config.url || '');
          setToken(data.config.token || '');
          setIsActive(data.config.isActive !== false);
        }
      } catch (error) {
        console.error('加载配置失败:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadConfig();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!url.trim()) {
      setMessage('请输入Webhook URL');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/webhook-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          url: url.trim(),
          token: token.trim() || undefined,
          isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Webhook配置保存成功！');
        setMessageType('success');
      } else {
        setMessage(data.message || '保存失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!url.trim()) {
      setMessage('请先输入URL');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('正在测试连接...');
    setMessageType('success');

    try {
      // 直接测试webhook端点
      const response = await fetch('/api/webhook-config/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          token: token.trim() || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result = data.result;
        if (result.status >= 200 && result.status < 300) {
          setMessage(`✅ 测试成功！服务器响应: ${result.status} ${result.statusText}`);
          setMessageType('success');
        } else {
          setMessage(`⚠️ 连接成功但服务器返回: ${result.status} ${result.statusText}。请检查您的webhook处理逻辑`);
          setMessageType('success');
        }
      } else {
        setMessage(`❌ ${data.message}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('❌ 测试过程中发生网络错误');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">加载配置中...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Webhook配置</h2>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
        <strong>说明：</strong>配置您自己的webhook端点来接收交易信号。每个用户的信号将发送到各自配置的webhook地址。
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700 mb-1">
            Webhook URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            id="webhook-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/webhook"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            交易信号将发送到此URL
          </p>
        </div>

        <div>
          <label htmlFor="webhook-token" className="block text-sm font-medium text-gray-700 mb-1">
            认证Token（可选）
          </label>
          <input
            type="text"
            id="webhook-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="可选的认证token"
          />
          <p className="mt-1 text-xs text-gray-500">
            如果设置，将在请求头中发送 X-Token: {token || '您的token'}
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="webhook-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="webhook-active" className="text-sm text-gray-700">
            启用Webhook（取消勾选将停止发送信号）
          </label>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? '保存中...' : '保存配置'}
          </button>
          
          <button
            type="button"
            onClick={handleTestWebhook}
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isLoading ? '测试中...' : '测试连接'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-800 mb-2">预期的JSON格式：</h3>
        <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
{`{
  "message_type": "EMA_CCI_Signal",
  "data": {
    "symbol": "MES",
    "price": 168.88,
    "timestamp": "2025-07-31T12:34:56.789Z",
    "action": "BUY"
  }
}`}
        </pre>
      </div>
    </div>
  );
}