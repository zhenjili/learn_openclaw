<script setup lang="ts">
import { ref } from 'vue'

interface Change {
  action: string
  path: string
  title: string
  content?: string
}

interface UpdateRecord {
  id: string
  description: string
  status: 'pending' | 'generating' | 'draft' | 'published' | 'failed'
  createdAt: string
  changes?: Change[]
  _fullChanges?: Change[]
  _updatedMeta?: any
}

const token = ref('')
const description = ref('')
const isAuthed = ref(false)
const isSubmitting = ref(false)
const isPublishing = ref(false)
const currentUpdate = ref<UpdateRecord | null>(null)
const history = ref<UpdateRecord[]>([])
const structure = ref<any>(null)
const statusMessage = ref('')
const expandedChange = ref<number | null>(null)

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
  statusMessage.value = '正在分析需求并生成内容（可能需要 10-30 秒）...'
  currentUpdate.value = null
  expandedChange.value = null

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
    statusMessage.value = `生成完成！共 ${result._fullChanges?.length || 0} 个文件变更，请预览后确认发布。`
    description.value = ''
  } catch (e) {
    statusMessage.value = '更新失败，请重试。'
  } finally {
    isSubmitting.value = false
  }
}

function togglePreview(index: number) {
  expandedChange.value = expandedChange.value === index ? null : index
}

async function publishUpdate() {
  if (!currentUpdate.value || isPublishing.value) return
  isPublishing.value = true
  statusMessage.value = '正在发布到 GitHub...'

  try {
    const res = await fetch('/api/knowledge/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({
        id: currentUpdate.value.id,
        action: 'publish',
        changes: currentUpdate.value._fullChanges,
        updatedMeta: currentUpdate.value._updatedMeta
      })
    })

    const result = await res.json()
    if (result.status === 'manual') {
      statusMessage.value = '提示：GITHUB_TOKEN 未配置，请手动将生成的内容添加到仓库。你可以复制下方预览的 Markdown 内容。'
    } else if (result.status === 'published') {
      statusMessage.value = '发布成功！网站将在几分钟内自动更新。'
      currentUpdate.value = null
    } else {
      statusMessage.value = '发布失败，请重试。'
    }
  } catch (e) {
    statusMessage.value = '发布失败，请重试。'
  } finally {
    isPublishing.value = false
  }
}

function copyContent(content: string) {
  navigator.clipboard.writeText(content)
  statusMessage.value = '已复制到剪贴板！'
  setTimeout(() => { statusMessage.value = '' }, 2000)
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

      <div v-if="statusMessage" class="status-bar">
        {{ statusMessage }}
      </div>

      <!-- Preview generated changes -->
      <div v-if="currentUpdate && currentUpdate._fullChanges" class="section">
        <h3>预览生成的变更（{{ currentUpdate._fullChanges.length }} 个文件）</h3>

        <div v-for="(change, index) in currentUpdate._fullChanges" :key="index" class="change-item">
          <div class="change-header" @click="togglePreview(index)">
            <span class="change-action" :class="change.action">{{ change.action === 'create' ? '新增' : '修改' }}</span>
            <span class="change-path">{{ change.path }}</span>
            <span class="change-title">{{ change.title }}</span>
            <span class="change-toggle">{{ expandedChange === index ? '收起' : '展开预览' }}</span>
          </div>
          <div v-if="expandedChange === index" class="change-content">
            <div class="content-actions">
              <button @click="copyContent(change.content || '')" class="copy-btn">复制 Markdown</button>
            </div>
            <pre class="content-preview">{{ change.content }}</pre>
          </div>
        </div>

        <div style="margin-top:16px;display:flex;gap:12px;">
          <button @click="publishUpdate" :disabled="isPublishing"
            style="padding:10px 20px;border:none;border-radius:8px;background:#22c55e;color:white;cursor:pointer;">
            {{ isPublishing ? '发布中...' : '确认发布到 GitHub' }}
          </button>
          <button @click="currentUpdate = null"
            style="padding:10px 20px;border:none;border-radius:8px;background:var(--vp-c-bg-soft);color:var(--vp-c-text-1);cursor:pointer;border:1px solid var(--vp-c-divider);">
            取消
          </button>
        </div>
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
.status-bar {
  padding: 12px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  margin-top: 16px;
  border-left: 3px solid var(--vp-c-brand-1);
}
.change-item {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}
.change-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background: var(--vp-c-bg-soft);
}
.change-header:hover {
  background: var(--vp-c-bg-mute);
}
.change-action {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.change-action.create {
  background: #22c55e20;
  color: #22c55e;
}
.change-action.modify {
  background: #eab30820;
  color: #eab308;
}
.change-path {
  font-family: monospace;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.change-title {
  flex: 1;
}
.change-toggle {
  font-size: 13px;
  color: var(--vp-c-brand-1);
}
.change-content {
  border-top: 1px solid var(--vp-c-divider);
}
.content-actions {
  padding: 8px 16px;
  display: flex;
  justify-content: flex-end;
}
.copy-btn {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 13px;
}
.copy-btn:hover {
  background: var(--vp-c-bg-soft);
}
.content-preview {
  padding: 16px;
  margin: 0;
  max-height: 400px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--vp-c-bg);
}
</style>
