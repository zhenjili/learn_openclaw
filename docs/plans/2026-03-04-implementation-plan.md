# Learn OpenClaw 综合文档站 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a comprehensive OpenClaw learning documentation site with AI Q&A and dynamic knowledge base update features.

**Architecture:** VitePress static site with custom Vue components for AI chat and knowledge management. Vercel Serverless/Edge Functions handle OpenAI API calls. Knowledge updates go through LLM generation → GitHub API commit → Vercel auto-rebuild.

**Tech Stack:** VitePress, Vue 3, TypeScript, OpenAI API, Vercel Edge Functions, Vercel AI SDK

---

## Task Group A: Project Foundation (sequential)

### Task A1: Initialize project and install dependencies

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `vercel.json`

**Step 1: Initialize git repo and npm project**

Run:
```bash
cd /Users/jiexu/code/learn_openclaw
git init
npm init -y
```

**Step 2: Install dependencies**

Run:
```bash
npm install -D vitepress vue
npm install openai ai
npm install -D @types/node typescript
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["docs/.vitepress/*"]
    }
  },
  "include": ["docs/.vitepress/**/*.ts", "docs/.vitepress/**/*.vue", "api/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create vercel.json**

```json
{
  "buildCommand": "npm run docs:build",
  "outputDirectory": "docs/.vitepress/dist",
  "framework": null,
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" }
  ]
}
```

**Step 5: Create .gitignore**

```
node_modules/
docs/.vitepress/dist/
docs/.vitepress/cache/
.env
.env.local
*.log
.DS_Store
```

**Step 6: Update package.json scripts**

Add to package.json:
```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  }
}
```

**Step 7: Commit**

```bash
git add package.json tsconfig.json vercel.json .gitignore
git commit -m "feat: initialize project with VitePress and dependencies"
```

---

### Task A2: VitePress config and custom theme

**Files:**
- Create: `docs/.vitepress/config.ts`
- Create: `docs/.vitepress/theme/index.ts`
- Create: `docs/.vitepress/theme/style.css`
- Create: `content-meta.json`

**Step 1: Create content-meta.json**

```json
{
  "guide": {
    "text": "学习路径",
    "items": [
      { "text": "第1章: 认识 OpenClaw", "link": "/guide/01-intro" },
      { "text": "第2章: 环境搭建", "link": "/guide/02-setup" },
      { "text": "第3章: 快速上手", "link": "/guide/03-quickstart" },
      { "text": "第4章: 本地文件管理", "link": "/guide/04-local-files" },
      { "text": "第5章: 知识库管理", "link": "/guide/05-knowledge-base" },
      { "text": "第6章: 日程与任务管理", "link": "/guide/06-schedule-tasks" },
      { "text": "第7章: 自动化工作流", "link": "/guide/07-automation" },
      { "text": "第8章: 进阶用法", "link": "/guide/08-advanced" }
    ]
  },
  "reference": {
    "text": "参考手册",
    "items": [
      { "text": "Gateway", "link": "/reference/gateway" },
      { "text": "Agent", "link": "/reference/agent" },
      { "text": "Skills", "link": "/reference/skills" },
      { "text": "Channels", "link": "/reference/channels" },
      { "text": "Automation", "link": "/reference/automation" },
      { "text": "API", "link": "/reference/api" },
      { "text": "Security", "link": "/reference/security" }
    ]
  }
}
```

**Step 2: Create VitePress config**

File: `docs/.vitepress/config.ts`

```ts
import { defineConfig } from 'vitepress'
import contentMeta from '../../content-meta.json'

