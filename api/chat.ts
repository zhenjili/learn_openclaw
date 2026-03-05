import { OpenAI } from 'openai'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { messages, currentPage } = await req.json()

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const systemPrompt = `你是 Learn OpenClaw 知识库助手。你帮助用户学习和使用 OpenClaw（开源 AI 个人助手）。

OpenClaw 核心知识:
- OpenClaw 是一个开源 AI Agent，可本地运行，操作用户电脑
- 架构: Gateway (常驻守护进程) + Agent (LLM 调用) + Session (会话管理)
- 支持 20+ 消息通道: WhatsApp, Telegram, Discord, Slack 等
- Skills 系统: 13,700+ 社区技能，49 个内置技能
- 自动化: Webhook, Cron, Poll 三种触发方式

用户当前浏览页面: ${currentPage || '首页'}

请用中文回答，简洁准确。如果不确定，说明你不确定。`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    stream: true
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) {
          controller.enqueue(encoder.encode(text))
        }
      }
      controller.close()
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  })
}
