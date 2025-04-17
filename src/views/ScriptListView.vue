<template>
  <div class="script-list-view">
    <div v-if="userName" class="user-display">
      <span class="material-icon">account_circle</span> <span>안녕하세요, {{ userName }}님!</span>
    </div>

    <div class="list-header">
      <h1 class="view-title">미팅 목록</h1>
      <button @click="createNewMeeting" class="btn-primary create-meeting-btn">
        <span class="material-icon">add_circle_outline</span>
        <span>새 미팅 생성</span>
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <p>미팅 목록을 불러오는 중...</p>
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="status-message error">
      <span class="material-icon">error_outline</span>
      <span>미팅 목록을 불러오는 중 오류가 발생했습니다: {{ error }}</span>
    </div>

    <div v-else-if="scripts.length > 0" class="script-grid">
      <div v-for="script in scripts" :key="script.id" class="card script-card">
        <div class="card-content">
          <h2 class="script-name">{{ script.name || '제목 없음' }}</h2>
        </div>
        <div class="card-actions">
          <button @click="meetingSummaryRoute(script.id)" class="btn-primary btn-sm">
            <span>회의 요약</span>
            <span class="material-icon">arrow_forward_ios</span>
          </button>
          <button @click="viewScriptDetail(script.id)" class="btn-primary btn-sm">
            <span>자세히 보기</span>
            <span class="material-icon">arrow_forward_ios</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="no-data-container card">
      <span class="material-icon large-icon">description</span>
      <p>생성된 미팅이 없습니다.</p>
      <p class="sub-text">새로운 스크립트을 생성해보세요.</p>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="cancelModal">
      <div
        class="modal-container card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div class="modal-header">
          <h3 id="modal-title" class="modal-title">새 미팅 이름 입력</h3>
          <button @click="cancelModal" class="modal-close-btn" aria-label="닫기">
            <span class="material-icon">close</span>
          </button>
        </div>
        <div class="modal-body">
          <label for="meetingNameInput" class="input-label">미팅 이름:</label>
          <input
            id="meetingNameInput"
            type="text"
            v-model="newMeetingName"
            placeholder="미팅 이름을 입력하세요"
            class="modal-input"
            @keyup.enter="saveMeetingName"
          />
          <p v-if="showNameRequiredWarning" class="warning-text">미팅 이름을 입력해주세요.</p>
        </div>
        <div class="modal-footer">
          <button @click="cancelModal" class="btn-secondary">취소</button>
          <button @click="saveMeetingName" class="btn-primary">생성</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'

// --- 상수 정의 ---
const URI_SCRIPT_ALL: string = '/script/all/'
const URI_SCRIPT_CREATE: string = '/script/create'

// --- 인터페이스 정의 ---
interface Script {
  id: number | string
  name: string
}

interface CreateScriptBody {
  user_id?: number
  name: string
}

interface CreateScriptData {
  id: string
  name: string
}

// --- 컴포넌트 상태 변수 ---
const scripts = ref<Script[]>([])
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const userName = ref<string | null>(null)
const userId = ref<number | null>(null)
const router = useRouter()

// 모달 관련 상태
const showModal = ref<boolean>(false)
const newMeetingName = ref<string>('')
const showNameRequiredWarning = ref<boolean>(false) // 이름 필수 경고

// --- 함수 정의 ---

// 스크립트 상세 보기 함수 (라우트 이름 'script'로 변경)
const viewScriptDetail = (scriptId: number | string) => {
  // 'script' 라우트로 id 파라미터와 함께 이동
  console.log('scriptId', scriptId)
  router.push({ name: 'script', params: { id: scriptId } })
}

// 회의 요약 라우트
const meetingSummaryRoute = (scriptId: string | number) => {
  console.log('Navigating to meeting summary with scriptId:', scriptId)
  router.push({
    path: '/meeting-summary',
    query: { scriptId: scriptId.toString() },
  })
}

// 새 미팅 생성 버튼 클릭 시 (모달 열기)
const createNewMeeting = () => {
  // 입력 필드 초기화
  newMeetingName.value = ''
  showNameRequiredWarning.value = false // 경고 초기화
  // 모달 표시
  showModal.value = true
}

// 모달: 취소 버튼 클릭 시
const cancelModal = () => {
  showModal.value = false
  showNameRequiredWarning.value = false // 경고 초기화
}

// 모달: 저장 버튼 클릭 시 (저장 후 'script' 라우트로 이동)
const saveMeetingName = async () => {
  // 입력값 검증
  if (!newMeetingName.value.trim()) {
    showNameRequiredWarning.value = true // 경고 표시
    return // 저장 중단
  }

  let script_Id = null
  const meetingNameToSave = newMeetingName.value.trim()
  // 모달 닫기
  showModal.value = false
  showNameRequiredWarning.value = false // 경고 초기화

  const body: CreateScriptBody = {
    user_id: userId.value ?? undefined,
    name: meetingNameToSave,
  }

  // script id 생성
  try {
    const response: CreateScriptData = await api.post(URI_SCRIPT_CREATE, body)
    script_Id = response.id
  } catch (err) {
    if (err instanceof Error) {
      error.value = '서버와 통신 중 문제가 발생했습니다.'
    } else {
      error.value = '알 수 없는 오류가 발생했습니다.'
    }
  }
  // 저장 후 'script' 라우트로 이동
  router.push({ name: 'script', params: { id: script_Id } })
}

