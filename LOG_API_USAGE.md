# 日志记录 API 使用指南

## 概述

本项目现在支持两种日志记录方式：
1. **直接函数调用**（原有方式）：在业务逻辑中直接调用 `addLog()` 函数
2. **API 接口调用**（新增方式）：通过 HTTP API 接口记录日志

## API 接口

### 基本信息
- **URL**: `/api/logs/add`
- **方法**: POST
- **Content-Type**: `application/json`

### 请求参数
```json
{
  "userId": "string (必需)",
  "action": "string (必需)", 
  "details": "string (必需)"
}
```

### 响应格式
```json
{
  "success": true,
  "message": "日志记录成功",
  "data": {
    "userId": "user123",
    "action": "用户操作",
    "details": "用户执行了某个操作",
    "timestamp": "2025-01-31T12:34:56.789Z"
  }
}
```

## 使用方式

### 1. 直接 API 调用

#### cURL 示例
```bash
curl -X POST http://localhost:3000/api/logs/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "action": "用户登录",
    "details": "用户通过邮箱登录成功"
  }'
```

#### JavaScript 示例
```javascript
fetch('/api/logs/add', {
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
.then(data => console.log(data));
```

### 2. 使用工具函数

#### 导入工具函数
```typescript
import { 
  addLogViaAPI, 
  logUserAction, 
  logSystemEvent, 
  logError 
} from '@/lib/logApi';
```

#### 记录用户操作
```typescript
// 记录用户操作
const result = await logUserAction(
  'user123', 
  '用户登录', 
  '用户通过邮箱登录成功'
);

if (result.success) {
  console.log('日志记录成功');
} else {
  console.error('日志记录失败:', result.message);
}
```

#### 记录系统事件
```typescript
// 记录系统事件
await logSystemEvent('系统启动', '应用服务启动成功');
```

#### 记录错误日志
```typescript
// 记录错误
await logError('数据库连接失败', '数据库初始化', 'system');
```

#### 批量记录日志
```typescript
import { addLogsBatch } from '@/lib/logApi';

const logs = [
  { userId: 'user1', action: '操作1', details: '详情1' },
  { userId: 'user2', action: '操作2', details: '详情2' }
];

const results = await addLogsBatch(logs);
```

### 3. 测试 API

#### 测试连接
```typescript
import { testLogAPI } from '@/lib/logApi';

const isConnected = await testLogAPI();
console.log('API 连接状态:', isConnected);
```

#### 访问测试页面
访问 `http://localhost:3000/test-log-api` 进行可视化测试。

## 参数验证

API 会进行以下验证：

1. **必需参数检查**: `userId`, `action`, `details` 都必须提供
2. **参数类型检查**: 所有参数必须是字符串类型
3. **参数长度检查**: 参数不能为空
4. **长度限制**: 
   - `action`: 最大 100 字符
   - `details`: 最大 1000 字符

## 错误处理

### 常见错误响应

#### 400 Bad Request
```json
{
  "success": false,
  "message": "缺少必需参数: userId, action, details"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "服务器错误，日志记录失败"
}
```

### 网络错误处理
```typescript
try {
  const result = await logUserAction('user123', '测试', '测试详情');
  if (result.success) {
    console.log('成功');
  } else {
    console.error('失败:', result.message);
  }
} catch (error) {
  console.error('网络错误:', error);
}
```

## 使用场景

### 1. 前端日志记录
```typescript
// 在 React 组件中记录用户操作
const handleButtonClick = async () => {
  try {
    await logUserAction(user.id, '按钮点击', '用户点击了某个按钮');
    // 执行其他操作...
  } catch (error) {
    console.error('记录日志失败:', error);
  }
};
```

### 2. 外部服务调用
```javascript
// 从其他服务调用日志 API
const axios = require('axios');

await axios.post('http://your-domain.com/api/logs/add', {
  userId: 'external-service',
  action: '数据同步',
  details: '从外部服务同步数据成功'
});
```

### 3. 错误监控
```typescript
// 在错误处理中记录日志
window.addEventListener('error', async (event) => {
  await logError(
    event.error?.message || '未知错误',
    '前端错误',
    'browser'
  );
});
```

## 性能考虑

### 1. 异步处理
日志记录是异步操作，不会阻塞主业务流程：
```typescript
// 不阻塞主流程
logUserAction(user.id, '操作', '详情').catch(console.error);

// 继续执行其他操作
doSomethingElse();
```

### 2. 批量处理
对于大量日志，建议使用批量接口：
```typescript
const logs = [];
// 收集日志...
await addLogsBatch(logs);
```

### 3. 错误容错
日志记录失败不应影响主业务：
```typescript
const recordLog = async (userId: string, action: string, details: string) => {
  try {
    await logUserAction(userId, action, details);
  } catch (error) {
    // 只记录错误，不抛出异常
    console.error('日志记录失败:', error);
  }
};
```

## 安全考虑

1. **参数验证**: API 会验证所有输入参数
2. **长度限制**: 防止恶意大量数据
3. **错误信息**: 不暴露敏感信息
4. **权限控制**: 建议在生产环境中添加认证

## 与原有方式的对比

| 特性 | 直接函数调用 | API 接口调用 |
|------|-------------|-------------|
| 性能 | 更好（同步） | 稍差（HTTP请求） |
| 可靠性 | 更高 | 依赖网络 |
| 调用范围 | 仅后端代码 | 任何地方 |
| 解耦程度 | 低 | 高 |
| 跨服务调用 | 不支持 | 支持 |
| 实现复杂度 | 简单 | 需要网络处理 |

## 建议使用场景

### 使用直接函数调用的情况：
- 后端业务逻辑中的日志记录
- 对性能要求较高的场景
- 简单的内部日志记录

### 使用 API 接口的情况：
- 前端需要记录日志
- 外部服务需要记录日志
- 需要跨服务调用
- 需要更好的解耦

## 总结

新的日志记录 API 为项目提供了更灵活的日志记录方式，可以根据具体需求选择合适的方式。建议在开发过程中使用测试页面验证 API 功能，在生产环境中注意错误处理和性能优化。
