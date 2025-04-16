<template>
  <div class="audio-worklet-stt">
    <div class="header">
      <h2>🎤 Test</h2>
      <div class="nav-buttons"></div>
      <div class="controls">
        <div class="language-selector">
          <label for="language-select">입력 언어:</label>
          <select id="language-select" v-model="selectedLanguage" class="select-input">
            <option v-for="lang in languages" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>

        <!-- 언어 교환 버튼 추가 -->
        <button class="btn-icon" @click="switchLanguages" title="언어 교환">
          <span class="material-icon">swap_horiz</span>
        </button>

        <!-- 번역 언어 선택기 추가 -->
        <div class="language-selector">
          <label for="translation-language-select">번역 언어:</label>
          <select
            id="translation-language-select"
            v-model="translatedLanguage"
            class="select-input"
          >
            <option v-for="lang in languages" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>
        <button class="btn-primary" @click="startRecording" :disabled="isRecording">
          <span class="material-icon">mic</span> 시작
        </button>
        <button class="btn-secondary" @click="stopRecording" :disabled="!isRecording">
          <span class="material-icon">stop</span> 중지
        </button>
      </div>
    </div>

    <div class="chat-container">
      <div class="messages" ref="messagesContainer">
        <!-- 메시지 기록 표시 -->
        <div
          v-for="(message, index) in messageHistory"
          :key="index"
          :class="['message', message.type]"
        >
          <div class="message-content">
            <div class="original-text">{{ message.text }}</div>
            <div v-if="message.translatedText" class="translated-text">
              {{ message.translatedText }}
            </div>
          </div>
        </div>
        <!-- 중간 결과는 그대로 유지 -->
        <div v-if="interimText" class="message user interim">
          <div class="message-content">{{ interimText }}</div>
        </div>
      </div>
    </div>

    <div class="log-section">
      <div class="log-header">
        <h3>로그</h3>
        <button class="btn-text" @click="clearLogs">지우기</button>
      </div>
      <pre class="log-container" ref="logContainer">{{ logs }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const languages = [
  { code: 'ko-KR', name: '한국어' },
  // 나머지 언어 목록은 그대로 유지
  // 나머지 언어 목록은 그대로 유지
  { code: 'en-US', name: '영어 (미국)' },
  { code: 'en-GB', name: '영어 (영국)' },
  { code: 'zh-CN', name: '중국어 (간체)' },
  { code: 'zh-TW', name: '중국어 (번체)' },
  { code: 'ja-JP', name: '일본어' },
  { code: 'es-ES', name: '스페인어 (스페인)' },
  { code: 'es-MX', name: '스페인어 (멕시코)' },
  { code: 'fr-FR', name: '프랑스어' },
  { code: 'de-DE', name: '독일어' },
  { code: 'ru-RU', name: '러시아어' },
  { code: 'pt-BR', name: '포르투갈어 (브라질)' },
  { code: 'it-IT', name: '이탈리아어' },
  { code: 'ar-SA', name: '아랍어' },
  { code: 'hi-IN', name: '힌디어' },
  { code: 'th-TH', name: '태국어' },
  { code: 'vi-VN', name: '베트남어' },
]

// 선택된 언어 (기본값: 한국어)
const selectedLanguage = ref('ko-KR')
// 번역 대상 언어 (기본값: 영어)
const translatedLanguage = ref('en-US')

// 언어 교환 함수 추가
function switchLanguages() {
  // 현재 값 임시 저장
  const tempLang = selectedLanguage.value
  // 입력 언어를 번역 언어로 설정
  selectedLanguage.value = translatedLanguage.value
  // 번역 언어를 입력 언어로 설정
  translatedLanguage.value = tempLang

  logMessage(
    `🔄 언어 교환: 입력 언어=${selectedLanguage.value}, 번역 언어=${translatedLanguage.value}`,
  )

  // 현재 녹음 중이라면 녹음을 중지하고 새로운 언어로 다시 시작
  // if (isRecording.value || socketReady.value) {
  logMessage('🔄 언어 변경으로 인해 녹음 세션을 재시작합니다.')
  // stopRecording()

  // 잠시 후 새 언어로 녹음 다시 시작
  //   setTimeout(() => {
  //     startRecording()
  //   }, 500)
  // }
}

// 기존 상태 변수들
const isRecording = ref(false)
const socketReady = ref(false)
const finalText = ref('')
const interimText = ref('')
const logs = ref('')
const logContainer = ref(null)
const messagesContainer = ref(null)
const translatedText = ref('')
// 메시지 기록을 저장할 배열 - 타입 정의 수정
const messageHistory = ref<Array<{ type: string; text: string; translatedText?: string }>>([])

// AudioContext 관련 변수들
let socket: WebSocket | null = null
let audioContext: AudioContext | null = null
let audioStream: MediaStream | null = null
// const workletNode: AudioWorkletNode | null = null

// 로그 메시지 추가 함수
function logMessage(message: string) {
  logs.value += `\n${message}`
  // 로그 스크롤을 아래로 유지
  setTimeout(() => {
    if (logContainer.value) {
      ;(logContainer.value as HTMLElement).scrollTop = (
        logContainer.value as HTMLElement
      ).scrollHeight
    }
  }, 0)
}

// 로그 지우기 함수
function clearLogs() {
  logs.value = ''
}

// 중간 결과 업데이트 함수
function updateInterimText(text: string) {
  interimText.value = text
  scrollToBottom()
}

// 최종 결과 추가 함수
function addFinalText(text: string) {
  if (text && text.trim() !== '') {
    // 사용자 메시지를 기록에 추가
    messageHistory.value.push({
      type: 'user',
      text: text,
    })

    // 현재 입력 텍스트 업데이트 (API 호출용)
    finalText.value = text
    scrollToBottom()
  }

  // 중간 결과 초기화
  clearInterimText()
}

// 메시지 컨테이너 스크롤 함수
function scrollToBottom() {
  setTimeout(() => {
    if (messagesContainer.value) {
      ;(messagesContainer.value as HTMLElement).scrollTop = (
        messagesContainer.value as HTMLElement
      ).scrollHeight
    }
  }, 0)
}

// 스크립트 생성 API 함수
async function createScript() {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

    logMessage(`🔄 스크립트 생성 API 호출 중...`)

    const response = await fetch(`${apiBaseUrl}/script/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: localStorage.getItem('userId'),
        name: localStorage.getItem('sraga_name'),
      }),
    })

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }

    const data = await response.json()

    // 응답에서 받은 id를 localStorage에 저장
    localStorage.setItem('scriptId', data.id)
    logMessage(`✅ 스크립트 생성 완료: ID=${data.id}`)

    return data
  } catch (error: unknown) {
    logMessage(`❌ 스크립트 생성 오류: ${(error as Error).message}`)
    console.error('스크립트 생성 오류:', error)
    throw error
  }
}

// OpenAI API로 데이터 전송 함수
async function sendToOpenAI() {
  try {
    logMessage(`🔄 OpenAI API로 데이터 전송 중...`)
    // 스크립트 생성 API 호출
    await createScript()

    // 번역 중임을 표시하는 임시 메시지 추가
    const translationIndex = messageHistory.value.length - 1 // 마지막 사용자 메시지 인덱스
    const userMessage = messageHistory.value[translationIndex]

    // 번역 중임을 표시
    userMessage.translatedText = '번역 중...'
    scrollToBottom()

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

    // localStorage에서 script ID 가져오기
    const scriptId = localStorage.getItem('scriptId')
    if (!scriptId) {
      logMessage('⚠️ Script ID가 없습니다. 번역을 진행할 수 없습니다.')
      userMessage.translatedText = '번역을 위한 Script ID가 없습니다.'
      return
    }

    // 서버 전송 이벤트(SSE)를 처리하기 위해 fetch 직접 사용
    const response = await fetch(`${apiBaseUrl}/openai/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-script-id': scriptId, // Script ID를 헤더에 추가
      },
      body: JSON.stringify({
        lang: translatedLanguage.value, // 번역 언어를 사용하도록 수정
        message: finalText.value,
      }),
    })

    logMessage(
      `📤 번역 요청: 입력 언어=${selectedLanguage.value}, 메시지="${finalText.value.substring(0, 30)}${finalText.value.length > 30 ? '...' : ''}"`,
    )

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }

    // 응답을 텍스트 스트림으로 처리
    const reader = response.body?.getReader()
    const decoder = new TextDecoder('utf-8')

    // 번역 텍스트 초기화
    translatedText.value = ''
    userMessage.translatedText = ''

    if (reader) {
      // 스트림 읽기 함수
      const processStream = async () => {
        try {
          let isProcessing = true
          while (isProcessing) {
            const { done, value } = await reader.read()

            if (done) {
              logMessage('✅ 번역 완료')
              break
            }

            // 청크 디코딩
            const chunk = decoder.decode(value, { stream: true })

            // 'data:' 접두사로 시작하는 라인 처리
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const content = line.substring(5).trim()

                // [DONE] 메시지는 무시
                if (content === '[DONE]') continue

                // 번역 텍스트에 추가
                if (content) {
                  translatedText.value += content + ' '
                  userMessage.translatedText += content + ' '
                  scrollToBottom()
                }
              }
            }
          }
        } catch (error: unknown) {
          logMessage(`❌ 스트림 처리 오류: ${(error as Error).message}`)
        }
      }

      // 스트림 처리 시작
      processStream()
    }
  } catch (error: unknown) {
    logMessage(`❌ OpenAI API 오류: ${(error as Error).message}`)
    console.error('OpenAI API 오류:', error)

    // 오류 메시지 추가
    const lastMessageIndex = messageHistory.value.length - 1
    if (lastMessageIndex >= 0) {
      messageHistory.value[lastMessageIndex].translatedText = '번역 중 오류가 발생했습니다.'
    }
    scrollToBottom()
  }
}

