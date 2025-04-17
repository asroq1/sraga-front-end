<template>
  <div class="script-list-view">
    <!-- User Info -->
    <div v-if="userName" class="user-display">
      <span class="material-icon">account_circle</span>
      <span>안녕하세요, {{ userName }}님!</span>
    </div>

    <!-- Header -->
    <div class="list-header">
      <h1 class="view-title">미팅 목록</h1>
      <button @click="createNewMeeting" class="btn-primary create-meeting-btn">
        <span class="material-icon">add_circle_outline</span>
        <span>새 미팅 생성</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <p>미팅 목록을 불러오는 중...</p>
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <ErrorAlert v-else-if="error">
      미팅 목록을 불러오는 중 오류가 발생했습니다:<br />
      <span style="font-weight: 400">{{ error }}</span>
    </ErrorAlert>

    <!-- Script List -->
    <div v-else-if="scripts.length > 0" class="script-grid">
      <div v-for="script in scripts" :key="script.id" class="card script-card">
        <div class="card-content">
          <h2 class="script-name">{{ script.name || '제목 없음' }}</h2>
          <p class="script-date">{{ formatDate(script.created_date) }}</p>
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

    <!-- Empty State -->
    <div v-else class="no-data-container card">
      <span class="material-icon large-icon">description</span>
      <p>생성된 미팅이 없습니다.</p>
      <p class="sub-text">새로운 스크립트을 생성해보세요.</p>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="cancelModal">
      <div
        class="modal-container card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div class="modal-header modern-modal-header"></div>
        <div class="modal-body modern-modal-body">
          <label for="meetingNameInput" class="input-label modern-input-label">미팅 이름</label>
          <input
            id="meetingNameInput"
            type="text"
            v-model="newMeetingName"
            placeholder="예: 2024년 6월 기획 회의"
            class="modal-input modern-modal-input"
            :aria-invalid="showNameRequiredWarning ? 'true' : 'false'"
            @keyup.enter="saveMeetingName"
            autofocus
          />
          <p v-if="showNameRequiredWarning" class="warning-text modern-warning-text">
            <span class="material-icon warning-icon">error</span>
            미팅 이름을 입력해주세요.
          </p>
        </div>
        <div class="modal-footer modern-modal-footer">
          <button @click="cancelModal" class="btn-secondary modern-btn-secondary">취소</button>
          <button @click="saveMeetingName" class="btn-primary modern-btn-primary">생성</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import ErrorAlert from '@/components/ErrorAlert.vue'

const URI_SCRIPT_ALL = '/script/all/'
const URI_SCRIPT_CREATE = '/script/create'

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

const scripts = ref<Script[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const userName = ref<string | null>(null)
const userId = ref<number>(-1)
const router = useRouter()

const showModal = ref(false)
const newMeetingName = ref('')
const showNameRequiredWarning = ref(false)

const viewScriptDetail = (scriptId: string) => {
  // Find the script with matching ID
  const selectedScript = scripts.value.find((script) => script.id === scriptId)

  // Save script name to localStorage if found
  if (selectedScript) {
    localStorage.setItem('new_meeting_name', selectedScript.name || '제목 없음')
  }

  router.push({ name: 'script', params: { id: scriptId } })
}

const meetingSummaryRoute = (scriptId: string | number) => {
  router.push({
    path: '/meeting-summary',
    query: { scriptId: scriptId.toString() },
  })
}

const createNewMeeting = () => {
  newMeetingName.value = ''
  showNameRequiredWarning.value = false
  showModal.value = true
}

const cancelModal = () => {
  showModal.value = false
  showNameRequiredWarning.value = false
}

const saveMeetingName = async () => {
  if (!newMeetingName.value.trim()) {
    showNameRequiredWarning.value = true
    return
  }

  let script_Id = null
  const meetingNameToSave = newMeetingName.value.trim()
  showModal.value = false
  showNameRequiredWarning.value = false

  const body: CreateScriptBody = {
    user_id: userId.value,
    name: meetingNameToSave,
  }

  try {
    const response: CreateScriptData = await api.post(URI_SCRIPT_CREATE, body)
    script_Id = response.id
  } catch (err) {
    if (err instanceof Error) {
      error.value = '서버와 통신 중 문제가 발생했습니다.'
    } else {
      error.value = '알 수 없는 오류가 발생했습니다.'
    }
    // meeting 생성 실패 시 alert 추가
    alert('새 미팅 생성에 실패했습니다. 다시 시도해 주세요.')
    return
  }
  router.push({ name: 'script', params: { id: script_Id } })
}

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

    if (Array.isArray(response)) {
      fetchedScripts = response.map((item) => ({
        id: item.id,
        name: item.name,
        created_date: new Date(item.created_date),
      }))
    } else {
      fetchedScripts = []
    }

    fetchedScripts.sort((a, b) => b.created_date.getTime() - a.created_date.getTime())
    scripts.value = fetchedScripts
  } catch (err) {
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

const formatDate = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '날짜 정보 없음'
  }
  const today = new Date()
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  if (isToday) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  } else {
    return date
      .toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\. /g, '-')
      .replace('.', '')
  }
}

