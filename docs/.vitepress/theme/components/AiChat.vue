<script setup lang="ts">
import { ref, nextTick } from 'vue'
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
