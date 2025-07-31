'use client';

import { useState } from 'react';
import { User, TradingSignal } from '@/types';

interface TradingSignalFormProps {
  user: User;
}

export default function TradingSignalForm({ user }: TradingSignalFormProps) {
  const [symbol, setSymbol] = useState<'MES' | 'N225MC'>('MES');
  const [action, setAction] = useState<'BUY' | 'SELL' | 'FLAT'>('BUY');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/trading-signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          symbol,
          action,
          price: 168.88
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('交易信号发送成功！');
        setMessageType('success');
      } else {
        setMessage(data.message || '发送失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            标的
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="symbol"
                value="MES"
                checked={symbol === 'MES'}
                onChange={(e) => setSymbol(e.target.value as 'MES' | 'N225MC')}
                className="mr-2"
              />
              MES
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="symbol"
                value="N225MC"
                checked={symbol === 'N225MC'}
                onChange={(e) => setSymbol(e.target.value as 'MES' | 'N225MC')}
                className="mr-2"
              />
              N225MC
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            动作
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="BUY"
                checked={action === 'BUY'}
                onChange={(e) => setAction(e.target.value as 'BUY' | 'SELL' | 'FLAT')}
                className="mr-2"
              />
              买入 (BUY)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="SELL"
                checked={action === 'SELL'}
                onChange={(e) => setAction(e.target.value as 'BUY' | 'SELL' | 'FLAT')}
                className="mr-2"
              />
              卖出 (SELL)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="FLAT"
                checked={action === 'FLAT'}
                onChange={(e) => setAction(e.target.value as 'BUY' | 'SELL' | 'FLAT')}
                className="mr-2"
              />
              平仓 (FLAT)
            </label>
          </div>
        </div>

        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <strong>固定价格:</strong> 168.88
        </div>

        {message && (
          <div className={`text-sm p-3 rounded ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium"
        >
          {isLoading ? '发送中...' : '确认'}
        </button>
      </form>
    </div>
  );
}