onMounted(() => {
  userName.value = localStorage.getItem('sraga_name')
  const storedUserId = localStorage.getItem('userId')
  if (storedUserId) {
    userId.value = parseInt(storedUserId, 10)
    if (isNaN(userId.value)) {
      alert('로그인 오류')
      localStorage.removeItem('userId')
      localStorage.removeItem('sraga_name')
      router.push({ name: 'login' })
    }
  } else {
    console.error('로컬 스토리지에 userId가 없습니다.')
  }

  if (userId.value !== null) {
    loadScripts()
  } else {
    error.value = '사용자 정보를 불러올 수 없어 미팅 목록을 로드할 수 없습니다.'
    scripts.value = []
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

/* 기본 색상 및 스타일 직접 지정 */
.script-list-view {
  font-family: 'Roboto', sans-serif;
  background: #f5f7fa;
  min-height: 100vh;
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
  color: #222;
  position: relative;
}

/* User Info (Chip style) */
.user-display {
  position: absolute;
  top: 24px;
  left: 0px;
  background: #fff;
  color: #5f6368;
  padding: 4px 16px;
  border-radius: 999px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 1px 4px rgba(60, 64, 67, 0.08);
  border: 1px solid #e0e0e0;
  z-index: 10;
}
.user-display .material-icon {
  font-size: 1.2em;
  color: #1a73e8;
}

/* Header */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  margin-top: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}
.view-title {
  font-size: 1.6rem;
  font-weight: 500;
  margin: 0;
  color: #222;
}

/* Contained Button (Material style) */
.create-meeting-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 24px;
  font-size: 1rem;
  font-weight: 500;
  background: #1a73e8;
  color: #fff;
  border: none;
  border-radius: 999px;
  box-shadow: 0 1px 4px rgba(60, 64, 67, 0.08);
  cursor: pointer;
  transition:
    background 0.18s,
    box-shadow 0.18s;
}
.create-meeting-btn .material-icon {
  font-size: 1.2em;
}
.create-meeting-btn:hover {
  background: #1765c1;
  box-shadow: 0 4px 12px rgba(60, 64, 67, 0.12);
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
  color: #5f6368;
}
.loading-container p {
  margin-top: 16px;
  font-size: 1rem;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e8f0fe;
  border-radius: 50%;
  border-top-color: #1a73e8;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error */
.status-message.error {
  background: #fdeeee;
  color: #d93025;
  border-left: 4px solid #d93025;
  padding: 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  box-shadow: 0 1px 4px rgba(60, 64, 67, 0.08);
}
.status-message.error .material-icon {
  font-size: 1.3em;
}

/* Script List */
.script-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Card */
.card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(60, 64, 67, 0.08);
  border: 1px solid #e0e0e0;
  transition:
    box-shadow 0.18s,
    transform 0.18s;
  overflow: hidden;
}
.card:hover {
  box-shadow: 0 4px 12px rgba(60, 64, 67, 0.12);
  transform: translateY(-2px);
}

/* Script Card */
.script-card {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-right: 24px;
  overflow: hidden;
}
.script-name {
  font-size: 1.15rem;
  font-weight: 500;
  color: #222;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.script-date {
  font-size: 0.92rem;
  color: #5f6368;
  margin: 0;
  white-space: nowrap;
}
.card-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Text Button (Material style) */
.btn-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 16px;
  font-size: 0.98rem;
  font-weight: 500;
  color: #1a73e8;
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-text:hover {
  background: #e8f0fe;
}
.btn-text.btn-sm {
  font-size: 0.92rem;
  padding: 4px 8px;
}
.btn-text .material-icon {
  font-size: 1em;
  margin-left: 2px;
}

/* Empty State */
.no-data-container {
  text-align: center;
  padding: 32px 24px;
}
.no-data-container .material-icon.large-icon {
  font-size: 3rem;
  color: #5f6368;
  margin-bottom: 16px;
}
.sub-text {
  font-size: 1rem;
  color: #5f6368;
  margin: 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
}
.modal-container {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(60, 64, 67, 0.12);
  width: 100%;
  max-width: 420px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 8px;
}
.modal-title {
  font-size: 1.2rem;
  font-weight: 500;
  color: #222;
  margin: 0;
}
.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.15s;
}
.modal-close-btn:hover {
  background: #e8f0fe;
}
.modal-close-btn .material-icon {
  font-size: 1.4rem;
  color: #5f6368;
}
.modal-body {
  padding: 0 24px 24px;
}
.input-label {
  display: block;
  font-size: 0.95rem;
  color: #5f6368;
  margin-bottom: 4px;
}
.modal-input {
  width: 100%;
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  color: #222;
  background: #fff;
  box-sizing: border-box;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.modal-input:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px #e8f0fe;
}
.modal-input[aria-invalid='true'] {
  border-color: #d93025;
}
.warning-text {
  color: #d93025;
  font-size: 0.92rem;
  margin-top: 4px;
  padding-left: 16px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px 24px;
  border-top: 1px solid #e0e0e0;
}

