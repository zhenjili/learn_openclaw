# Learn OpenClaw

OpenClaw 中文学习文档站，基于 VitePress 构建，内置 AI 问答和知识库管理功能。

## 技术栈

- **VitePress** + **Vue 3** + **TypeScript** — 静态文档站点生成
- **Vercel Edge Functions** — Serverless API
- **OpenAI API** (GPT-4O / GPT-4O-mini) — AI 聊天与内容生成

## 项目结构

```
├── api/                        # Vercel Serverless Functions
│   ├── chat.ts                 # AI 问答接口（流式响应）
│   └── knowledge/              # 知识库管理 API
│       ├── structure.ts        #   获取文档结构
│       ├── update.ts           #   创建/发布内容
│       └── history.ts          #   更新历史
├── docs/                       # 文档内容
│   ├── .vitepress/
│   │   ├── config.ts           # VitePress 配置
│   │   └── theme/              # 自定义主题
│   │       ├── components/
│   │       │   ├── AiChat.vue          # AI 聊天悬浮组件
│   │       │   └── KnowledgeAdmin.vue  # 知识库管理后台
│   │       ├── Layout.vue      # 自定义布局
│   │       └── style.css       # 主题样式
│   ├── index.md                # 首页
│   ├── admin.md                # 管理后台页
│   ├── guide/                  # 学习路径（9 章）
│   │   ├── 01-intro.md         #   OpenClaw 简介
│   │   ├── 02-setup.md         #   环境搭建
│   │   ├── 03-quickstart.md    #   快速上手
│   │   ├── 04-local-files.md   #   本地文件管理
│   │   ├── 05-knowledge-base.md#   知识库管理
│   │   ├── 06-schedule-tasks.md#   定时任务
│   │   ├── 07-automation.md    #   自动化工作流
│   │   ├── 08-advanced.md      #   高级用法
│   │   └── 09-security.md      #   安全配置
│   └── reference/              # 参考文档（7 个模块）
│       ├── gateway.md          #   Gateway 核心进程
│       ├── agent.md            #   Agent / LLM 集成
│       ├── skills.md           #   技能系统
│       ├── channels.md         #   通信渠道
│       ├── automation.md       #   自动化
│       ├── api.md              #   REST API
│       └── security.md         #   安全
├── content-meta.json           # 导航结构元数据
├── vercel.json                 # Vercel 部署配置
├── tsconfig.json               # TypeScript 配置
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm

### 安装

```bash
git clone <repo-url>
cd learn_openclaw
npm install
```

### 配置环境变量

复制 `.env.example` 并填入实际值：

```bash
cp .env.example .env
```

| 变量 | 说明 | 必填 |
|------|------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥，用于 AI 聊天和内容生成 | 是 |
| `ADMIN_TOKEN` | 管理后台认证令牌 | 是 |
| `GITHUB_TOKEN` | GitHub Token，用于自动发布内容 | 否 |

### 本地开发

```bash
npm run docs:dev
```

站点默认运行在 `http://localhost:5173`。

### 构建

```bash
npm run docs:build
```

构建产物输出到 `docs/.vitepress/dist`。

### 预览构建产物

```bash
npm run docs:preview
```

## 部署

项目配置为部署到 **Vercel**：

1. 将仓库关联到 Vercel
2. 在 Vercel 项目设置中配置环境变量
3. 推送代码即自动部署

## 功能特性

- **中文学习文档** — 从入门到高级的 9 章完整学习路径 + 7 个参考模块
- **AI 智能问答** — 每个页面右下角的 AI 聊天组件，基于当前页面上下文回答问题
- **知识库管理后台** — 通过自然语言生成文档，支持预览和一键发布
- **暗色主题** — 默认暗色 UI
- **本地搜索** — 内置全文搜索

## API 接口

| 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/chat` | POST | 无 | AI 问答（流式响应） |
| `/api/knowledge/structure` | GET | Bearer Token | 获取文档结构 |
| `/api/knowledge/update` | POST / PUT | Bearer Token | 创建 / 发布文档 |
| `/api/knowledge/history` | GET | Bearer Token | 更新历史 |

## License

ISC