export default defineConfig({
  title: 'Learn OpenClaw',
  description: '从 0 开始学 OpenClaw - 综合文档站',
  lang: 'zh-CN',
  appearance: 'dark',
  themeConfig: {
    nav: [
      { text: '学习路径', link: '/guide/01-intro' },
      { text: '参考手册', link: '/reference/gateway' },
      { text: '管理', link: '/admin' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: contentMeta.guide.text,
          items: contentMeta.guide.items
        }
      ],
      '/reference/': [
        {
          text: contentMeta.reference.text,
          items: contentMeta.reference.items
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/openclaw/openclaw' }
    ],
    outline: {
      level: [2, 3],
      label: '目录'
    },
    search: {
      provider: 'local'
    },
    footer: {
      message: 'Learn OpenClaw - 从 0 开始学 AI Agent',
      copyright: 'Built with VitePress'
    }
  }
})
```

**Step 3: Create custom theme with dark styling**

File: `docs/.vitepress/theme/style.css`

```css
:root {
  --vp-c-brand-1: #e85d3a;
  --vp-c-brand-2: #d4502f;
  --vp-c-brand-3: #c04525;
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #e85d3a, #ff8a65);
}

.dark {
  --vp-c-bg: #1a1a2e;
  --vp-c-bg-soft: #16213e;
  --vp-c-bg-mute: #0f3460;
  --vp-sidebar-bg-color: #16213e;
}

/* AI Chat floating button */
.ai-chat-trigger {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(232, 93, 58, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  z-index: 100;
  transition: transform 0.2s;
}

.ai-chat-trigger:hover {
  transform: scale(1.1);
}

/* AI Chat panel */
.ai-chat-panel {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 400px;
  max-height: 600px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-chat-header {
  padding: 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-chat-message {
  padding: 10px 14px;
  border-radius: 8px;
  max-width: 85%;
  line-height: 1.5;
  font-size: 14px;
}

.ai-chat-message.user {
  background: var(--vp-c-brand-1);
  color: white;
  align-self: flex-end;
}

.ai-chat-message.assistant {
  background: var(--vp-c-bg-soft);
  align-self: flex-start;
}

.ai-chat-input {
  padding: 12px 16px;
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  gap: 8px;
}

.ai-chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  outline: none;
}

.ai-chat-input button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: white;
  cursor: pointer;
}
```

**Step 4: Create theme entry**

File: `docs/.vitepress/theme/index.ts`

```ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import AiChat from './components/AiChat.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('AiChat', AiChat)
  }
} satisfies Theme
```

**Step 5: Commit**

```bash
git add content-meta.json docs/.vitepress/
git commit -m "feat: add VitePress config and custom dark theme"
```

---

## Task Group B: Vue Components (can parallelize B1 and B2)

### Task B1: AI Chat component

**Files:**
- Create: `docs/.vitepress/theme/components/AiChat.vue`

**Step 1: Create AiChat.vue**

```vue
<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useRoute } from 'vitepress'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const isOpen = ref(false)
const input = ref('')
const messages = ref<Message[]>([])
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement>()
const route = useRoute()

function toggle() {
  isOpen.value = !isOpen.value
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

async function send() {
  const text = input.value.trim()
  if (!text || isLoading.value) return

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  isLoading.value = true
  await scrollToBottom()

  messages.value.push({ role: 'assistant', content: '' })
  const assistantIndex = messages.value.length - 1

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.value.slice(0, -1).map(m => ({
          role: m.role,
          content: m.content
        })),
        currentPage: route.path
      })
    })

    if (!res.ok) throw new Error('API request failed')

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        messages.value[assistantIndex].content += chunk
        await scrollToBottom()
      }
    }
  } catch (e) {
    messages.value[assistantIndex].content = '抱歉，请求出错了，请稍后再试。'
  } finally {
    isLoading.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}
</script>

<template>
  <div class="ai-chat-wrapper">
    <button class="ai-chat-trigger" @click="toggle" :title="isOpen ? '关闭' : '问问知识库'">
      {{ isOpen ? '✕' : '🦞' }}
    </button>

    <Transition name="chat-panel">
      <div v-if="isOpen" class="ai-chat-panel">
        <div class="ai-chat-header">
          <span>问问知识库</span>
          <button @click="toggle" style="background:none;border:none;color:var(--vp-c-text-1);cursor:pointer;font-size:18px;">✕</button>
        </div>
        <div class="ai-chat-messages" ref="messagesContainer">
          <div v-if="messages.length === 0" style="color:var(--vp-c-text-2);text-align:center;padding:40px 20px;font-size:14px;">
            你好！我是 OpenClaw 知识库助手，有什么问题可以问我。
          </div>
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="ai-chat-message"
            :class="msg.role"
          >
            {{ msg.content }}
          </div>
          <div v-if="isLoading && messages[messages.length - 1]?.content === ''" class="ai-chat-message assistant">
            正在思考...
          </div>
        </div>
        <div class="ai-chat-input">
          <input
            v-model="input"
            placeholder="输入你的问题..."
            @keydown="handleKeydown"
            :disabled="isLoading"
          />
          <button @click="send" :disabled="isLoading">发送</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
```

**Step 2: Create custom Layout to include AiChat globally**

File: `docs/.vitepress/theme/Layout.vue`

```vue
<script setup>
import DefaultTheme from 'vitepress/theme'
import AiChat from './components/AiChat.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-bottom>
      <AiChat />
    </template>
  </Layout>