// 중간 결과 초기화 함수
function clearInterimText() {
  interimText.value = ''
}

// WebSocket 초기화
function initializeWebSocket() {
  // 환경 변수에서 API 기본 URL 가져오기
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  socket = new WebSocket(`${apiBaseUrl.replace('https', 'wss')}/stt/websocket`)
  socket.binaryType = 'arraybuffer'

  console.log('소켓 상태', socket.readyState)
  socket.onopen = () => {
    socketReady.value = true
    logMessage('🟢 WebSocket 연결됨.')
  }

  // 나머지 WebSocket 관련 코드는 그대로 유지
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      logMessage(`📥 수신: ${JSON.stringify(data)}`)

      switch (data.type) {
        case 'interim':
          // 중간 결과 - 회색으로 표시
          if (isRecording.value) {
            // 녹음 중일 때만 중간 결과 처리
            updateInterimText(data.text)
          }
          break

        case 'final':
          // 최종 결과 - 기존 텍스트에 검은색으로 추가
          if (isRecording.value) {
            // 녹음 중일 때만 최종 결과 처리
            addFinalText(data.text)
            // 최종 결과를 OpenAI API로 전송
            sendToOpenAI()
            // 녹음 중지
            stopRecording()
          }
          break

        case 'system':
          // 시스템 메시지
          logMessage(`🔧 ${data.message}`)
          break

        case 'error':
          // 오류 메시지
          logMessage(`❌ ${data.message}`)
          break

        case 'end':
          // 종료 메시지
          logMessage(`✅ 음성 인식 종료`)
          clearInterimText()
          isRecording.value = false
          break
      }
    } catch (error: unknown) {
      logMessage(`❌ 메시지 파싱 오류: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  socket.onerror = (error: unknown) => {
    logMessage(`❌ WebSocket 오류: ${error instanceof Error ? error.message : String(error)}`)
  }

  socket.onclose = (event) => {
    socketReady.value = false
    logMessage(`✅ WebSocket 종료됨 (코드: ${event.code})`)
  }
}

// 녹음 시작 함수
async function startRecording() {
  try {
    // 소켓이 없거나 연결이 닫혀있으면 새로 연결
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      logMessage('🔄 WebSocket 연결 시작...')
      // 소켓 연결 호출
      initializeWebSocket()

      // 소켓 연결이 완료될 때까지 대기
      await new Promise<void>((resolve, reject) => {
        const checkSocketReady = () => {
          if (socketReady.value) {
            resolve()
          } else if (socket && socket.readyState === WebSocket.CLOSED) {
            reject(new Error('WebSocket 연결 실패'))
          } else {
            setTimeout(checkSocketReady, 100)
          }
        }
        checkSocketReady()
      })
    }

    // 녹음 시작 시 이전 결과 초기화 (finalText와 translatedText만 초기화)
    finalText.value = ''
    translatedText.value = ''

    audioContext = new AudioContext({ sampleRate: 16000 })
    // AudioWorklet 프로세서 모듈 추가 (public 폴더에 위치)
    await audioContext.audioWorklet.addModule('/recorder-processor.js')

    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    })

    const source = audioContext.createMediaStreamSource(audioStream)

    const workletNode = new AudioWorkletNode(audioContext, 'recorder-processor')

    source.connect(workletNode)
    workletNode.connect(audioContext.destination)

    workletNode.port.onmessage = (e) => {
      // 녹음 중일 때만 데이터 전송
      if (isRecording.value && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(e.data)
      }
    }

    // 녹음 상태를 먼저 true로 설정
    isRecording.value = true

    // socket이 null이 아닌지 확인 후 메시지 전송
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'start', lang: selectedLanguage.value }))
      logMessage(
        `📤 'start' 메시지 전송 완료 (언어: ${selectedLanguage.value}, 번역 언어: ${translatedLanguage.value})`,
      )
    } else {
      throw new Error('WebSocket 연결이 활성화되지 않았습니다.')
    }

    logMessage('🎙️ 녹음 시작됨...')
  } catch (err: unknown) {
    // 오류 발생 시 녹음 상태 초기화
    isRecording.value = false

    // err를 unknown 타입으로 명시적 지정 후 타입 가드 사용
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류'
    logMessage(`❌ 오류 발생: ${errorMessage}`)
    console.error('전체 오류:', err)
  }
}

// 나머지 함수들은 그대로 유지
function stopRecording() {
  // 녹음 중이 아니면 중복 중지 방지
  if (!isRecording.value && !audioContext && !audioStream) {
    return
  }

  // 먼저 녹음 상태를 false로 설정하여 데이터 전송 중단
  isRecording.value = false

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop())
    audioStream = null
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'end' }))
    logMessage("📤 'end' 메시지 전송 완료")

    // 녹음 중지 시 최종 텍스트가 있으면 OpenAI API로 전송
    if (finalText.value.trim()) {
      logMessage(
        `📤 최종 텍스트를 OpenAI API로 전송합니다. (${selectedLanguage.value} → ${translatedLanguage.value})`,
      )
      // sendToOpenAI() // 주석 해제
    }
  }

  logMessage('⏹️ 녹음 중지 완료.')

  // 중간 결과 초기화
  clearInterimText()
}

// 컴포넌트 마운트 시 WebSocket 초기화
onMounted(() => {
  // 컴포넌트 마운트 시 소켓 연결 시도
  initializeWebSocket()
})

// 컴포넌트 언마운트 시 리소스 정리
onBeforeUnmount(() => {
  stopRecording()

  if (socket) {
    socket.close()
    socket = null
  }
})
</script>

<style scoped>
/* 구글 머티리얼 디자인 스타일 적용 */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

/* 기존 스타일 유지 */

/* 네비게이션 버튼 스타일 추가 */
.nav-buttons {
  display: flex;
  gap: 10px;
  margin-right: 20px;
}

.btn-nav {
  background-color: #f1f3f4;
  color: #5f6368;
  border: 1px solid #dadce0;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    box-shadow 0.2s,
    color 0.2s;
  display: flex;
  align-items: center;
}

.btn-nav:hover {
  background-color: #e8f0fe;
  color: #1a73e8;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3);
}

.btn-nav .material-icon {
  margin-right: 4px;
}

/* 헤더 스타일 수정 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #dadce0;
  flex-wrap: wrap;
  gap: 10px;
}

/* 나머지 스타일은 그대로 유지 */
.audio-worklet-stt {
  font-family: 'Roboto', 'Noto Sans KR', sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  color: #202124;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow:
    0 1px 2px 0 rgba(60, 64, 67, 0.3),
    0 1px 3px 1px rgba(60, 64, 67, 0.15);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #dadce0;
}

h2 {
  color: #1a73e8;
  font-size: 22px;
  font-weight: 500;
  margin: 0;
}

h3 {
  color: #5f6368;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.controls {
  display: flex;
  gap: 10px;
}

.material-icon {
  font-family: 'Material Icons';
  font-size: 18px;
  vertical-align: middle;
  margin-right: 4px;
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    box-shadow 0.2s;
}

.btn-primary {
  background-color: #1a73e8;
  color: white;
}

.btn-primary:hover {
  background-color: #1765cc;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3);
}

.btn-primary:disabled {
  background-color: #dadce0;
  color: #5f6368;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #ffffff;
  color: #1a73e8;
  border: 1px solid #dadce0;
}

.btn-secondary:hover {
  background-color: #f1f3f4;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3);
}

.btn-secondary:disabled {
  color: #5f6368;
  border-color: #dadce0;
  cursor: not-allowed;
}

.btn-text {
  background: none;
  color: #1a73e8;
  padding: 4px 8px;
}

.btn-text:hover {
  background-color: rgba(26, 115, 232, 0.04);
}

/* 채팅 컨테이너 스타일 */
.chat-container {
  background-color: white;
  border: 1px solid #dadce0;
  border-radius: 8px;
  height: 300px;
  margin-bottom: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  max-width: 80%;
  margin-bottom: 8px;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

/* 메시지 스타일 수정 */
.message-content {
  padding: 12px 16px;
  border-radius: 18px;
  background-color: #e8f0fe;
  color: #202124;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.1);
  display: flex;
  flex-direction: column;
}

.original-text {
  font-size: 16px;
  margin-bottom: 4px;
}

.translated-text {
  font-size: 14px;
  color: #5f6368;
  margin-top: 6px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 6px;
}

.message.interim .message-content {
  background-color: #f1f3f4;
  color: #5f6368;
}

.message.assistant .message-content {
  background-color: #f1f3f4;
  color: #5f6368;
}

/* 로그 섹션 스타일 */
.log-section {
  background-color: white;
  border: 1px solid #dadce0;
  border-radius: 8px;
  overflow: hidden;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f1f3f4;
  border-bottom: 1px solid #dadce0;
}

.log-container {
  margin: 0;
  padding: 12px 16px;
  height: 150px;
  overflow-y: auto;
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #5f6368;
  background-color: #ffffff;
}

/* 언어 선택기 스타일 추가 */
.language-selector {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.language-selector label {
  margin-right: 8px;
  color: #5f6368;
  font-size: 14px;
}

.select-input {
  padding: 8px 12px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  background-color: white;
  color: #202124;
  font-size: 14px;
  font-family: 'Roboto', 'Noto Sans KR', sans-serif;
  cursor: pointer;
  min-width: 150px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%235f6368'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 24px;
}

.select-input:hover {
  border-color: #aecbfa;
}

.select-input:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}

.controls {
  display: flex;
  align-items: center;
}
</style>