// 스크립트 목록 로딩 및 정렬 함수
const loadScripts = async () => {
  loading.value = true
  error.value = null
  if (!userId.value) {
    error.value = '사용자 ID를 가져올 수 없습니다.'
    loading.value = false
    scripts.value = []
    return
  }
  try {
    const response = await api.get(URI_SCRIPT_ALL + userId.value)
    let fetchedScripts: Script[] = []

    // 데이터 할당
    if (response && Array.isArray(response.results)) {
      fetchedScripts = response.results
    } else if (Array.isArray(response)) {
      fetchedScripts = response
    } else {
      // console.warn('예상치 못한 API 응답 구조:', response)
      fetchedScripts = []
    }

    // 이름 오름차순으로 정렬 (localeCompare 사용)
    fetchedScripts.sort((a, b) => {
      const nameA = a.name || '' // name이 없을 경우 빈 문자열로 처리
      const nameB = b.name || ''
      return nameA.localeCompare(nameB, 'ko') // A와 B를 비교하여 오름차순 정렬
    })

    scripts.value = fetchedScripts // 정렬된 배열을 최종 할당
  } catch (err) {
    console.error('미팅 목록 로딩 실패:')
    console.log(err)
    if (err instanceof Error) {
      if (err.message === 'API 오류: 404') error.value = '미팅 목록이 없습니다.'
      else error.value = '서버와 통신 중 문제가 발생했습니다.'
    } else {
      error.value = '알 수 없는 오류가 발생했습니다.'
    }
    scripts.value = []
  } finally {
    loading.value = false
  }
}

// 컴포넌트 마운트 시 실행될 로직
onMounted(() => {
  userName.value = localStorage.getItem('sraga_name')
  const storedUserId = localStorage.getItem('userId')
  if (storedUserId) {
    userId.value = parseInt(storedUserId, 10) // 10진수로 파싱
    if (isNaN(userId.value)) {
      console.error('userId 파싱 오류:', storedUserId)
      userId.value = null // 파싱 실패 시 null 처리
    }
  } else {
    console.error('로컬 스토리지에 userId가 없습니다.')
  }

  // userId가 유효한 경우에만 스크립트 로드
  if (userId.value !== null) {
    loadScripts()
  } else {
    error.value = '사용자 정보를 불러올 수 없어 미팅 목록을 로드할 수 없습니다.'
    scripts.value = [] // 스크립트 목록 비우기
  }
})
</script>

<style scoped>
/* --- 기존 스타일 --- */
/* Material Icons 기본 스타일 */
.material-icon {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 1rem;
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
  vertical-align: middle;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: 'liga';
}

.material-icon.large-icon {
  font-size: 40px;
}

/* 전체 뷰 컨테이너 */
.script-list-view {
  max-width: 900px;
  margin: 1rem auto;
  padding: 1rem;
  position: relative;
}

/* 사용자 이름 표시 */
.user-display {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  background-color: var(--color-background);
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 0.2rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  z-index: 10;
}

.user-display .material-icon {
  font-size: 1.1em;
  vertical-align: text-bottom;
}

/* 목록 헤더 (제목 + 생성 버튼) */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  margin-top: 2.5rem;
  position: relative;
}

/* 페이지 제목 */
.view-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

/* 새 미팅 생성 버튼 */
.create-meeting-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 5px 10px;
  font-size: 13px;
}

.create-meeting-btn .material-icon {
  font-size: 1.1em;
}

/* 로딩 컨테이너 */
.loading-container {
  text-align: center;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.loading-container p {
  margin-bottom: 0.5rem;
}

/* 오류 메시지 */
.status-message.error {
  background-color: #fff0f1;
  color: var(--color-error);
  border: 1px solid var(--color-error);
  padding: 1rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.status-message.error .material-icon {
  font-size: 1.2em;
}

/* 스크립트 카드 그리드 (항상 1열) */
.script-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

/* 스크립트 카드 */
.card.script-card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 1rem;
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.card.script-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-3px);
}

/* 카드 내용 영역 */
.card-content {
  margin-right: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 스크립트 이름 */
.script-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

/* 카드 액션 영역 */
.card-actions {
  flex-shrink: 0;
}

/* 자세히 보기 버튼 */
.btn-primary.btn-sm {
  padding: 5px 8px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* 버튼 내부 아이콘 스타일 */
.btn-primary.btn-sm .material-icon {
  font-size: 13px;
  position: relative;
  top: 1px;
}

/* 데이터 없음 컨테이너 */
.no-data-container {
  text-align: center;
  padding: 2rem 1rem;
}

.no-data-container .material-icon {
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.no-data-container p {
  margin-bottom: 0.25rem;
}

.no-data-container .sub-text {
  font-size: 0.875rem;
  color: #6b7280;
}

/* 로딩 스피너 */
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: var(--color-primary);
  margin: 0 auto;
  animation: spin 1s ease infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* --- 모달 스타일 --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  /* 반투명 검정 배경 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  /* 다른 요소들 위에 표시 */
}

.modal-container {
  background-color: var(--color-white);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  width: 90%;
  max-width: 400px;
  /* 모달 최대 너비 */
  z-index: 1001;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.75rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.modal-close-btn .material-icon {
  font-size: 1.5rem;
  color: var(--color-text-secondary);
}

.modal-close-btn:hover .material-icon {
  color: var(--color-text);
}

.modal-body {
  margin-bottom: 1.5rem;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
}

.modal-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  box-sizing: border-box;
  /* 패딩 포함 너비 계산 */
}

.modal-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(7, 112, 227, 0.2);
}

.warning-text {
  color: var(--color-error);
  font-size: 0.8rem;
  margin-top: 0.3rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* main.css 에 정의되어 있다고 가정 */
.btn-secondary {
  background-color: #e0e0e0;
  /* 예시 회색 */
  color: var(--color-text);
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #bdbdbd;
}
</style>
