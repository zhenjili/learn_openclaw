const contentMeta = {
  guide: {
    text: "学习路径",
    items: [
      { text: "第1章: 认识 OpenClaw", link: "/guide/01-intro" },
      { text: "第2章: 环境搭建", link: "/guide/02-setup" },
      { text: "第3章: 快速上手", link: "/guide/03-quickstart" },
      { text: "第4章: 本地文件管理", link: "/guide/04-local-files" },
      { text: "第5章: 知识库管理", link: "/guide/05-knowledge-base" },
      { text: "第6章: 日程与任务管理", link: "/guide/06-schedule-tasks" },
      { text: "第7章: 自动化工作流", link: "/guide/07-automation" },
      { text: "第8章: 进阶用法", link: "/guide/08-advanced" }
    ]
  },
  reference: {
    text: "参考手册",
    items: [
      { text: "Gateway", link: "/reference/gateway" },
      { text: "Agent", link: "/reference/agent" },
      { text: "Skills", link: "/reference/skills" },
      { text: "Channels", link: "/reference/channels" },
      { text: "Automation", link: "/reference/automation" },
      { text: "API", link: "/reference/api" },
      { text: "Security", link: "/reference/security" }
    ]
  }
}

export default async function handler(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  return new Response(JSON.stringify(contentMeta), {
    headers: { 'Content-Type': 'application/json' }
  })
}
