<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 상태 변수들
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const uploadStatus = ref<string>('')
const isUploading = ref(false)
interface ReceiptItem {
  name: string
  quantity: number
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
async function uploadReceipt() {
  if (!selectedFile.value) {
    uploadStatus.value = '파일을 선택해주세요.'
    return
  }

  try {
    isUploading.value = true
    uploadStatus.value = '업로드 중...'

    const formData = new FormData()
    formData.append('file', selectedFile.value)

    // API 엔드포인트 호출
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const response = await fetch(`${apiBaseUrl}/receipt/upload/`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }

    const data = await response.json()
    receiptData.value = data
    uploadStatus.value = '업로드 성공!'
  } catch (error: unknown) {
    console.error('업로드 오류:', error)
    uploadStatus.value = `업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
  } finally {
    isUploading.value = false
  }
}

// 파일 선택 취소
function clearSelection() {
  selectedFile.value = null
  previewUrl.value = null
  uploadStatus.value = ''
  receiptData.value = null
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
      :class="{ error: uploadStatus.includes('실패') }"
    >
      {{ uploadStatus }}
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

.description {
  color: #666;
  margin-top: 8px;
}

.upload-container {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.file-input-wrapper {
  margin-bottom: 16px;
}

.file-input-wrapper input[type='file'] {
  display: none;
}

.file-input-label {
  display: inline-flex;
  align-items: center;
  background-color: #4a90e2;
  color: white;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.file-input-label:hover {
  background-color: #3a80d2;
}

.material-icon {
  margin-right: 8px;
  font-size: 20px;
}

.selected-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #e8f0fe;
  border-radius: 4px;
}

.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-preview {
  max-width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  max-width: 100%;
  display: block;
}

.actions {
  display: flex;
  justify-content: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #3d9c40;
}

.btn-primary:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.btn-icon {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
}

.status-message {
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 4px;
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-message.error {
  background-color: #ffebee;
  color: #c62828;
}

.receipt-data {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.data-section {
  margin-bottom: 24px;
}

.data-section h4 {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.data-item {
  display: flex;
  margin-bottom: 8px;
}

.label {
  width: 80px;
  font-weight: 500;
  color: #555;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.item-name {
  flex: 1;
}

.item-quantity {
  width: 60px;
  text-align: center;
}

.item-price {
  width: 100px;
  text-align: right;
  font-weight: 500;
}

.raw-text {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 14px;
  max-height: 200px;
  overflow-y: auto;
}
</style>