</template>
```

Update `docs/.vitepress/theme/index.ts`:

```ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme
```

**Step 3: Commit**

```bash
git add docs/.vitepress/theme/
git commit -m "feat: add AI chat component with streaming support"
```

---

### Task B2: Knowledge Admin component

**Files:**
- Create: `docs/.vitepress/theme/components/KnowledgeAdmin.vue`
- Create: `docs/admin.md`

**Step 1: Create KnowledgeAdmin.vue**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface UpdateRecord {
  id: string
  description: string
  status: 'pending' | 'generating' | 'draft' | 'published' | 'failed'
  createdAt: string
  changes?: { action: string; path: string; title: string }[]
}

const token = ref('')
const description = ref('')
const isAuthed = ref(false)
const isSubmitting = ref(false)
const currentUpdate = ref<UpdateRecord | null>(null)
const history = ref<UpdateRecord[]>([])
const structure = ref<any>(null)
const statusMessage = ref('')

async function authenticate() {
  if (!token.value.trim()) return
  isAuthed.value = true
  await loadStructure()
  await loadHistory()
}

async function loadStructure() {
  try {
    const res = await fetch('/api/knowledge/structure', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    if (res.ok) structure.value = await res.json()
  } catch (e) {
    statusMessage.value = '加载知识结构失败'
  }
}

async function loadHistory() {
  try {
    const res = await fetch('/api/knowledge/history', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    if (res.ok) history.value = await res.json()
  } catch (e) {
    statusMessage.value = '加载历史记录失败'
  }
}

async function submitUpdate() {
  if (!description.value.trim() || isSubmitting.value) return
  isSubmitting.value = true
  statusMessage.value = '正在分析需求并生成内容...'

  try {
    const res = await fetch('/api/knowledge/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({ description: description.value })
    })

    if (!res.ok) throw new Error('Update request failed')

    const result = await res.json()
    currentUpdate.value = result
    statusMessage.value = '内容生成完成！请预览后确认发布。'
    description.value = ''
    await loadHistory()
  } catch (e) {
    statusMessage.value = '更新失败，请重试。'
  } finally {
    isSubmitting.value = false
  }
}

async function publishUpdate(id: string) {
  try {
    const res = await fetch('/api/knowledge/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({ id, action: 'publish' })
    })
    if (res.ok) {
      statusMessage.value = '发布成功！网站将在几分钟内自动更新。'
      await loadHistory()
    }
  } catch (e) {
    statusMessage.value = '发布失败'
  }
}
</script>

<template>
  <div class="knowledge-admin">
    <div v-if="!isAuthed" class="auth-panel">
      <h2>知识库管理</h2>
      <p>请输入管理员 Token</p>
      <div style="display:flex;gap:8px;max-width:400px;">
        <input v-model="token" type="password" placeholder="Admin Token" @keydown.enter="authenticate"
          style="flex:1;padding:8px 12px;border:1px solid var(--vp-c-divider);border-radius:8px;background:var(--vp-c-bg-soft);color:var(--vp-c-text-1);" />
        <button @click="authenticate"
          style="padding:8px 16px;border:none;border-radius:8px;background:var(--vp-c-brand-1);color:white;cursor:pointer;">
          验证
        </button>
      </div>
    </div>

    <div v-else>
      <h2>知识库管理</h2>

      <!-- Current structure -->
      <div v-if="structure" class="section">
        <h3>当前知识结构</h3>
        <div class="structure-tree">
          <div v-for="(group, key) in structure" :key="key" style="margin-bottom:12px;">
            <strong>{{ group.text }}</strong>
            <ul>
              <li v-for="item in group.items" :key="item.link">{{ item.text }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Update request -->
      <div class="section">
        <h3>描述你的更新需求</h3>
        <textarea v-model="description" rows="4" placeholder="例如：添加 OpenClaw 高阶用例教程，包含多 Agent 协作、自定义 Skill 开发、企业级部署方案等内容"
          style="width:100%;padding:12px;border:1px solid var(--vp-c-divider);border-radius:8px;background:var(--vp-c-bg-soft);color:var(--vp-c-text-1);resize:vertical;font-family:inherit;" />
        <button @click="submitUpdate" :disabled="isSubmitting"
          style="margin-top:8px;padding:10px 20px;border:none;border-radius:8px;background:var(--vp-c-brand-1);color:white;cursor:pointer;">
          {{ isSubmitting ? '生成中...' : '提交更新请求' }}
        </button>
      </div>

      <!-- Status -->
      <div v-if="statusMessage" class="section"
        style="padding:12px;background:var(--vp-c-bg-soft);border-radius:8px;margin-top:16px;">
        {{ statusMessage }}
      </div>

      <!-- Preview -->
      <div v-if="currentUpdate" class="section">
        <h3>预览生成的变更</h3>
        <div v-for="change in currentUpdate.changes" :key="change.path"
          style="padding:8px;border-bottom:1px solid var(--vp-c-divider);">
          <span style="color:var(--vp-c-brand-1);">{{ change.action }}</span>
          {{ change.path }} - {{ change.title }}
        </div>
        <button @click="publishUpdate(currentUpdate.id)"
          style="margin-top:12px;padding:10px 20px;border:none;border-radius:8px;background:#22c55e;color:white;cursor:pointer;">
          确认发布
        </button>
      </div>

      <!-- History -->
      <div v-if="history.length > 0" class="section">
        <h3>更新历史</h3>
        <div v-for="record in history" :key="record.id"
          style="padding:8px;border-bottom:1px solid var(--vp-c-divider);display:flex;justify-content:space-between;">
          <span>{{ record.description }}</span>
          <span :style="{ color: record.status === 'published' ? '#22c55e' : '#eab308' }">{{ record.status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.knowledge-admin {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}
.section {
  margin-top: 24px;
}
.structure-tree ul {
  list-style: none;
  padding-left: 20px;
}
.structure-tree li::before {
  content: '├── ';
  color: var(--vp-c-text-3);
}
</style>
```

