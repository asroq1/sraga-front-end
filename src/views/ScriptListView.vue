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
          <p class="script-date">{{ formatDate(script.created_date) }}</p>
        </div>
        <div class="card-actions">
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
      <div class="modal-container card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <h3 id="modal-title" class="modal-title">미팅 이름 입력</h3>
          <button @click="cancelModal" class="modal-close-btn" aria-label="닫기">
            <span class="material-icon">close</span>
          </button>
        </div>
        <div class="modal-body">
          <input id="meetingNameInput" type="text" v-model="newMeetingName" placeholder="미팅 이름을 입력하세요"
            class="modal-input" @keyup.enter="saveMeetingName" />
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
  id: string
  name: string
  created_date: Date
}

interface CreateScriptBody {
  user_id: number
  name: string
}

interface CreateScriptData {
  id: string
  name: string
  created_date: string
}

// --- 컴포넌트 상태 변수 ---
const scripts = ref<Script[]>([])
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const userName = ref<string | null>(null)
const userId = ref<number>(-1)
const router = useRouter()

// 모달 관련 상태
const showModal = ref<boolean>(false)
const newMeetingName = ref<string>('')
const showNameRequiredWarning = ref<boolean>(false) // 이름 필수 경고

// --- 함수 정의 ---

// 스크립트 상세 보기 함수
const viewScriptDetail = (scriptId: string) => {
  router.push({ name: 'script', params: { id: scriptId } })
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
    user_id: userId.value,
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
  // 생성 후 'script' 라우트로 이동
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
    const response: CreateScriptData[] = await api.get(URI_SCRIPT_ALL + userId.value)
    let fetchedScripts: Script[] = []

    // 데이터 할당
    if (Array.isArray(response)) {
      fetchedScripts = response.map((item) => ({
        id: item.id,
        name: item.name,
        created_date: new Date(item.created_date),
      }))
    } else {
      // console.warn('예상치 못한 API 응답 구조:', response)
      fetchedScripts = []
    }

    // created_date 내림차순으로 정렬 (최신 날짜가 위로)
    fetchedScripts.sort((a, b) => {
      // Date 객체는 getTime()을 사용하여 숫자 타임스탬프로 변환 후 비교합니다.
      // b의 시간에서 a의 시간을 빼면 내림차순 정렬이 됩니다.
      return b.created_date.getTime() - a.created_date.getTime();
    })


    scripts.value = fetchedScripts // 정렬된 배열을 최종 할당
  } catch (err) {
    // console.error('미팅 목록 로딩 실패:')
    // console.log(err)
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

// 날짜 포맷팅 함수 수정
const formatDate = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '날짜 정보 없음';
  }

  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    // 오늘 날짜인 경우: HH:MM 형식
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } else {
    // 오늘이 아닌 경우: YYYY-MM-DD 형식
    // 기존 로직 사용 (한국 로케일 기준)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace('.', '');
  }
}

// 컴포넌트 마운트 시 실행될 로직
onMounted(() => {
  userName.value = localStorage.getItem('sraga_name')
  const storedUserId = localStorage.getItem('userId')
  if (storedUserId) {
    userId.value = parseInt(storedUserId, 10) // 10진수로 파싱
    if (isNaN(userId.value)) {
      alert("로그인 오류")
      localStorage.removeItem('userId')
      localStorage.removeItem('sraga_name')
      router.push({ name: 'login' })
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
  padding: 0.8rem 1rem;
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
  /* flexbox 적용하여 자식 요소(제목, 날짜)를 가로로 배치 */
  display: flex;
  align-items: baseline;
  /* 텍스트 기준선 정렬 */
  justify-content: space-between;
  /* 제목과 날짜 사이에 공간 배분 */
  gap: 0.5rem;
  /* 제목과 날짜 사이 최소 간격 */
  overflow: hidden;
  /* 내용이 넘칠 경우 숨김 (자식 요소에서 처리) */
  /* white-space, text-overflow는 자식 요소로 이동 */
  margin-right: 1rem;
  /* 액션 버튼과의 간격 유지 */
  flex-grow: 1;
  /* 가능한 많은 공간 차지 */
}

/* 스크립트 이름 */
.script-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  /* 기본 마진 제거 */
  /* 이름이 길 경우 잘림 처리 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  /* 공간 부족 시 이름이 줄어들도록 함 */
}

/* 스크립트 날짜 스타일 수정 */
.script-date {
  font-size: 0.8rem;
  /* 작은 글씨 크기 */
  color: var(--color-text-secondary);
  /* 회색 계열 (정의된 변수 사용) */
  margin: 0;
  /* 기본 마진 제거 */
  white-space: nowrap;
  /* 줄바꿈 방지 */
  flex-shrink: 0;
  /* 날짜는 줄어들지 않도록 함 */
}

/* 카드 액션 영역 */
.card-actions {
  flex-shrink: 0;
}

/* 자세히 보기 버튼 */
.btn-primary.btn-sm {
  padding: 6px 8px;
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
  margin-bottom: 0.8rem;
  /* border-bottom: 1px solid var(--color-border); */
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
