# Learn OpenClaw - 综合文档站设计

## 概述

构建一个 OpenClaw 综合学习文档站，包含从入门到高级的完整学习路径和模块参考手册，集成 AI 问答和知识库动态更新功能。

## 技术栈

- **前端框架**: VitePress (Vue 生态静态文档生成器)
- **AI 问答**: OpenAI API (通过 Vercel Serverless Functions)
- **知识库更新**: OpenAI API + GitHub API (LLM 生成内容 + Git 提交)
- **部署**: Vercel (静态托管 + Serverless Functions)

## 项目结构

```
learn_openclaw/
├── docs/                        # VitePress 文档源码
│   ├── .vitepress/
│   │   ├── config.ts            # VitePress 配置 (sidebar 从 content-meta.json 动态读取)
│   │   └── theme/
│   │       ├── components/
│   │       │   ├── AiChat.vue          # AI 问答组件
│   │       │   └── KnowledgeAdmin.vue  # 知识库管理面板
│   │       └── index.ts
│   ├── index.md                 # 首页
│   ├── guide/                   # 学习路径 (入门 → 进阶)
│   │   ├── 01-intro.md
│   │   ├── 02-setup.md
│   │   ├── 03-quickstart.md
│   │   ├── 04-local-files.md
│   │   ├── 05-knowledge-base.md
│   │   ├── 06-schedule-tasks.md
│   │   ├── 07-automation.md
│   │   └── 08-advanced.md
│   └── reference/               # 模块参考手册
│       ├── gateway.md
│       ├── agent.md
│       ├── skills.md
│       ├── channels.md
│       ├── automation.md
│       ├── api.md
│       └── security.md
├── api/                         # Vercel Serverless Functions
│   ├── chat.ts                  # AI 问答接口
│   └── knowledge/
│       ├── update.ts            # 知识库更新 (接收描述 → LLM 生成 → 写入 Git)
│       ├── structure.ts         # 获取当前知识结构
│       └── history.ts           # 更新历史
├── scripts/
│   ├── build-search-index.ts    # 构建文档向量索引
│   └── doc-template.ts          # 文档生成模板
├── content-meta.json            # 文档结构元数据 (sidebar 源)
├── package.json
├── vercel.json
└── tsconfig.json
```

## 功能模块

### 1. 文档内容 (学习路径 + 参考手册)

**学习路径 (guide/)**:
- 第1章: 认识 OpenClaw - 什么是 OpenClaw、vs ChatGPT/Copilot、核心架构
- 第2章: 环境搭建 - Node.js、安装、API Key 配置、Gateway 启动
- 第3章: 快速上手 - 第一条消息、基础功能测试、人设配置
- 第4章: 本地文件管理 - 文件读写、目录操作、代码辅助
- 第5章: 知识库管理 - 文档索引、RAG、知识检索
- 第6章: 日程与任务管理 - Cron 任务、提醒、自动化调度
- 第7章: 自动化工作流 - Webhook、Poll、事件驱动
- 第8章: 进阶用法 - 多 Agent 协作、自定义 Skills、性能优化

**参考手册 (reference/)**:
- Gateway: 架构、配置、安全、部署
- Agent: Session、上下文、记忆系统
- Skills: 内置技能、ClawHub、自定义开发
- Channels: 20+ 通道接入配置
- Automation: Webhook/Cron/Poll 详解
- API: REST API、SDK 使用
- Security: 安全最佳实践

### 2. AI 问答功能

- 前端 AiChat.vue 组件，浮动在页面右下角
- 用户提问后，通过 `/api/chat` 调用 OpenAI API
- 上下文增强: 将当前页面内容 + 相关文档片段作为 context 发送
- 流式响应 (SSE)

### 3. 知识库动态更新

**工作流程**:
1. 管理员在 KnowledgeAdmin 面板描述更新需求
2. `/api/knowledge/update` 接收请求
3. 读取 content-meta.json 获取当前文档结构
4. 调用 OpenAI API，传入当前结构 + 用户需求，生成:
   - 更新后的文档目录结构
   - 新增/修改的 Markdown 内容
5. 通过 GitHub API 提交到仓库
6. Vercel Git 集成自动触发重新构建

**安全机制**:
- 管理员 Token 验证
- 内容生成后先存为 draft，预览确认后发布
- 更新历史记录，支持回滚

## 设计风格

- 深色主题为主 (参考截图)
- 左侧固定 sidebar 导航
- 右上角 AI 问答入口
- 管理面板通过特定路由访问 (/admin)

## 部署方案

- Vercel 部署，Git 集成自动 CI/CD
- Serverless Functions 处理 AI 问答和知识库更新
- 环境变量: OPENAI_API_KEY, ADMIN_TOKEN, GITHUB_TOKEN
