import { OpenAI } from 'openai'
import contentMeta from '../../content-meta.json'

export default async function handler(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (req.method === 'POST') {
    return handleCreate(req)
  } else if (req.method === 'PUT') {
    return handlePublish(req)
  }

  return new Response('Method not allowed', { status: 405 })
}

async function handleCreate(req: Request) {
  const { description } = await req.json()

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const currentStructure = contentMeta

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `你是一个文档架构师。根据用户的需求和当前文档结构，生成文档更新方案。

当前文档结构:
${JSON.stringify(currentStructure, null, 2)}

请返回 JSON 格式:
{
  "changes": [
    {
      "action": "create" | "modify",
      "path": "guide/09-xxx.md 或 reference/xxx.md",
      "title": "文档标题",
      "content": "完整的 Markdown 内容（包含标题、章节、代码示例等）"
    }
  ],
  "updatedMeta": { ... 更新后的 content-meta.json 结构 }
}

生成的文档内容要求:
- 中文撰写
- 包含实际可用的代码示例
- 结构清晰：概述 → 核心概念 → 步骤指南 → 代码示例 → 常见问题
- 基于 OpenClaw 最新功能和最佳实践`
      },
      { role: 'user', content: description }
    ],
    response_format: { type: 'json_object' }
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')

  const updateRecord = {
    id: Date.now().toString(),
    description,
    status: 'draft' as const,
    createdAt: new Date().toISOString(),
    changes: result.changes?.map((c: any) => ({
      action: c.action,
      path: c.path,
      title: c.title
    })),
    _fullChanges: result.changes,
    _updatedMeta: result.updatedMeta
  }

  return new Response(JSON.stringify(updateRecord), {
    headers: { 'Content-Type': 'application/json' }
  })
}

async function handlePublish(req: Request) {
  const { id, action } = await req.json()

  if (action !== 'publish') {
    return new Response('Invalid action', { status: 400 })
  }

  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    return new Response(JSON.stringify({
      status: 'manual',
      message: 'GITHUB_TOKEN not configured. Please apply changes manually.'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ status: 'published', id }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
