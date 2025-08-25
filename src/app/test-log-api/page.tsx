'use client';

import { useState } from 'react';
import { addLogViaAPI, logUserAction, logSystemEvent, logError, testLogAPI } from '@/lib/logApi';

export default function TestLogAPI() {
  const [userId, setUserId] = useState('test-user-123');
  const [action, setAction] = useState('测试操作');
  const [details, setDetails] = useState('这是一个测试日志记录');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/logs/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action,
          details,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: '网络错误: ' + (error instanceof Error ? error.message : '未知错误')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAPI = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const isConnected = await testLogAPI();
      setResult({
        success: isConnected,
        message: isConnected ? 'API 连接正常' : 'API 连接失败'
      });
    } catch (error) {
      setResult({
        success: false,
        message: '网络错误: ' + (error instanceof Error ? error.message : '未知错误')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTest = async (type: 'user' | 'system' | 'error') => {
    setIsLoading(true);
    setResult(null);

    try {
      let response;
      switch (type) {
        case 'user':
          response = await logUserAction('test-user', '快速测试', '用户操作测试');
          break;
        case 'system':
          response = await logSystemEvent('系统测试', '系统事件测试');
          break;
        case 'error':
          response = await logError('测试错误', '错误测试上下文');
          break;
      }
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: '网络错误: ' + (error instanceof Error ? error.message : '未知错误')
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">日志记录 API 测试</h1>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">API 说明</h2>
          <p className="text-blue-700 text-sm">
            这个页面用于测试新创建的日志记录 API。您可以通过表单提交日志记录，或者查看 API 的使用说明。
          </p>
        </div>

        <div className="mb-6 space-y-2">
          <button
            onClick={handleTestAPI}
            disabled={isLoading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 mr-2"
          >
            {isLoading ? '测试中...' : '测试 API 连接'}
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleQuickTest('user')}
              disabled={isLoading}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              用户日志测试
            </button>
            <button
              onClick={() => handleQuickTest('system')}
              disabled={isLoading}
              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              系统日志测试
            </button>
            <button
              onClick={() => handleQuickTest('error')}
              disabled={isLoading}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
            >
              错误日志测试
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入用户ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              操作类型 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入操作类型"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              详细信息 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入详细信息"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? '提交中...' : '提交日志记录'}
          </button>
        </form>

        {result && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">API 响应结果</h3>
            <div className={`p-4 rounded border ${
              result.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="text-sm font-medium text-gray-800 mb-2">使用示例</h3>
          <div className="text-xs text-gray-600 space-y-2">
            <p><strong>cURL 示例:</strong></p>
            <pre className="bg-white p-2 rounded border overflow-x-auto">
{`curl -X POST http://localhost:3000/api/logs/add \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": "user123",
    "action": "用户登录",
    "details": "用户通过邮箱登录成功"
  }'`}
            </pre>
            
            <p><strong>JavaScript 示例:</strong></p>
            <pre className="bg-white p-2 rounded border overflow-x-auto">
{`fetch('/api/logs/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'user123',
    action: '用户操作',
    details: '用户执行了某个操作'
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
