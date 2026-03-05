# API 参考

OpenClaw 提供完整的 REST API，支持消息交互、会话管理、技能操作和自动化控制。

## 认证方式

| 方式 | Header | 适用场景 |
|------|--------|----------|
| API Key | `X-API-Key: your-api-key` | 服务端集成 |
| Bearer Token | `Authorization: Bearer your-token` | 前端应用、OAuth |

## API 端点总览

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/chat` | 发送消息并获取回复 |
| `POST` | `/api/chat/stream` | 流式消息（SSE） |
| `GET` | `/api/sessions` | 获取会话列表 |
| `GET` | `/api/sessions/:id` | 获取会话详情 |
| `DELETE` | `/api/sessions/:id` | 删除会话 |
| `POST` | `/api/sessions/:id/reset` | 重置会话记忆 |
| `GET` | `/api/skills` | 获取已安装技能列表 |
| `POST` | `/api/skills/install` | 安装技能 |
| `DELETE` | `/api/skills/:name` | 卸载技能 |
| `GET` | `/api/automations` | 获取自动化任务列表 |
| `POST` | `/api/automations` | 创建自动化任务 |
| `DELETE` | `/api/automations/:id` | 删除自动化任务 |
| `GET` | `/health` | 健康检查 |

## POST /api/chat

```bash
curl -X POST https://your-gateway.com/api/chat \
  -H "X-API-Key: oc_sk_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "今天上海天气怎么样？",
    "sessionId": "sess_abc123",
    "options": { "model": "gpt-4o", "temperature": 0.7 }
  }'
```

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `message` | string | 是 | 用户消息内容 |
| `sessionId` | string | 否 | 会话 ID（不传则创建新会话） |
| `options.model` | string | 否 | 覆盖默认模型 |
| `options.temperature` | number | 否 | 覆盖默认温度 |
| `options.maxTokens` | number | 否 | 覆盖最大 Token 数 |
| `attachments` | object[] | 否 | 附件列表（文件/图片） |

**响应示例：**

```json
{
  "id": "msg_xyz789",
  "sessionId": "sess_abc123",
  "content": "今天上海天气晴朗，气温 22-28 度，适合外出。",
  "skillsUsed": ["weather-query"],
  "tokenUsage": { "prompt": 156, "completion": 42, "total": 198 },
  "createdAt": "2026-03-04T10:30:00Z"
}
```

## POST /api/chat/stream

使用 Server-Sent Events 获取流式响应。

```javascript
const res = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: { 'X-API-Key': 'oc_sk_abc123', 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '写一首关于春天的诗', sessionId: 'sess_abc123' }),
});
const reader = res.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
  for (const line of lines) {
    const data = JSON.parse(line.slice(6));
    process.stdout.write(data.content);
  }
}
```

## Python SDK 示例

```python
from openclaw import OpenClaw

client = OpenClaw(gateway_url="https://your-gateway.com", api_key="oc_sk_abc123")

# 发送消息
response = client.chat("今天有什么新闻？", session_id="sess_001")
print(response.content)

# 流式输出
for chunk in client.chat_stream("写一篇关于 AI 的文章"):
    print(chunk.content, end="", flush=True)

# 管理会话与技能
sessions = client.sessions.list(status="active")
client.skills.install("clawhub/weather-pro")
```

## 速率限制

| API 端点 | 限制 | 窗口 |
|----------|------|------|
| `/api/chat` | 60 次 | 每分钟 |
| `/api/chat/stream` | 30 次 | 每分钟 |
| `/api/sessions` | 120 次 | 每分钟 |
| `/api/skills` | 30 次 | 每分钟 |

超出限制时返回 `429 Too Many Requests`，响应头包含 `Retry-After` 字段。

## 错误码

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| `UNAUTHORIZED` | 401 | API Key 无效或过期 |
| `FORBIDDEN` | 403 | 无权访问该资源 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `RATE_LIMIT_EXCEEDED` | 429 | 超出速率限制 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `MODEL_UNAVAILABLE` | 503 | LLM 模型暂不可用 |
