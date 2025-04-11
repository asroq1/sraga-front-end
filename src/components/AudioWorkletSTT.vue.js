import { ref, onMounted, onBeforeUnmount } from 'vue';
// 지원되는 언어 목록 (BCP-47 형식)
const languages = [
    { code: 'ko-KR', name: '한국어' },
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
];
// 선택된 언어 (기본값: 한국어)
const selectedLanguage = ref('ko-KR');
// 번역 대상 언어 (기본값: 영어)
const translatedLanguage = ref('en-US');
// 기존 상태 변수들
const isRecording = ref(false);
const socketReady = ref(false);
const finalText = ref('');
const interimText = ref('');
const logs = ref('');
const logContainer = ref(null);
const messagesContainer = ref(null);
const translatedText = ref('');
// AudioContext 관련 변수들
let socket = null;
let audioContext = null;
let audioStream = null;
let workletNode = null;
// 로그 메시지 추가 함수
function logMessage(message) {
    logs.value += `\n${message}`;
    // 로그 스크롤을 아래로 유지
    setTimeout(() => {
        if (logContainer.value) {
            ;
            logContainer.value.scrollTop = logContainer.value.scrollHeight;
        }
    }, 0);
}
// 로그 지우기 함수
function clearLogs() {
    logs.value = '';
}
// 중간 결과 업데이트 함수
function updateInterimText(text) {
    interimText.value = text;
    scrollToBottom();
}
// 최종 결과 추가 함수
function addFinalText(text) {
    if (text && text.trim() !== '') {
        // 이전 텍스트가 있고, 공백으로 끝나지 않으면 공백 추가
        if (finalText.value && !finalText.value.endsWith(' ')) {
            finalText.value += ' ';
        }
        finalText.value += text;
        scrollToBottom();
    }
    // 중간 결과 초기화
    clearInterimText();
}
// 메시지 컨테이너 스크롤 함수
function scrollToBottom() {
    setTimeout(() => {
        if (messagesContainer.value) {
            ;
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
    }, 0);
}
// OpenAI API로 데이터 전송 함수
async function sendToOpenAI() {
    try {
        logMessage(`🔄 OpenAI API로 데이터 전송 중...`);
        // 번역 중임을 표시
        translatedText.value = '번역 중...';
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        // 서버 전송 이벤트(SSE)를 처리하기 위해 fetch 직접 사용
        const response = await fetch(`${apiBaseUrl}/openai/streaming/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: translatedLanguage.value,
                message: finalText.value,
            }),
        });
        if (!response.ok) {
            throw new Error(`API 오류: ${response.status}`);
        }
        // 응답을 텍스트 스트림으로 처리
        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        // 번역 텍스트 초기화
        translatedText.value = '';
        if (reader) {
            // 스트림 읽기 함수
            const processStream = async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            logMessage('✅ 번역 완료');
                            break;
                        }
                        // 청크 디코딩
                        const chunk = decoder.decode(value, { stream: true });
                        // 'data:' 접두사로 시작하는 라인 처리
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data:')) {
                                const content = line.substring(5).trim();
                                // [DONE] 메시지는 무시
                                if (content === '[DONE]')
                                    continue;
                                // 번역 텍스트에 추가
                                if (content) {
                                    if (translatedText.value === '번역 중...') {
                                        translatedText.value = content;
                                    }
                                    else {
                                        translatedText.value += ' ' + content;
                                    }
                                    scrollToBottom();
                                }
                            }
                        }
                    }
                }
                catch (error) {
                    logMessage(`❌ 스트림 처리 오류: ${error.message}`);
                }
            };
            // 스트림 처리 시작
            processStream();
        }
    }
    catch (error) {
        logMessage(`❌ OpenAI API 오류: ${error.message}`);
        console.error('OpenAI API 오류:', error);
        translatedText.value = '번역 중 오류가 발생했습니다.';
    }
}
// 중간 결과 초기화 함수
function clearInterimText() {
    interimText.value = '';
}
// WebSocket 초기화
function initializeWebSocket() {
    // 환경 변수에서 API 기본 URL 가져오기
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    socket = new WebSocket(`${apiBaseUrl.replace('http', 'ws')}/stt/websocket/`);
    socket.binaryType = 'arraybuffer';
    socket.onopen = () => {
        socketReady.value = true;
        logMessage('🟢 WebSocket 연결됨.');
    };
    // 나머지 WebSocket 관련 코드는 그대로 유지
    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            logMessage(`📥 수신: ${JSON.stringify(data)}`);
            switch (data.type) {
                case 'interim':
                    // 중간 결과 - 회색으로 표시
                    updateInterimText(data.text);
                    break;
                case 'final':
                    // 최종 결과 - 기존 텍스트에 검은색으로 추가
                    addFinalText(data.text);
                    // 최종 결과를 OpenAI API로 전송
                    sendToOpenAI();
                    break;
                case 'system':
                    // 시스템 메시지
                    logMessage(`🔧 ${data.message}`);
                    break;
                case 'error':
                    // 오류 메시지
                    logMessage(`❌ ${data.message}`);
                    break;
                case 'end':
                    // 종료 메시지
                    logMessage(`✅ 음성 인식 종료`);
                    clearInterimText();
                    break;
            }
        }
        catch (error) {
            logMessage(`❌ 메시지 파싱 오류: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
    socket.onerror = (error) => {
        logMessage(`❌ WebSocket 오류: ${error instanceof Error ? error.message : String(error)}`);
    };
    socket.onclose = (event) => {
        socketReady.value = false;
        logMessage(`✅ WebSocket 종료됨 (코드: ${event.code})`);
    };
}
// 녹음 시작 함수
async function startRecording() {
    if (!socketReady.value) {
        logMessage('❌ WebSocket 연결이 안 됨!');
        return;
    }
    // 녹음 시작 시 이전 결과 초기화
    finalText.value = '';
    translatedText.value = '';
    try {
        audioContext = new AudioContext({ sampleRate: 16000 });
        // AudioWorklet 프로세서 모듈 추가 (public 폴더에 위치)
        await audioContext.audioWorklet.addModule('/recorder-processor.js');
        audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        const source = audioContext.createMediaStreamSource(audioStream);
        workletNode = new AudioWorkletNode(audioContext, 'recorder-processor');
        source.connect(workletNode);
        workletNode.connect(audioContext.destination);
        workletNode.port.onmessage = (e) => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(e.data);
                // 로그로 데이터 전송은 UI 업데이트가 많아 주석 처리
                // logMessage(`📤 청크 전송 (${e.data.byteLength} bytes)`);
            }
        };
        // socket이 null이 아닌지 확인 후 메시지 전송
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'start', lang: selectedLanguage.value }));
            logMessage(`📤 'start' 메시지 전송 완료 (언어: ${selectedLanguage.value}, 번역 언어: ${translatedLanguage.value})`);
        }
        else {
            throw new Error('WebSocket 연결이 활성화되지 않았습니다.');
        }
        isRecording.value = true;
        logMessage('🎙️ 녹음 시작됨...');
    }
    catch (err) {
        // err를 unknown 타입으로 명시적 지정 후 타입 가드 사용
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
        logMessage(`❌ 오류 발생: ${errorMessage}`);
        console.error('전체 오류:', err);
    }
}
// 나머지 함수들은 그대로 유지
function stopRecording() {
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        audioStream = null;
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'end' }));
        logMessage("📤 'end' 메시지 전송 완료");
        // 녹음 중지 시 최종 텍스트가 있으면 OpenAI API로 전송
        if (finalText.value.trim()) {
            logMessage(`📤 최종 텍스트를 OpenAI API로 전송합니다. (${selectedLanguage.value} → ${translatedLanguage.value})`);
            sendToOpenAI();
        }
    }
    isRecording.value = false;
    logMessage('⏹️ 녹음 중지 완료.');
    // 중간 결과 초기화
    clearInterimText();
}
// 컴포넌트 마운트 시 WebSocket 초기화
onMounted(() => {
    initializeWebSocket();
});
// 컴포넌트 언마운트 시 리소스 정리
onBeforeUnmount(() => {
    stopRecording();
    if (socket) {
        socket.close();
        socket = null;
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-text']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['message-content']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['assistant']} */ ;
/** @type {__VLS_StyleScopedClasses['message-content']} */ ;
/** @type {__VLS_StyleScopedClasses['language-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "audio-worklet-stt" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "controls" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "language-selector" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "language-select",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    id: "language-select",
    value: (__VLS_ctx.selectedLanguage),
    ...{ class: "select-input" },
});
for (const [lang] of __VLS_getVForSourceType((__VLS_ctx.languages))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (lang.code),
        value: (lang.code),
    });
    (lang.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "language-selector" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "translated-language-select",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    id: "translated-language-select",
    value: (__VLS_ctx.translatedLanguage),
    ...{ class: "select-input" },
});
for (const [lang] of __VLS_getVForSourceType((__VLS_ctx.languages))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (lang.code),
        value: (lang.code),
    });
    (lang.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.startRecording) },
    ...{ class: "btn-primary" },
    disabled: (__VLS_ctx.isRecording),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "material-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.stopRecording) },
    ...{ class: "btn-secondary" },
    disabled: (!__VLS_ctx.isRecording),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "material-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "messages" },
    ref: "messagesContainer",
});
/** @type {typeof __VLS_ctx.messagesContainer} */ ;
if (__VLS_ctx.finalText) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "message user" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "message-content" },
    });
    (__VLS_ctx.finalText);
}
if (__VLS_ctx.interimText) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "message user interim" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "message-content" },
    });
    (__VLS_ctx.interimText);
}
if (__VLS_ctx.translatedText) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "message assistant" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "message-content" },
    });
    (__VLS_ctx.translatedText);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "log-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "log-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.clearLogs) },
    ...{ class: "btn-text" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
    ...{ class: "log-container" },
    ref: "logContainer",
});
/** @type {typeof __VLS_ctx.logContainer} */ ;
(__VLS_ctx.logs);
/** @type {__VLS_StyleScopedClasses['audio-worklet-stt']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['language-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['language-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['select-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['material-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['material-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-container']} */ ;
/** @type {__VLS_StyleScopedClasses['messages']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['user']} */ ;
/** @type {__VLS_StyleScopedClasses['message-content']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['user']} */ ;
/** @type {__VLS_StyleScopedClasses['interim']} */ ;
/** @type {__VLS_StyleScopedClasses['message-content']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['assistant']} */ ;
/** @type {__VLS_StyleScopedClasses['message-content']} */ ;
/** @type {__VLS_StyleScopedClasses['log-section']} */ ;
/** @type {__VLS_StyleScopedClasses['log-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-text']} */ ;
/** @type {__VLS_StyleScopedClasses['log-container']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            languages: languages,
            selectedLanguage: selectedLanguage,
            translatedLanguage: translatedLanguage,
            isRecording: isRecording,
            finalText: finalText,
            interimText: interimText,
            logs: logs,
            logContainer: logContainer,
            messagesContainer: messagesContainer,
            translatedText: translatedText,
            clearLogs: clearLogs,
            startRecording: startRecording,
            stopRecording: stopRecording,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
