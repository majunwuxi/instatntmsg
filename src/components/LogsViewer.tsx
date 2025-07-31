'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
  userId: string;
  timestamp: Date;
  action: string;
  details: string;
}

interface LogsViewerProps {
  userId: string;
}

export default function LogsViewer({ userId }: LogsViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/logs?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        // 按时间戳倒序排列，最新的在最上面
        const sortedLogs = data.logs.sort((a: LogEntry, b: LogEntry) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        setLogs(sortedLogs);
      } else {
        setError(data.message || '获取日志失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">操作日志</h2>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {logs.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          暂无操作记录
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className={`border rounded-lg p-4 ${
              index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-800">{log.action}</span>
                  {index === 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      最新
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {log.details}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}