**Step 2: Create admin page**

File: `docs/admin.md`

```markdown
---
layout: page
title: 知识库管理
---

<KnowledgeAdmin />
```

Update theme to register component globally in `docs/.vitepress/theme/index.ts`:

```ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import KnowledgeAdmin from './components/KnowledgeAdmin.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('KnowledgeAdmin', KnowledgeAdmin)
  }
} satisfies Theme
```

**Step 3: Commit**

```bash
git add docs/.vitepress/theme/ docs/admin.md
git commit -m "feat: add knowledge admin panel with update workflow"
```

---

## Task Group C: API Endpoints (can parallelize C1, C2, C3)

### Task C1: AI Chat API endpoint

**Files:**
- Create: `api/chat.ts`

**Step 1: Create chat endpoint with streaming**

```ts
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
```

**Step 2: Commit**

```bash
git add api/chat.ts
git commit -m "feat: add AI chat API with OpenAI streaming"
```

---

### Task C2: Knowledge structure API

**Files:**
- Create: `api/knowledge/structure.ts`

**Step 1: Create structure endpoint**

```ts
import fs from 'fs'
import path from 'path'

export default async function handler(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const metaPath = path.join(process.cwd(), 'content-meta.json')
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    return new Response(JSON.stringify(meta), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to read structure' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

**Step 2: Commit**

```bash
git add api/knowledge/structure.ts
git commit -m "feat: add knowledge structure API endpoint"
```

---

### Task C3: Knowledge update API

**Files:**
- Create: `api/knowledge/update.ts`
- Create: `api/knowledge/history.ts`

**Step 1: Create update endpoint**

```ts
import { OpenAI } from 'openai'

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

  // Read current structure for context
  const structureRes = await fetch(new URL('/api/knowledge/structure', req.url), {
    headers: { 'Authorization': req.headers.get('Authorization')! }
  })
  const currentStructure = await structureRes.json()

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

  // In production, store this in a database or KV store
  // For now, we'll return it directly for the client to hold
  return new Response(JSON.stringify(updateRecord), {
    headers: { 'Content-Type': 'application/json' }
  })
}

