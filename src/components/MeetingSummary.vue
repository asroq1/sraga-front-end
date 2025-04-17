<template>
  <div class="chat-section">
    <div class="chat-header">
      <h3>미링이</h3>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div v-for="(message, index) in chatHistory" :key="index" :class="['message', message.role]">
        <div class="message-content" v-html="message.content"></div>
      </div>

      <div v-if="isLoading" class="message assistant">
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <textarea
        v-model="userInput"
        @keydown.enter.prevent="handleEnter"
        placeholder="회의 내용에 대해 질문해보세요..."
        rows="1"
        ref="inputArea"
      ></textarea>
      <button class="send-button" @click="sendQuestion" :disabled="isLoading || !userInput.trim()">
        <span class="material-icon">send</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { marked } from 'marked'
import 'highlight.js/styles/github.css'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const chatHistory = ref<ChatMessage[]>([])
const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const inputArea = ref<HTMLTextAreaElement | null>(null)

const handleEnter = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    sendQuestion()
  }
}

const adjustTextareaHeight = () => {
  if (inputArea.value) {
    inputArea.value.style.height = 'auto'
    inputArea.value.style.height = `${inputArea.value.scrollHeight}px`
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendQuestion = async () => {
  const question = userInput.value.trim()
  if (!question || isLoading.value) return

  const scriptId = localStorage.getItem('scriptId')
  if (!scriptId) {
    alert('스크립트 ID가 없습니다.')
    return
  }

  // 사용자 질문 추가
  chatHistory.value.push({
    role: 'user',
    content: question,
  })
  userInput.value = ''
  adjustTextareaHeight()
  scrollToBottom()

  isLoading.value = true

  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const response = await fetch(`${apiBaseUrl}/openai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script_id: scriptId,
        query: question,
      }),
    })

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder('utf-8')
    let assistantResponse = ''

    chatHistory.value.push({
      role: 'assistant',
      content: '',
    })

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.substring(6).trim()
            if (content && content !== '[DONE]') {
              assistantResponse += content
              chatHistory.value[chatHistory.value.length - 1].content =
                marked(assistantResponse).toString()
              scrollToBottom()
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('오류:', error)
    chatHistory.value.push({
      role: 'assistant',
      content: '죄송합니다. 응답을 생성하는 중에 오류가 발생했습니다.',
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
.chat-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #dadce0;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #dadce0;
  background: #f8f9fa;
}

.chat-header h3 {
  margin: 0;
  color: #202124;
  font-size: 16px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  margin-bottom: 8px;
}

.message.user {
  justify-content: flex-end;
}

.message-content {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
}

.message.user .message-content {
  background: #e3f2fd;
  color: #1565c0;
}

.message.assistant .message-content {
  background: #f5f5f5;
  color: #202124;
}

.chat-input {
  border-top: 1px solid #dadce0;
  padding: 16px;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  background: white;
}

textarea {
  flex: 1;
  border: 1px solid #dadce0;
  border-radius: 8px;
  padding: 8px 12px;
  resize: none;
  max-height: 120px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
}

.send-button {
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-button:hover {
  background: #1557b0;
}

.send-button:disabled {
  background: #dadce0;
  cursor: not-allowed;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #1a73e8;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

:deep(.message-content) {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 1em;
    margin-bottom: 0.5em;
  }

  p {
    margin: 0.5em 0;
  }

  ul,
  ol {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }

  code {
    background: #f6f8fa;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
  }

  pre {
    background: #f6f8fa;
    padding: 1em;
    border-radius: 6px;
    overflow-x: auto;
  }
}
</style>