/* Primary Button (for modal) */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 24px;
  font-size: 1rem;
  font-weight: 500;
  background: #1a73e8;
  color: #fff;
  border: none;
  border-radius: 999px;
  box-shadow: 0 1px 4px rgba(60, 64, 67, 0.08);
  cursor: pointer;
  transition:
    background 0.18s,
    box-shadow 0.18s;
}
.btn-primary:hover {
  background: #1765c1;
  box-shadow: 0 4px 12px rgba(60, 64, 67, 0.12);
}

/* Responsive */
@media (max-width: 600px) {
  .script-list-view {
    padding: 16px 4px;
  }
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .card-actions {
    flex-direction: column;
    gap: 4px;
  }
}

/* --- Modern Material Modal Styles --- */
.modern-modal-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 32px 32px 0 32px;
  border-bottom: none;
  background: transparent;
  position: relative;
}
.modal-header-icon {
  font-size: 2.4rem;
  color: #1a73e8;
  flex-shrink: 0;
  margin-top: 2px;
}
.modern-modal-title {
  font-size: 1.35rem;
  font-weight: 600;
  color: #222;
  margin: 0 0 2px 0;
  letter-spacing: -0.01em;
}
.modal-subtitle {
  font-size: 1rem;
  color: #5f6368;
  margin-bottom: 0;
  margin-top: 0;
}
.modal-close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.15s;
}
.modal-close-btn:hover {
  background: #e8f0fe;
}
.modal-close-btn .material-icon {
  font-size: 1.5rem;
  color: #5f6368;
}

.modern-modal-body {
  padding: 24px 32px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.modern-input-label {
  font-size: 1rem;
  color: #5f6368;
  margin-bottom: 4px;
  font-weight: 500;
}
.modern-modal-input {
  font-size: 1.08rem;
  padding: 12px 16px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  background: #fafbfc;
  color: #222;
  transition:
    border-color 0.18s,
    box-shadow 0.18s;
  outline: none;
}
.modern-modal-input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px #e8f0fe;
  background: #fff;
}
.modern-modal-input[aria-invalid='true'] {
  border-color: #d93025;
  background: #fff7f7;
}
.modern-warning-text {
  color: #d93025;
  font-size: 0.97rem;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.warning-icon {
  font-size: 1.2em;
  margin-right: 2px;
}

.modern-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 32px 32px 32px 32px;
  border-top: none;
  background: transparent;
}
.modern-btn-secondary {
  background: none;
  color: #1a73e8;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 999px;
  padding: 10px 22px;
  cursor: pointer;
  transition: background 0.15s;
}
.modern-btn-secondary:hover {
  background: #e8f0fe;
}
.modern-btn-primary {
  background: #1a73e8;
  color: #fff;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 999px;
  padding: 10px 28px;
  box-shadow: 0 1px 4px rgba(60, 64, 67, 0.08);
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s;
}
.modern-btn-primary:hover {
  background: #1765c1;
  box-shadow: 0 4px 12px rgba(60, 64, 67, 0.12);
}

/* 반응형 */
@media (max-width: 600px) {
  .modal-container {
    max-width: 98vw;
    border-radius: 10px;
  }
  .modern-modal-header,
  .modern-modal-body,
  .modern-modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
