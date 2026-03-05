<script setup lang="ts">
import { ref } from 'vue'

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

      <div class="section">
        <h3>描述你的更新需求</h3>
        <textarea v-model="description" rows="4" placeholder="例如：添加 OpenClaw 高阶用例教程，包含多 Agent 协作、自定义 Skill 开发、企业级部署方案等内容"
          style="width:100%;padding:12px;border:1px solid var(--vp-c-divider);border-radius:8px;background:var(--vp-c-bg-soft);color:var(--vp-c-text-1);resize:vertical;font-family:inherit;" />
        <button @click="submitUpdate" :disabled="isSubmitting"
          style="margin-top:8px;padding:10px 20px;border:none;border-radius:8px;background:var(--vp-c-brand-1);color:white;cursor:pointer;">
          {{ isSubmitting ? '生成中...' : '提交更新请求' }}
        </button>
      </div>

      <div v-if="statusMessage" class="section"
        style="padding:12px;background:var(--vp-c-bg-soft);border-radius:8px;margin-top:16px;">
        {{ statusMessage }}
      </div>

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
