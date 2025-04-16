// API 기본 URL 가져오기
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// API 요청 함수
export const api = {
  // GET 요청
  async get(endpoint: string) {
    const response = await fetch(`${apiBaseUrl}${endpoint}`)
    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }
    return response.json()
  },

  // POST 요청
  async post(endpoint: string, data: any) {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }
    return response.json()
  },

  // 파일 업로드 요청
  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, string>) {
    const formData = new FormData()
    formData.append('file', file)

    // 추가 데이터가 있으면 FormData에 추가
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }

    return response.json()
  },

  // WebSocket 연결 생성
  createWebSocket(endpoint: string) {
    return new WebSocket(`${apiBaseUrl.replace('http', 'ws')}${endpoint}`)
  },
}

// 번역 관련 API 함수
export const translationApi = {
  // 텍스트 번역 요청
  async translate(text: string, targetLang: string) {
    return api.post('/openai/streaming/', {
      lang: targetLang,
      message: text,
    })
  },
}

// 영수증 관련 API 함수
export const receiptApi = {
  // 영수증 이미지 업로드 및 분석
  async uploadAndAnalyze(file: File) {
    return api.uploadFile('/receipt/upload/', file)
  },

  // 영수증 목록 가져오기
  async getReceiptList() {
    return api.get('/receipt/list/')
  },

  // 영수증 상세 정보 가져오기
  async getReceiptDetail(id: string) {
    return api.get(`/receipt/${id}/`)
  },
}
