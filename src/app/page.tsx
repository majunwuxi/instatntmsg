'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import TradingSignalForm from '@/components/TradingSignalForm';
import LogsViewer from '@/components/LogsViewer';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import WebhookConfig from '@/components/WebhookConfig';
import AdminPanel from '@/components/AdminPanel';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  useEffect(() => {
    // 检查URL参数中的验证状态或错误消息
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    const error = urlParams.get('error');

    if (verified === 'true') {
      setMessage('邮箱验证成功！现在可以登录了');
      setMessageType('success');
      // 清理URL参数
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      setMessage(decodeURIComponent(error));
      setMessageType('error');
      // 清理URL参数
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (user) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {user.isAdmin ? '管理员控制台' : '交易信号发送器'}
            </h1>
            <div className="flex space-x-4 text-sm">
              {user.isAdmin ? (
                // 管理员导航
                <>
                  <button
                    onClick={() => {
                      setShowLogs(!showLogs);
                      setShowWebhookConfig(false);
                    }}
                    className={`hover:text-blue-800 ${showLogs ? 'text-blue-800 font-medium' : 'text-blue-600'}`}
                  >
                    系统日志
                  </button>
                </>
              ) : (
                // 普通用户导航
                <>
                  <button
                    onClick={() => {
                      setShowLogs(false);
                      setShowWebhookConfig(false);
                    }}
                    className={`hover:text-blue-800 ${!showLogs && !showWebhookConfig ? 'text-blue-800 font-medium' : 'text-blue-600'}`}
                  >
                    发送信号
                  </button>
                  <button
                    onClick={() => {
                      setShowLogs(false);
                      setShowWebhookConfig(!showWebhookConfig);
                    }}
                    className={`hover:text-blue-800 ${showWebhookConfig ? 'text-blue-800 font-medium' : 'text-blue-600'}`}
                  >
                    Webhook设置
                  </button>
                  <button
                    onClick={() => {
                      setShowLogs(!showLogs);
                      setShowWebhookConfig(false);
                    }}
                    className={`hover:text-blue-800 ${showLogs ? 'text-blue-800 font-medium' : 'text-blue-600'}`}
                  >
                    查看日志
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800"
              >
                退出登录
              </button>
            </div>
          </div>
          <div className="mb-4 text-sm text-gray-600">
            欢迎，{user.username}
            {user.isAdmin && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                超级管理员
              </span>
            )}
          </div>
          
          {user.isAdmin ? (
            // 管理员界面
            showLogs ? (
              <LogsViewer userId={user.id} />
            ) : (
              <AdminPanel admin={user} />
            )
          ) : (
            // 普通用户界面
            showWebhookConfig ? (
              <WebhookConfig user={user} />
            ) : showLogs ? (
              <LogsViewer userId={user.id} />
            ) : (
              <TradingSignalForm user={user} />
            )
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          交易信号发送器
        </h1>
        
        {message && (
          <div className={`mb-4 p-3 rounded text-sm ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}
        
        {showForgotPassword ? (
          <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
        ) : showRegister ? (
          <>
            <RegisterForm onSuccess={handleLoginSuccess} />
            <div className="mt-4 text-center space-y-2">
              <button
                onClick={() => setShowRegister(false)}
                className="block w-full text-sm text-blue-600 hover:text-blue-800"
              >
                已有账户？点击登录
              </button>
            </div>
          </>
        ) : (
          <>
            <LoginForm onSuccess={handleLoginSuccess} />
            <div className="mt-4 text-center space-y-2">
              <button
                onClick={() => setShowRegister(true)}
                className="block w-full text-sm text-blue-600 hover:text-blue-800"
              >
                没有账户？点击注册
              </button>
              <button
                onClick={() => setShowForgotPassword(true)}
                className="block w-full text-sm text-gray-600 hover:text-gray-800"
              >
                忘记密码？
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}