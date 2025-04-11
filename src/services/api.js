// API 기본 URL 가져오기
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// API 요청 함수
export const api = {
    // GET 요청
    async get(endpoint) {
        const response = await fetch(`${apiBaseUrl}${endpoint}`);
        if (!response.ok) {
            throw new Error(`API 오류: ${response.status}`);
        }
        return response.json();
    },
    // POST 요청
    async post(endpoint, data) {
        const response = await fetch(`${apiBaseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`API 오류: ${response.status}`);
        }
        return response.json();
    },
    // WebSocket 연결 생성
    createWebSocket(endpoint) {
        return new WebSocket(`${apiBaseUrl.replace('http', 'ws')}${endpoint}`);
    }
};
// 번역 관련 API 함수
export const translationApi = {
    // 텍스트 번역 요청
    async translate(text, targetLang) {
        return api.post('/openai/streaming/', {
            lang: targetLang,
            message: text,
        });
    }
};
