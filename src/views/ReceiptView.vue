<script setup lang="ts">
import { ref, onMounted } from 'vue'
// import { api } from '../services/api'

// 상태 변수들 부분에 docxUrl 추가
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const uploadStatus = ref<string>('')
const isUploading = ref(false)
const docxUrl = ref<string | null>(null) // 문서 다운로드 URL

interface ReceiptItem {
  name: string
  quantity?: number
  price: number
}

interface ReceiptData {
  store_name?: string
  date?: string
  total_amount?: number
  items?: ReceiptItem[]
  raw_text?: string
}

const receiptData = ref<ReceiptData | null>(null)

// 파일 선택 핸들러
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0]

    // 이미지 미리보기 생성
    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(selectedFile.value)

    // 업로드 상태 초기화
    uploadStatus.value = ''
    receiptData.value = null
  }
}

// 파일 업로드 함수
// uploadReceipt 함수 수정
async function uploadReceipt() {
  if (!selectedFile.value) {
    uploadStatus.value = '파일을 선택해주세요.'
    return
  }

  // Get scriptId and sraga_name from localStorage
  const userId = localStorage.getItem('userId')
  const name = localStorage.getItem('sraga_name') || 'test'

  if (!userId || !name) {
    uploadStatus.value = '사용자 정보가 없습니다.'
    return
  }

  try {
    isUploading.value = true
    uploadStatus.value = '업로드 중...'
    docxUrl.value = null // 초기화

    const formData = new FormData()
    formData.append('files', selectedFile.value)
    formData.append('user_id', userId)
    formData.append('name', name)

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const response = await fetch(`${apiBaseUrl}/receipt/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }

    // 응답 헤더에서 파일명 추출
    const contentDisposition = response.headers.get('content-disposition')
    let filename = 'expense_report.docx'

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1]
      }
    }

    // Blob 생성 및 다운로드 URL 설정
    const blob = await response.blob()
    docxUrl.value = URL.createObjectURL(blob)

    // JSON 데이터가 있는 경우 처리 (서버 응답이 JSON인 경우)
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json()
      receiptData.value = data
    }
    // 성공 메시지 추가
    uploadStatus.value = '업로드 성공! 분석이 완료되었습니다.'
  } catch (error: unknown) {
    console.error('업로드 오류:', error)
    uploadStatus.value = `업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
  } finally {
    isUploading.value = false
  }
}

// 파일 선택 취소 함수 수정
function clearSelection() {
  selectedFile.value = null
  previewUrl.value = null
  uploadStatus.value = ''
  receiptData.value = null

  // docxUrl이 있으면 해제
  if (docxUrl.value) {
    URL.revokeObjectURL(docxUrl.value)
    docxUrl.value = null
  }
}

// 문서 다운로드 함수 추가
function downloadDocument() {
  if (!docxUrl.value) return

  const a = document.createElement('a')
  a.href = docxUrl.value
  a.download = 'expense_report.docx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// 컴포넌트 마운트 시 초기화
onMounted(() => {
  // 필요한 초기화 작업
})
</script>

<template>
  <div class="receipt-view">
    <div class="header">
      <h2>📝 영수증 분석</h2>
      <p class="description">영수증 이미지를 업로드하면 내용을 자동으로 분석합니다.</p>
    </div>

    <div class="upload-container">
      <div class="file-input-wrapper">
        <input
          type="file"
          id="receipt-upload"
          accept="image/*"
          @change="handleFileSelect"
          :disabled="isUploading"
        />
        <label for="receipt-upload" class="file-input-label">
          <span class="material-icon">upload_file</span>
          영수증 이미지 선택
        </label>

        <div v-if="selectedFile" class="selected-file">
          <p>{{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)</p>
          <button class="btn-icon" @click="clearSelection" :disabled="isUploading">
            <span class="material-icon">close</span>
          </button>
        </div>
      </div>

      <div class="preview-actions" v-if="previewUrl">
        <div class="image-preview">
          <img :src="previewUrl" alt="영수증 미리보기" />
        </div>

        <div class="actions">
          <button
            class="btn-primary"
            @click="uploadReceipt"
            :disabled="isUploading || !selectedFile"
          >
            <span class="material-icon">cloud_upload</span>
            분석하기
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="uploadStatus"
      class="status-message"
      :class="{
        error: uploadStatus.includes('실패'),
        loading: uploadStatus.includes('업로드 중'),
        success: uploadStatus.includes('성공'),
      }"
    >
      <span class="status-icon material-icon">
        {{
          uploadStatus.includes('실패')
            ? 'error'
            : uploadStatus.includes('업로드 중')
              ? 'hourglass_top'
              : uploadStatus.includes('성공')
                ? 'check_circle'
                : 'info'
        }}
      </span>
      <span class="status-text">{{ uploadStatus }}</span>
      <div v-if="uploadStatus.includes('업로드 중')" class="loading-spinner"></div>
    </div>

    <!-- 문서 다운로드 섹션 추가 -->
    <div v-if="docxUrl" class="document-download">
      <div class="download-card">
        <button class="btn-download" @click="downloadDocument">
          <span class="material-icon">download</span>
          다운로드
        </button>
      </div>
    </div>

    <div v-if="receiptData" class="receipt-data">
      <h3>분석 결과</h3>

      <div class="data-section">
        <h4>기본 정보</h4>
        <div class="data-item">
          <span class="label">상점명:</span>
          <span class="value">{{ receiptData.store_name || '인식 불가' }}</span>
        </div>
        <div class="data-item">
          <span class="label">날짜:</span>
          <span class="value">{{ receiptData.date || '인식 불가' }}</span>
        </div>
        <div class="data-item">
          <span class="label">총액:</span>
          <span class="value">{{ receiptData.total_amount || '인식 불가' }}</span>
        </div>
      </div>

      <div class="data-section" v-if="receiptData.items && receiptData.items.length > 0">
        <h4>구매 항목</h4>
        <div class="items-list">
          <div v-for="(item, index) in receiptData.items" :key="index" class="item">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-quantity">{{ item.quantity || 1 }}개</span>
            <span class="item-price">{{ item.price }}원</span>
          </div>
        </div>
      </div>

      <div class="data-section">
        <h4>원본 텍스트</h4>
        <pre class="raw-text">{{ receiptData.raw_text || '텍스트 추출 실패' }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.receipt-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 24px;
  text-align: center;
}

.header h2 {
  color: var(--color-text);
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.description {
  color: var(--color-text-secondary);
  font-size: 16px;
}

.upload-container {
  background-color: var(--color-white);
  border-radius: var(--radius-md);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.file-input-wrapper {
  position: relative;
}

.file-input-wrapper input[type='file'] {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.file-input-label {
  display: inline-flex;
  align-items: center;
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 12px 20px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  transition: background-color 0.2s;
  cursor: pointer; /* 추가: 커서를 포인터로 변경 */
}

.file-input-label:hover {
  background-color: var(--color-primary-dark);
}

.selected-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 12px;
  background-color: var(--color-background);
  border-radius: var(--radius-sm);
}

.image-preview {
  margin-top: 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.receipt-data {
  background-color: var(--color-white);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.data-section {
  margin-bottom: 24px;
}

.data-section h4 {
  color: var(--color-text);
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.data-item {
  display: flex;
  margin-bottom: 12px;
}

.label {
  width: 100px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.items-list .item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background-color: var(--color-background);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
}

.document-download {
  margin: 24px 0;
}

.download-card {
  background-color: var(--color-white);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.btn-download {
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-download:hover {
  background-color: var(--color-primary-dark);
}

.status-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: var(--radius-md);
  background-color: var(--color-background);
  margin-bottom: 20px;
}

.status-message.loading {
  background-color: #e3f2fd;
  color: var(--color-primary);
}

.status-message.success {
  background-color: #e8f5e9;
  color: var(--color-success);
}

.status-message.error {
  background-color: #ffebee;
  color: var(--color-error);
}

.status-icon {
  font-size: 24px;
}

.status-text {
  flex: 1;
  font-weight: 500;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .receipt-view {
    padding: 16px;
  }

  .upload-container {
    padding: 16px;
  }

  .receipt-data {
    padding: 16px;
  }
}
</style>
