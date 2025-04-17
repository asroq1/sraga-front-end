<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 상태 변수들
const selectedFiles = ref<File[]>([])
const previewUrls = ref<string[]>([])
const uploadStatus = ref<string>('')
const isUploading = ref(false)
const uploadSuccess = ref(false)
const inputFileName = ref('') // 사용자 이름 입력값

// 생성된 파일 목록 관리
const generatedFiles = ref<{ id: string; name: string }[]>([])
// 유저의 영수증 목록 관리
const userReceipts = ref<{ id: string; name: string }[]>([])
const isLoadingReceipts = ref(false)
const loadReceiptError = ref<string | null>(null)

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
  receipt_ids?: string[] // 영수증 ID 배열 추가
  file_names?: string[] // 파일 이름 배열 추가
}

const receiptData = ref<ReceiptData | null>(null)

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const newFiles = Array.from(input.files)
    selectedFiles.value = [...selectedFiles.value, ...newFiles]

    for (const file of newFiles) {
      const reader = new FileReader()
      reader.onload = (e) => {
        previewUrls.value.push(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }

    uploadStatus.value = ''
    uploadSuccess.value = false
    receiptData.value = null
  }
}

async function uploadReceipt() {
  if (selectedFiles.value.length === 0) {
    uploadStatus.value = '파일을 선택해주세요.'
    return
  }

  if (!inputFileName.value.trim()) {
    uploadStatus.value = '사용자 이름을 입력해주세요.'
    return
  }

  const userId = localStorage.getItem('userId')

  if (!userId) {
    uploadStatus.value = '사용자 정보가 없습니다.'
    return
  }

  try {
    isUploading.value = true
    uploadStatus.value = '업로드 중...'
    uploadSuccess.value = false

    const formData = new FormData()

    selectedFiles.value.forEach((file) => {
      formData.append(`files`, file)
    })

    formData.append('user_id', userId)
    formData.append('name', inputFileName.value)

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://3.39.195.183.nip.io'
    const response = await fetch(`${apiBaseUrl}/receipt/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const data = await response.json()
      receiptData.value = data

      if (data.receipt_ids && data.file_names) {
        generatedFiles.value = []
        for (let i = 0; i < data.receipt_ids.length; i++) {
          generatedFiles.value.push({
            id: data.receipt_ids[i],
            name: data.file_names[i] || `영수증_${i + 1}.docx`,
          })
        }
      } else if (data.receipt_id && data.file_name) {
        generatedFiles.value = [
          {
            id: data.receipt_id,
            name: data.file_name || 'receipt_report.docx',
          },
        ]
      }
    } else {
      const blob = await response.blob()

      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = inputFileName.value
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      const contentDisposition = response.headers.get('content-disposition')
      let fileName = 'receipt_report.docx'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch && filenameMatch[1]) {
          fileName = filenameMatch[1]
        }
      }

      const tempId = 'temp_' + Date.now()
      generatedFiles.value = [
        {
          id: tempId,
          name: fileName,
        },
      ]
    }

    uploadStatus.value = '업로드 성공! 분석이 완료되었습니다.'
    uploadSuccess.value = true

    await loadUserReceipts()
  } catch (error: unknown) {
    console.error('업로드 오류:', error)
    uploadStatus.value = `업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    uploadSuccess.value = false
  } finally {
    isUploading.value = false
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
  previewUrls.value.splice(index, 1)

  if (selectedFiles.value.length === 0) {
    uploadStatus.value = ''
    uploadSuccess.value = false
    receiptData.value = null
  }
}

function clearAllFiles() {
  selectedFiles.value = []
  previewUrls.value = []
  uploadStatus.value = ''
  uploadSuccess.value = false
  receiptData.value = null
}

async function downloadReceiptFile(receiptId: string, fileName: string) {
  try {
    // 서버에서 파일 다운로드
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://3.39.195.183.nip.io'
    const response = await fetch(`${apiBaseUrl}/receipt/download?receipt_id=${receiptId}`)

    if (!response.ok) {
      throw new Error(`다운로드 오류: ${response.status}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // URL 해제
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('다운로드 오류:', error)
    alert(`파일 다운로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
}

// ✅ 수정된 부분: 404 에러 graceful하게 처리
async function loadUserReceipts() {
  const userId = localStorage.getItem('userId')
  if (!userId) {
    loadReceiptError.value = '사용자 정보가 없습니다.'
    return
  }

  try {
    isLoadingReceipts.value = true
    loadReceiptError.value = null

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://3.39.195.183.nip.io'
    const response = await fetch(`${apiBaseUrl}/receipt/my/${userId}`)

    if (response.status === 404) {
      userReceipts.value = []
      loadReceiptError.value = null // 에러 숨기기
      return
    }

    if (!response.ok) {
      throw new Error(`영수증 목록 조회 오류: ${response.status}`)
    }

    const data = await response.json()

    if (Array.isArray(data)) {
      userReceipts.value = data
        .map((item) => ({
          id: item.id,
          name: item.name || `영수증_${item.id}.docx`,

          created_date: item.created_date,
        }))
        .sort(
          (a, b) =>
            new Date(b.created_date || '').getTime() - new Date(a.created_date || '').getTime(),
        )
    }
  } catch (error) {
    console.error('영수증 목록 조회 오류:', error)
    loadReceiptError.value = `영수증 목록 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
  } finally {
    isLoadingReceipts.value = false
  }
}

onMounted(() => {
  loadUserReceipts()
})
</script>

<template>
  <div class="receipt-view">
    <div class="header">
      <h2>📝 영수증 분석</h2>
      <p class="description">영수증 이미지를 업로드하면 내용을 자동으로 분석합니다.</p>
    </div>

    <!-- 2단 레이아웃 컨테이너 -->
    <div class="content-container">
      <!-- 수정된 upload-container 영역 -->
      <div class="upload-container">
        <div class="upload-scroll-wrapper">
          <!-- 업로드 성공 메시지 -->
          <div v-if="uploadSuccess" class="success-message">
            <div class="success-icon">
              <span class="material-icon">check_circle</span>
            </div>
            <p>업로드 성공! 분석이 완료되었습니다.</p>
          </div>

          <div class="file-input-wrapper">
            <input
              type="file"
              id="receipt-upload"
              accept="image/*"
              @change="handleFileSelect"
              :disabled="isUploading"
              multiple
            />
            <label for="receipt-upload" class="file-input-label">
              <span class="material-icon">upload_file</span>
              영수증 이미지 선택 (여러장 가능)
            </label>

            <div v-if="selectedFiles.length > 0" class="selected-files-list">
              <div v-for="(file, index) in selectedFiles" :key="index" class="selected-file">
                <p>{{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)</p>
                <button class="btn-icon" @click="removeFile(index)" :disabled="isUploading">
                  <span class="material-icon">close</span>
                </button>
              </div>
              <button
                v-if="selectedFiles.length > 1"
                class="btn-clear-all"
                @click="clearAllFiles"
                :disabled="isUploading"
              >
                모두 지우기
              </button>
            </div>
          </div>

          <div class="preview-section" v-if="previewUrls.length > 0">
            <div class="preview-container">
              <div v-for="(preview, index) in previewUrls" :key="index" class="preview-item">
                <div class="image-preview">
                  <img :src="preview" :alt="`영수증 미리보기 ${index + 1}`" />
                </div>
                <div class="preview-caption">이미지 #{{ index + 1 }}</div>
              </div>
            </div>

            <div class="actions">
              <div class="action-container">
                <input
                  type="text"
                  v-model="inputFileName"
                  placeholder="파일명을 입력하세요"
                  class="name-input"
                  :disabled="isUploading"
                />
                <button
                  class="btn-primary"
                  @click="uploadReceipt"
                  :disabled="isUploading || selectedFiles.length === 0"
                >
                  <span class="material-icon">cloud_upload</span>
                  보고서 생성
                </button>
              </div>
            </div>
          </div>

          <div v-if="isUploading" class="loading-message">
            <div class="loading-spinner"></div>
            <p>업로드 중...</p>
          </div>

          <div v-if="uploadStatus && uploadStatus.includes('실패')" class="error-message">
            <span class="material-icon">error</span>
            <p>{{ uploadStatus }}</p>
          </div>

          <!-- <div class="generated-files-section" v-if="generatedFiles.length > 0">
            <h3 class="section-title">생성된 파일</h3>
            <div class="files-list">
              <div v-for="(file, index) in generatedFiles" :key="index" class="file-item">
                <div class="file-info">
                  <span class="material-icon">description</span>
                  <span class="file-name">{{ inputFileName }}</span>
                </div>
                <button class="btn-download" @click="downloadReceiptFile(file.id, inputFileName)">
                  <span class="material-icon">download</span>
                </button>
              </div>
            </div>
          </div> -->
        </div>
        <!-- upload-scroll-wrapper 끝 -->
      </div>

      <!-- 오른쪽: 유저의 보고서서 목록 컨테이너 -->
      <div class="receipt-container">
        <div class="receipt-scroll-wrapper">
          <div class="receipt-header">
            <h3 class="section-title">내 보고서 목록</h3>
            <button class="btn-refresh" @click="loadUserReceipts" :disabled="isLoadingReceipts">
              <span class="material-icon">refresh</span>
              목록 새로고침
            </button>
          </div>

          <!-- 로딩 표시 -->
          <div v-if="isLoadingReceipts" class="loading-message">
            <div class="loading-spinner"></div>
            <p>보고서 목록 로딩 중...</p>
          </div>

          <!-- 오류 메시지 -->
          <div v-if="loadReceiptError" class="error-message">
            <span class="material-icon">error</span>
            <p>{{ loadReceiptError }}</p>
          </div>

          <!-- 영수증 목록 -->

          <div class="files-list">
            <div v-if="userReceipts.length > 0">
              <div v-for="(receipt, index) in userReceipts" :key="index" class="file-item">
                <div class="file-info">
                  <span class="material-icon">receipt</span>
                  <span class="file-name">{{ receipt.name }}</span>
                </div>
                <button class="btn-download" @click="downloadReceiptFile(receipt.id, receipt.name)">
                  <span class="material-icon">download</span>
                </button>
              </div>
            </div>

            <!-- 보고서가 없을 때 메시지 -->
            <div v-else-if="!isLoadingReceipts && !loadReceiptError" class="no-files-message">
              <span class="material-icon">folder_open</span>
              <p>저장된 보고서가 없습니다.</p>
              <p class="sub-text">영수증을 분석하면 목록에 추가됩니다.</p>
            </div>
          </div>
        </div>
        <!-- upload-scroll-wrapper 끝 -->
      </div>
    </div>
  </div>
</template>
<style scoped>
/* Google Material Design 스타일 적용 */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

:root {
  --color-primary: #1a73e8;
  --color-primary-dark: #1765cc;
  --color-primary-light: #e8f0fe;
  --color-secondary: #5f6368;
  --color-background: #f8f9fa;
  --color-surface: #ffffff;
  --color-error: #d93025;
  --color-success: #0f9d58;
  --color-warning: #f29900;
  --color-text: #202124;
  --color-text-secondary: #5f6368;
  --color-border: #dadce0;
  --color-disabled: #e0e0e0;
  --shadow-sm: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
  --shadow-md: 0 2px 6px 2px rgba(60, 64, 67, 0.15);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --spacing-unit: 8px;
}

.receipt-view {
  font-family: 'Roboto', sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background-color: var(--color-background);
  color: var(--color-text);
}

.header {
  margin-bottom: 32px;
  text-align: center;
}

.header h2 {
  color: var(--color-text);
  font-size: 28px;
  font-weight: 500;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

.description {
  color: var(--color-text-secondary);
  font-size: 16px;
  max-width: 600px;
  margin: 0 auto;
}

/* 2단 레이아웃 컨테이너 */
.content-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

/* 컨테이너 공통 스타일 */
.upload-container,
.receipt-container {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow 0.2s ease;
  height: auto;
  min-height: 500px;
}

.upload-container:hover,
.receipt-container:hover {
  box-shadow: var(--shadow-md);
}

.upload-scroll-wrapper,
.receipt-scroll-wrapper {
  padding: 24px;
  max-height: 700px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 스크롤바 스타일링 */
.upload-scroll-wrapper::-webkit-scrollbar,
.receipt-scroll-wrapper::-webkit-scrollbar {
  width: 8px;
}

.upload-scroll-wrapper::-webkit-scrollbar-track,
.receipt-scroll-wrapper::-webkit-scrollbar-track {
  background: #f1f3f4;
  border-radius: 8px;
}

.upload-scroll-wrapper::-webkit-scrollbar-thumb,
.receipt-scroll-wrapper::-webkit-scrollbar-thumb {
  background-color: #dadce0;
  border-radius: 8px;
}

.upload-scroll-wrapper::-webkit-scrollbar-thumb:hover,
.receipt-scroll-wrapper::-webkit-scrollbar-thumb:hover {
  background-color: #bdc1c6;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 16px;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

/* 파일 업로드 영역 */
.file-input-wrapper {
  position: relative;
  margin-bottom: 24px;
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
  gap: 8px;
  background-color: var(--color-primary);
  color: white;
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3);
}

.file-input-label:hover {
  background-color: var(--color-primary-dark);
  box-shadow: 0 2px 6px rgba(60, 64, 67, 0.3);
}

.file-input-label:active {
  transform: translateY(1px);
}

.file-input-label .material-icon {
  font-size: 20px;
}

/* 선택된 파일 목록 */
.selected-files-list {
  margin-top: 16px;
}

.selected-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding: 12px 16px;
  background-color: #f1f3f4;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
}

.selected-file:hover {
  background-color: #e8eaed;
}

.btn-clear-all {
  margin-top: 12px;
  background-color: transparent;
  border: 1px solid var(--color-border);
  padding: 8px 16px;
  border-radius: 16px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-clear-all:hover {
  background-color: #f1f3f4;
  border-color: var(--color-secondary);
}

/* 상태 메시지 스타일 */
.success-message {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #e6f4ea;
  border-radius: var(--radius-md);
  color: var(--color-success);
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-icon {
  display: flex;
  align-items: center;
}

.success-icon .material-icon {
  font-size: 24px;
  color: var(--color-success);
}

.success-message p {
  font-weight: 500;
  margin: 0;
}

/* 파일 목록 */
.files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f1f3f4;
  border-radius: var(--radius-md);
  transition: all 0.2s;
  border: none;
}

.file-item:hover {
  background-color: #e8eaed;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(60, 64, 67, 0.15);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-info .material-icon {
  color: var(--color-primary);
  font-size: 22px;
}

.file-name {
  font-weight: 500;
  word-break: break-word;
  color: var(--color-text);
}

.btn-download {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3);
}

.btn-download:hover {
  background-color: var(--color-primary-dark);
  box-shadow: 0 2px 5px rgba(60, 64, 67, 0.3);
  transform: scale(1.05);
}

.btn-download:active {
  transform: scale(0.95);
}

/* 파일 없음 메시지 */
.no-files-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 16px;
  text-align: center;
  color: var(--color-text-secondary);
  background-color: #f8f9fa;
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
  padding: 32px;
}

.no-files-message .material-icon {
  font-size: 48px;
  color: #bdc1c6;
}

.no-files-message p {
  margin: 0;
  font-weight: 500;
}

.no-files-message .sub-text {
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* 미리보기 섹션 */
.preview-section {
  margin-top: 24px;
}

.preview-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.image-preview {
  width: 100%;
  height: 160px;
  border: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.2);
  transition: all 0.2s;
}

.image-preview:hover {
  box-shadow: 0 2px 6px rgba(60, 64, 67, 0.3);
  transform: translateY(-2px);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.preview-caption {
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 14px;
  text-align: center;
}

/* 입력 필드 및 액션 영역 */
.actions {
  margin-top: 24px;
}

.action-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.name-input {
  flex: 1;
  height: 44px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: 24px;
  font-size: 14px;
  background-color: var(--color-surface);
  transition: all 0.2s;
}

.name-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}

.name-input:disabled {
  background-color: #f1f3f4;
  opacity: 0.7;
  cursor: not-allowed;
}

/* 버튼 스타일 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  background-color: var(--color-primary);
  color: white;
  padding: 0 24px;
  border-radius: 24px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3);
  white-space: nowrap;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
  box-shadow: 0 2px 6px rgba(60, 64, 67, 0.3);
}

.btn-primary:active {
  transform: translateY(1px);
}

.btn-primary:disabled {
  background-color: var(--color-disabled);
  color: var(--color-text-secondary);
  box-shadow: none;
  cursor: not-allowed;
}

.btn-primary .material-icon {
  font-size: 20px;
}

/* 헤더 영역 */
.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.receipt-header .section-title {
  margin-bottom: 0;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-primary);
  color: white;
  padding: 8px 16px;
  border-radius: 24px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3);
}

.btn-refresh:hover {
  background-color: var(--color-primary-dark);
  box-shadow: 0 2px 5px rgba(60, 64, 67, 0.3);
}

.btn-refresh:active {
  transform: translateY(1px);
}

.btn-refresh:disabled {
  background-color: var(--color-disabled);
  color: var(--color-text-secondary);
  box-shadow: none;
  cursor: not-allowed;
}

.btn-refresh .material-icon {
  font-size: 18px;
}

/* 아이콘 버튼 */
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: rgba(95, 99, 104, 0.1);
  color: var(--color-text);
}

.btn-icon:active {
  background-color: rgba(95, 99, 104, 0.2);
}

/* 로딩 및 에러 메시지 */
.loading-message {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  padding: 16px;
  background-color: #e8f0fe;
  border-radius: var(--radius-md);
  color: var(--color-primary);
  animation: fadeIn 0.3s ease;
}

.loading-spinner {
  width: 24px;
  height: 24px;
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

.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  padding: 16px;
  background-color: #fce8e6;
  border-radius: var(--radius-md);
  color: var(--color-error);
  animation: fadeIn 0.3s ease;
}

.error-message .material-icon {
  font-size: 24px;
}

/* 반응형 */
@media (max-width: 1024px) {
  .content-container {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .upload-container,
  .receipt-container {
    width: 100%;
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .receipt-view {
    padding: 16px;
  }

  .preview-container {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .action-container {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .receipt-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .btn-refresh {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .preview-container {
    grid-template-columns: 1fr 1fr;
  }

  .image-preview {
    height: 120px;
  }

  .header h2 {
    font-size: 24px;
  }
}
</style>
