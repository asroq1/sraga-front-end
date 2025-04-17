<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
// const scriptId = 'F-k_LQcuSKKNOoYMkdiWcg'
const scriptId = localStorage.getItem('scriptId')
console.log(scriptId)
const scriptText = ref('')
const isExpanded = ref(false)

const meetingText = ref('')
const streamedSummary = ref('') // 실시간 출력용
const summaryResult = ref<string | null>(null)

const summaryData = reactive({
  title: '',
  date: '',
  summary: '',
  discussions: [] as string[],
  decisions: [] as string[],
  actions: [] as string[],
  unresolved: [] as string[],
  keywords: [] as string[],
})

const isProcessing = ref(false)
const errorMessage = ref<string | null>(null)

// const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const apiBaseUrl = 'http://localhost:8000'

// 1. 회의 원문 가져오기
async function fetchScriptText(id: string) {
  try {
    isProcessing.value = true
    errorMessage.value = null

    const response = await fetch(`${apiBaseUrl}/script/${id}`)

    if (!response.ok) {
      throw new Error(`스크립트 불러오기 실패: ${response.status}`)
    }

    scriptText.value = splitBySpeaker(await response.text())
    console.log(scriptText)

    // 회의 원문 가져왔으면 요약 요청
    await generateSummary(scriptId)
  } catch (error: unknown) {
    console.error('회의 원문 불러오기 오류:', error)
    errorMessage.value = `회의 원문을 불러오지 못했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
  }
}

// 2. 요약 요청
async function generateSummary(scriptId: string | null) {
  try {
    isProcessing.value = true
    errorMessage.value = null
    streamedSummary.value = ''

    const response = await fetch(`${apiBaseUrl}/openai/summary/${scriptId}`, {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
      },
    })

    if (!response.ok || !response.body) {
      throw new Error(`응답 실패: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let fullLine = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter((line) => line.startsWith('data:'))

      for (const line of lines) {
        const clean = line.replace('data:', '').trim()
        fullLine += clean

        try {
          const parsed = JSON.parse(fullLine)

          if (parsed['회의명']) summaryData.title = parsed['회의명']
          if (parsed['회의일시']) summaryData.date = parsed['회의일시']
          if (parsed['회의요약']) summaryData.summary = parsed['회의요약']
          if (parsed['논의사항']) summaryData.discussions = parsed['논의사항']
          if (parsed['결정사항']) summaryData.decisions = parsed['결정사항']
          if (parsed['할 일']) summaryData.actions = parsed['할 일']
          if (parsed['미해결이슈']) summaryData.unresolved = parsed['미해결이슈']
          if (parsed['주요키워드']) summaryData.keywords = parsed['주요키워드']

          // 전체 누적용 저장 (디버깅이나 전체 보기용)
          streamedSummary.value += fullLine + '\n'
          fullLine = ''
        } catch {
          // 아직 JSON 완성되지 않은 경우 이어붙이기
        }
      }
    }
  } catch (error: unknown) {
    console.error('요약 오류:', error)
    errorMessage.value = `요약 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
  } finally {
    isProcessing.value = false
  }
}
function isKorean(text: string): boolean {
  return /[가-힣]/.test(text)
}
function splitBySpeaker(text: string): string {
  const rawSentences = text
    .replace(/\n+/g, ' ') // 개행 제거
    .split(/(?<=[.!?])\s+/) // 문장 단위로 분리

  let result: string[] = []
  let currentSpeaker = ''
  let buffer: string[] = []

  rawSentences.forEach((sentence) => {
    const trimmed = sentence.trim()
    if (!trimmed) return

    const isKorean = /[가-힣]/.test(trimmed)
    const speaker = isKorean ? '발화자 B' : '발화자 A'

    // speaker가 바뀌면 기존 발화자 내용 출력
    if (speaker !== currentSpeaker) {
      if (buffer.length > 0) {
        result.push(`<p><strong>[${currentSpeaker}]</strong><br>${buffer.join('<br>')}</p>`)
        buffer = []
      }
      currentSpeaker = speaker
    }

    buffer.push(trimmed)
  })

  // 마지막 버퍼 처리
  if (buffer.length > 0) {
    result.push(`<p><strong>[${currentSpeaker}]</strong><br>${buffer.join('<br>')}</p>`)
  }

  return result.join('')
}

onMounted(() => {
  if (scriptId) {
    fetchScriptText(scriptId)
  } else {
    errorMessage.value = '스크립트 ID가 없습니다.'
  }
})
</script>

<template>
  <div class="meeting-summary">
    <div class="header">
      <h2 class="title">회의 요약</h2>
    </div>

    <div v-if="isProcessing" class="progress-container">
      <div class="progress-indicator"></div>
      <p class="progress-text">요약을 생성 중입니다...</p>
    </div>

    <div v-if="errorMessage" class="alert error">
      <div class="alert-icon">error</div>
      <div class="alert-content">{{ errorMessage }}</div>
    </div>

    <div v-if="summaryData.summary || summaryData.title" class="card-container">
      <!-- 회의 제목 및 날짜 -->
      <div
        v-if="summaryData.title || summaryData.date"
        class="card header-card ai-glow"
        style="--delay: 0.2s"
      >
        <div class="card-content">
          <div class="card-title-row">
            <span class="material-symbols-outlined">calendar_today</span>
            <h3 class="card-title">{{ summaryData.title }}</h3>
          </div>
          <p v-if="summaryData.date" class="card-subtitle">회의 일시: {{ summaryData.date }}</p>
        </div>
      </div>

      <!-- 회의 요약 -->
      <div v-if="summaryData.summary" class="card summary-card ai-glow" style="--delay: 0.2s">
        <div class="card-content">
          <div class="card-title-row">
            <span class="material-symbols-outlined">description</span>
            <h3 class="card-title">한 줄 요약</h3>
          </div>
          <p class="card-text">{{ summaryData.summary }}</p>
        </div>
      </div>

      <!-- 논의사항 -->
      <div v-if="summaryData.discussions.length" class="card ai-glow" style="--delay: 0.2s">
        <div class="card-content">
          <div class="card-title-row">
            <span class="material-symbols-outlined">chat</span>
            <h3 class="card-title">논의사항</h3>
          </div>
          <ul class="card-list">
            <li v-for="(item, i) in summaryData.discussions" :key="'n' + i" class="list-item">
              <span class="list-icon chat">chat_bubble</span>
              <span class="list-item-text">{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 결정사항 -->
      <div v-if="summaryData.decisions.length" class="card ai-glow" style="--delay: 0.2s">
        <div class="card-content">
          <div class="card-title-row">
            <span class="material-symbols-outlined">subject</span>
            <h3 class="card-title">결정사항</h3>
          </div>
          <ul class="card-list">
            <li v-for="(item, i) in summaryData.decisions" :key="'d' + i" class="list-item">
              <span class="list-icon number">{{ i + 1 }}</span>
              <span class="list-item-text">{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Action Items -->
      <div v-if="summaryData.actions.length" class="card ai-glow" style="--delay: 0.2s">
        <div class="card-content">
          <div class="card-title-row">
            <span class="material-symbols-outlined">task_alt</span>
            <h3 class="card-title">할 일</h3>
          </div>
          <ul class="card-list">
            <li v-for="(item, i) in summaryData.actions" :key="'a' + i" class="list-item">
              <span class="list-icon check">check_box</span>
              <span class="list-item-text">{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 미해결 이슈 -->
      <div v-if="summaryData.unresolved.length" class="card ai-glow" style="--delay: 0.2s">
        <div class="card-content">
          <div class="card-title-row">
            <span class="material-symbols-outlined">report</span>
            <h3 class="card-title">미해결 이슈</h3>
          </div>
          <ul class="card-list">
            <li v-for="(item, i) in summaryData.unresolved" :key="'u' + i" class="list-item">
              <span class="list-icon issue">report_problem</span>
              <span class="list-item-text">{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 키워드 -->
      <div v-if="summaryData.keywords.length" class="card ai-glow" style="--delay: 0.2s">
        <div class="card-content">
          <div class="card-title-row">
            <span class="material-symbols-outlined">sell</span>
            <h3 class="card-title">주요 키워드</h3>
          </div>
          <div class="chips-container">
            <div v-for="(keyword, i) in summaryData.keywords" :key="i" class="chip">
              {{ keyword }}
            </div>
          </div>
        </div>
      </div>

      <!-- 전체 내용 버튼 -->
      <div v-if="false" class="card expansion-card ai-glow" style="--delay: 0.2s">
        <div class="expansion-header" @click="isExpanded = !isExpanded">
          <div class="card-title-row">
            <span class="material-symbols-outlined">description</span>
            <h3 class="card-title">전체 회의 내용</h3>
          </div>
          <span class="material-icon expand-icon" :class="{ expanded: isExpanded }"
            >expand_more</span
          >
        </div>
        <div class="expansion-content" v-if="isExpanded">
          <p class="card-text" v-html="splitBySpeaker(scriptText)"></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Material Design 스타일링 */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

.meeting-summary {
  font-family: 'Roboto', sans-serif;
  max-width: 800px;
  border-radius: 12px; /* 둥글게 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06); /* 부드러운 그림자 */
  margin: 0 auto;
  padding: 24px;
  background-color: #f5f5f5; /* Material Design 배경색 */
  color: rgba(0, 0, 0, 0.87); /* Material 기본 텍스트 색상 */
}

.header {
  margin-bottom: 32px;
  text-align: center;
}

.title {
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  color: rgba(0, 0, 0, 0.87);
}

/* 로딩 인디케이터 */
.progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 32px 0;
}

.progress-indicator {
  width: 100%;
  height: 4px;
  background-color: #e0e0e0;
  position: relative;
  overflow: hidden;
}

.progress-indicator::after {
  content: '';
  position: absolute;
  height: 100%;
  width: 50%;
  background-color: #2196f3; /* Material Primary */
  animation: indeterminate 1.5s infinite linear;
  transform-origin: left;
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%) scaleX(0.5);
  }
  100% {
    transform: translateX(200%) scaleX(0.5);
  }
}

.progress-text {
  margin-top: 16px;
  color: rgba(0, 0, 0, 0.6);
}

/* Alert / Error */
.alert {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 24px;
}

.alert.error {
  background-color: #ffebee; /* Material Red 50 */
  color: #d32f2f; /* Material Red 700 */
}

.alert-icon {
  font-family: 'Material Icons';
  font-size: 24px;
  margin-right: 16px;
}

.alert-content {
  flex: 1;
}

/* 카드 컨테이너 */
.card-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 카드 스타일 */
.card {
  background-color: white;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.24);
  overflow: hidden;
}

.card-content {
  padding: 16px;
}

.card-title-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  margin-left: 8px;
}

.card-subtitle {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
  margin-top: 4px;
}

.card-text {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
}

/* 헤더 카드 특별 스타일링 */
.header-card {
  border-left: 4px solid #2196f3; /* Material Primary */
}

/* 요약 카드 특별 스타일링 */
.summary-card {
  border-left: 4px solid #4caf50; /* Material Green */
}

/* Material Icon */
.material-icon {
  font-family: 'Material Icons';
  font-size: 20px;
  margin-right: 8px;
}

.card-title-row .material-icon {
  color: #00c853; /* 기본 아이콘을 연두색 계열로 */
}

.summary-card .material-icon {
  color: #4caf50;
}
.card-title-row .material-icon.keywords {
  color: #2196f3;
}
.card-title-row .material-icon.decision {
  color: #7c4dff;
}
.card-title-row .material-icon.action {
  color: #ff9800;
}
.card-title-row .material-icon.unresolved {
  color: #ff3d00;
}

/* 칩 스타일링 (키워드) */
.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border-radius: 16px;
  background-color: #e0e0e0;
  color: rgba(0, 0, 0, 0.87);
  font-size: 13px;
}

/* 리스트 스타일링 */
.card-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #eeeeee;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #2196f3; /* Material Primary */
  color: white;
  font-size: 12px;
  font-weight: 500;
  margin-right: 12px;
  flex-shrink: 0;
}

.list-item-number.discussion {
  background-color: #9e9e9e; /* Material Grey */
}

.list-item-number.issue {
  background-color: #ff5722; /* Material Deep Orange */
}

.list-item-text {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.87);
}

/* 확장 패널 */
.expansion-card {
  cursor: pointer;
}

.expansion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.expand-icon {
  transition: transform 0.3s ease;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.expansion-content {
  padding: 0 16px 16px;
  border-top: 1px solid #eeeeee;
  white-space: pre-line;
}

/* 반응형 스타일링 */
@media (max-width: 768px) {
  .meeting-summary {
    background-color: #ffffff;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 0 16px rgba(0, 0, 0, 0.04); /* subtle 전체 음영 */
  }
}

@keyframes fadeInBright {
  0% {
    opacity: 0;
    transform: translateY(12px);
    filter: brightness(0.85);
  }
  50% {
    opacity: 0.6;
    filter: brightness(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: brightness(1);
  }
}

.ai-glow {
  animation: fadeInBright 1.2s ease-out both;
  animation-delay: var(--delay, 0s);
}

body {
  background-color: #fafafa;
}
.meeting-summary {
  background-color: #fafafa;
  padding: 32px;
  min-height: 100vh;
}
.card {
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.list-icon {
  font-family: 'Material Icons';
  font-size: 20px;
  width: 24px;
  height: 24px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.list-icon.check {
  color: #4caf50;
}

.list-icon.number {
  background-color: #3f51b5;
  color: white;
  font-weight: 600;
  border-radius: 50%;
  font-size: 13px;
}

.list-icon.chat {
  color: #03a9f4;
}

.list-icon.issue {
  color: #ff5722;
}
.material-icon.title-icon {
  font-family: 'Material Icons';
  font-size: 22px;
  color: #2196f3;
  margin-right: 8px;
}

.summary-card .title-icon {
  color: #4caf50;
}
.card-title-row .title-icon.keywords {
  color: #3f51b5;
}
.card-title-row .title-icon.decisions {
  color: #7c4dff;
}
.card-title-row .title-icon.action {
  color: #ff9800;
}
.card-title-row .title-icon.unresolved {
  color: #f44336;
}
.list-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  margin-right: 12px;
  flex-shrink: 0;
}

.card.decisions .list-number {
  background-color: #7c4dff; /* 퍼플 */
}

.card.actions .list-number {
  background-color: #ff9800; /* 주황 */
}

.card.discussions .list-number {
  background-color: #42a5f5; /* 파랑 */
}

.card.unresolved .list-number {
  background-color: #ef5350; /* 레드 */
}
</style>
