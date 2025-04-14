<script setup lang="ts">
import { ref } from 'vue'

// 상태 변수
const meetingText = ref('')
const summaryResult = ref<string | null>(null)
const isProcessing = ref(false)
const errorMessage = ref<string | null>(null)

// 회의 요약 함수
async function generateSummary() {
  if (!meetingText.value.trim()) {
    errorMessage.value = '회의 내용을 입력해주세요.'
    return
  }

  try {
    isProcessing.value = true
    errorMessage.value = null

    // API 호출
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const response = await fetch(`${apiBaseUrl}/openai/summary/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: meetingText.value,
      }),
    })

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }

    const data = await response.json()
    summaryResult.value = data.summary
  } catch (error: any) {
    console.error('요약 오류:', error)
    errorMessage.value = `요약 실패: ${error.message}`
    summaryResult.value = null
  } finally {
    isProcessing.value = false
  }
}

// 초기화 함수
function resetForm() {
  meetingText.value = ''
  summaryResult.value = null
  errorMessage.value = null
}
</script>

<template>
  <div class="meeting-summary">
    <div class="header">
      <h2>📋 회의 요약</h2>
      <p class="description">회의 내용을 입력하면 AI가 자동으로 요약해 드립니다.</p>
    </div>

    <div class="input-container">
      <label for="meeting-text">회의 내용</label>
      <textarea
        id="meeting-text"
        v-model="meetingText"
        placeholder="회의 내용을 입력하세요..."
        rows="8"
        :disabled="isProcessing"
      ></textarea>

      <div class="actions">
        <button
          class="btn-secondary"
          @click="resetForm"
          :disabled="isProcessing || (!meetingText && !summaryResult)"
        >
          <span class="material-icon">refresh</span>
          초기화
        </button>

        <button
          class="btn-primary"
          @click="generateSummary"
          :disabled="isProcessing || !meetingText.trim()"
        >
          <span class="material-icon">summarize</span>
          {{ isProcessing ? '요약 중...' : '요약하기' }}
        </button>
      </div>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="summaryResult" class="summary-result">
      <h3>요약 결과</h3>
      <div class="summary-content">
        {{ summaryResult }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.meeting-summary {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 24px;
  text-align: center;
}

.description {
  color: #666;
  margin-top: 8px;
}

.input-container {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  resize: vertical;
  font-family: inherit;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
}

.btn-primary {
  background-color: #4a90e2;
  color: white;
}

.btn-primary:hover {
  background-color: #3a80d2;
}

.btn-secondary {
  background-color: #f1f1f1;
  color: #555;
}

.btn-secondary:hover {
  background-color: #e5e5e5;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  margin-bottom: 20px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
}

.summary-result {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-result h3 {
  margin-top: 0;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.summary-content {
  line-height: 1.6;
  white-space: pre-line;
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .meeting-summary {
    padding: 16px;
  }

  .input-container {
    padding: 16px;
  }

  .actions {
    flex-direction: column-reverse;
    gap: 8px;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>