async function handlePublish(req: Request) {
  const { id, action, changes, updatedMeta } = await req.json()

  if (action !== 'publish') {
    return new Response('Invalid action', { status: 400 })
  }

  // In production: commit changes to GitHub via API
  // For MVP: return success and let admin manually apply
  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    return new Response(JSON.stringify({
      status: 'manual',
      message: 'GITHUB_TOKEN not configured. Please apply changes manually.'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // TODO: Implement GitHub API commit flow
  // 1. Get current tree SHA
  // 2. Create blobs for new/modified files
  // 3. Create new tree
  // 4. Create commit
  // 5. Update ref

  return new Response(JSON.stringify({ status: 'published', id }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

**Step 2: Create history endpoint**

File: `api/knowledge/history.ts`

```ts
export default async function handler(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  // In production, read from database/KV store
  // For MVP, return empty array
  return new Response(JSON.stringify([]), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

**Step 3: Commit**

```bash
git add api/knowledge/
git commit -m "feat: add knowledge update and history API endpoints"
```

---

## Task Group D: Document Content (can parallelize D1 and D2)

### Task D1: Homepage and Guide documents

**Files:**
- Create: `docs/index.md`
- Create: `docs/guide/01-intro.md` through `docs/guide/08-advanced.md`

**Step 1: Create homepage**

File: `docs/index.md`

```markdown
---
layout: home
hero:
  name: Learn OpenClaw
  text: 从 0 开始学 AI Agent
  tagline: 最全面的 OpenClaw 中文学习文档 - 从入门到精通
  actions:
    - theme: brand
      text: 开始学习
      link: /guide/01-intro
    - theme: alt
      text: 参考手册
      link: /reference/gateway
features:
  - title: 系统学习路径
    details: 8 章循序渐进的教程，从安装配置到多 Agent 协作
    icon: 📚
  - title: 模块参考手册
    details: Gateway、Agent、Skills、Channels 等核心模块完整参考
    icon: 📖
  - title: AI 智能问答
    details: 随时向知识库助手提问，获得即时解答
    icon: 🤖
  - title: 动态知识更新
    details: 管理员可通过自然语言描述自动扩展知识库内容
    icon: ✨
---
```

**Step 2: Create guide chapter stubs with real introductory content**

Each file should be created with proper frontmatter and a meaningful overview section. See design doc for chapter topics. Create all 8 files:

- `docs/guide/01-intro.md` - 认识 OpenClaw (what, why, architecture overview)
- `docs/guide/02-setup.md` - 环境搭建 (Node.js, install, API Key, Gateway)
- `docs/guide/03-quickstart.md` - 快速上手 (first message, basic features)
- `docs/guide/04-local-files.md` - 本地文件管理 (file ops, code assist)
- `docs/guide/05-knowledge-base.md` - 知识库管理 (RAG, document indexing)
- `docs/guide/06-schedule-tasks.md` - 日程与任务管理 (Cron, reminders)
- `docs/guide/07-automation.md` - 自动化工作流 (Webhook, Poll, events)
- `docs/guide/08-advanced.md` - 进阶用法 (multi-agent, custom skills)

Each chapter should include:
- Title and overview paragraph
- Key concepts section
- Step-by-step instructions with code examples
- Common issues / FAQ section

**Step 3: Commit**

```bash
git add docs/index.md docs/guide/
git commit -m "feat: add homepage and guide chapters"
```

---

### Task D2: Reference documents

**Files:**
- Create: `docs/reference/gateway.md` through `docs/reference/security.md`

**Step 1: Create 7 reference documents**

Each reference doc should include:
- Module overview
- Configuration options table
- Code examples
- Architecture diagram (mermaid)
- Troubleshooting section

Files:
- `docs/reference/gateway.md` - Gateway 架构、配置、安全
- `docs/reference/agent.md` - Agent Session、上下文、记忆
- `docs/reference/skills.md` - Skills 系统、ClawHub、自定义
- `docs/reference/channels.md` - 20+ 通道配置
- `docs/reference/automation.md` - Webhook/Cron/Poll
- `docs/reference/api.md` - REST API、SDK
- `docs/reference/security.md` - 安全最佳实践

**Step 2: Commit**

```bash
git add docs/reference/
git commit -m "feat: add reference manual documents"
```

---

## Task Group E: Final Integration (sequential, after A-D)

### Task E1: Environment config and final testing

**Files:**
- Create: `.env.example`

**Step 1: Create .env.example**

```
OPENAI_API_KEY=sk-xxx
ADMIN_TOKEN=your-admin-token
GITHUB_TOKEN=ghp_xxx
```

**Step 2: Run local dev server and verify**

```bash
cd /Users/jiexu/code/learn_openclaw
npm run docs:dev
```

Verify:
- Homepage renders with hero section
- Sidebar navigation works for guide and reference
- Dark theme applied
- AI chat button appears at bottom right
- Admin page accessible at /admin

**Step 3: Final commit**

```bash
git add .env.example
git commit -m "feat: add environment config example"
```

---

## Execution Dependency Graph

```
A1 (init) → A2 (config/theme)
                ↓
        ┌───────┼───────┐
        B1      B2      │
      (chat)  (admin)   │
        │       │       │
        └───┬───┘       │
            │           │
        ┌───┼───────────┤
        C1  C2  C3      │
       (api endpoints)  │
        │   │   │       │
        └───┼───┘   ┌───┘
            │       │
            D1      D2
          (guide) (reference)
            │       │
            └───┬───┘
                │
                E1
            (integration)
```

**B1+B2 can run in parallel.**
**C1+C2+C3 can run in parallel.**
**D1+D2 can run in parallel.**
