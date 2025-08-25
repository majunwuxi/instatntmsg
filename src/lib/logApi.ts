/**
 * 日志记录 API 工具函数
 * 提供便捷的方法来调用日志记录 API
 */

export interface LogData {
  userId: string;
  action: string;
  details: string;
}

export interface LogResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    action: string;
    details: string;
    timestamp: string;
  };
}

/**
 * 通过 API 记录日志
 * @param logData 日志数据
 * @returns Promise<LogResponse>
 */
export async function addLogViaAPI(logData: LogData): Promise<LogResponse> {
  try {
    const response = await fetch('/api/logs/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      message: '网络错误: ' + (error instanceof Error ? error.message : '未知错误')
    };
  }
}

/**
 * 记录用户操作日志
 * @param userId 用户ID
 * @param action 操作类型
 * @param details 详细信息
 * @returns Promise<LogResponse>
 */
export async function logUserAction(
  userId: string, 
  action: string, 
  details: string
): Promise<LogResponse> {
  return addLogViaAPI({ userId, action, details });
}

/**
 * 记录系统事件日志
 * @param action 事件类型
 * @param details 详细信息
 * @returns Promise<LogResponse>
 */
export async function logSystemEvent(
  action: string, 
  details: string
): Promise<LogResponse> {
  return addLogViaAPI({ 
    userId: 'system', 
    action, 
    details 
  });
}

/**
 * 记录错误日志
 * @param userId 用户ID（可选，系统错误可为空）
 * @param error 错误信息
 * @param context 错误上下文
 * @returns Promise<LogResponse>
 */
export async function logError(
  error: string, 
  context: string = '', 
  userId: string = 'system'
): Promise<LogResponse> {
  const details = context ? `${context}: ${error}` : error;
  return addLogViaAPI({ 
    userId, 
    action: '错误', 
    details 
  });
}

/**
 * 批量记录日志
 * @param logs 日志数组
 * @returns Promise<LogResponse[]>
 */
export async function addLogsBatch(logs: LogData[]): Promise<LogResponse[]> {
  const promises = logs.map(log => addLogViaAPI(log));
  return Promise.all(promises);
}

/**
 * 测试日志 API 连接
 * @returns Promise<boolean>
 */
export async function testLogAPI(): Promise<boolean> {
  try {
    const response = await fetch('/api/logs/add');
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}
