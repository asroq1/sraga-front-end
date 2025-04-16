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
const generatedFiles = ref<{id: string, name: string}[]>([])
// 유저의 영수증 목록 관리
const userReceipts = ref<{id: string, name: string}[]>([])
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
            name: data.file_names[i] || `영수증_${i+1}.docx`
          })
        }
      } else if (data.receipt_id && data.file_name) {
        generatedFiles.value = [{
          id: data.receipt_id,
          name: data.file_name || 'receipt_report.docx'
        }]
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
      generatedFiles.value = [{
        id: tempId,
        name: fileName
      }]
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
      userReceipts.value = data.map(item => ({
        id: item.id,
        name: item.name || `영수증_${item.id}.docx`,
        created_date: item.created_date
      })) .sort((a, b) => new Date(b.created_date || '').getTime() - new Date(a.created_date || '').getTime())
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
        </div> <!-- upload-scroll-wrapper 끝 -->
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
        </div> <!-- upload-scroll-wrapper 끝 -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.receipt-view {
  max-width: 1100px;
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

/* 2단 레이아웃 컨테이너 */
.content-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

/* 왼쪽 업로드 컨테이너 */
.upload-container {
  background-color: var(--color-white);
  border-radius: var(--radius-md);
  padding: 0;
  box-shadow: var(--shadow-sm);
  width: 538.01px;
  min-height: 500px;
  height: auto;
  overflow: hidden;
}

.upload-scroll-wrapper {
  padding: 24px;
  max-height: 688.3px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 스크롤바 둥글게 */
.upload-scroll-wrapper::-webkit-scrollbar {
  width: 8px;
}

.upload-scroll-wrapper::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 8px;
}

.upload-scroll-wrapper::-webkit-scrollbar-thumb {
  background-color: #bbb;
  border-radius: 8px;
}

/* 오른쪽 영수증 목록 컨테이너 */
.receipt-container {
  background-color: var(--color-white);
  border-radius: var(--radius-md);
  padding: 0;
  box-shadow: var(--shadow-sm);
  width: 538.01px;
  min-height: 500px;
  height: auto;
  overflow: hidden;
}

.receipt-scroll-wrapper {
  padding: 24px;
  max-height: 688.3px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 스크롤바 둥글게 */
.receipt-scroll-wrapper::-webkit-scrollbar {
  width: 8px;
}

.receipt-scroll-wrapper::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 8px;
}

.receipt-scroll-wrapper::-webkit-scrollbar-thumb {
  background-color: #bbb;
  border-radius: 8px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--color-text);
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
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  transition: background-color 0.2s;
  cursor: pointer;
}

.file-input-label:hover {
  background-color: var(--color-primary-dark);
}

.selected-files-list {
  margin-top: 16px;
}

.selected-file {
  display: flex;
  height: 45px;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding: 10px;
  background-color: var(--color-background);
  border-radius: var(--radius-sm);

}

.btn-clear-all {
  margin-top: 12px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-clear-all:hover {
  background-color: var(--color-background-dark);
}

/* 업로드 성공 메시지 */
.success-message {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #e8f5e9;
  border-radius: var(--radius-md);
  color: var(--color-success, #2e7d32);
  margin-bottom: 16px;
}

.success-icon {
  color: var(--color-success, #2e7d32);
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
  padding: 10px;
  margin: 8px;
  background-color: var(--color-background);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-name {
  font-weight: 500;
  word-break: break-word;
}

.btn-download {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-download:hover {
  background-color: var(--color-primary-dark);
}

/* 파일 없음 메시지 */
.no-files-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 12px;
  text-align: center;
  color: var(--color-text-secondary);
  background-color: var(--color-background);
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
  padding: 24px;
}

.no-files-message .material-icon {
  font-size: 48px;
  opacity: 0.6;
}

.no-files-message p {
  margin: 0;
}

.no-files-message .sub-text {
  font-size: 14px;
  opacity: 0.8;
}

/* 미리보기 섹션 */
.preview-section {
  margin-top: 24px;
}

.preview-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
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
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
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

.user-input-field {
  width: 250px;
}

.name-input {
  flex: 1; /* 남은 공간 모두 차지 */
  height: 44px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background-color: var(--color-white);
}

.name-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
}

.name-input:disabled {
  background-color: var(--color-background);
  opacity: 0.7;
  cursor: not-allowed;
}

.actions {
  margin-top: 20px;
  padding: 0 12px;
}

.action-container {
  display: flex;
  gap: 12px; /* 입력란과 버튼 사이 간격 */
  align-items: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 0 16px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap; /* 텍스트 줄바꿈 방지 */
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.receipt-header .section-title {
  margin-bottom: 0;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-refresh:hover {
  background-color: var(--color-primary-dark);
}

.btn-refresh:disabled {
  background-color: var(--color-disabled);
  cursor: not-allowed;
}

.scroll-box {
  overflow-y: auto;
}

.receipt-list-container {
  background-color: var(--color-white);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  width: 538.01px;
  height: 688.3px;
  position: relative;
  overflow-y: auto; /* 스크롤 허용 */
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 60px; /* 하단 버튼을 위한 여백 */
}

.refresh-button-container {
  position: absolute;
  bottom: 24px;
  right: 24px;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-refresh:hover {
  background-color: var(--color-primary-dark);
}

.btn-refresh:disabled {
  background-color: var(--color-disabled);
  cursor: not-allowed;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-primary:disabled {
  background-color: var(--color-disabled);
  cursor: not-allowed;
}

/* 로딩 메시지 */
.loading-message {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 35px;
  margin: 16px 0;
  padding: 16px;
  background-color: #e3f2fd;
  border-radius: var(--radius-md);
  color: var(--color-primary);
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

/* 오류 메시지 */
.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  padding: 16px;
  background-color: #ffebee;
  border-radius: var(--radius-md);
  color: var(--color-error);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background-color: var(--color-background-dark);
}

/* 생성된 파일 섹션 */
.generated-files-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}

/* 반응형 */
@media (max-width: 768px) {
  .preview-container {
    grid-template-columns: 1fr;
  }

  .receipt-view {
    padding: 16px;
  }

  .upload-container, .receipt-list-container {
    padding: 16px;
  }

  .preview-item {
    width: 100%;
  }
  
  .image-preview {
    height: 160px;
  }
}
</style>

