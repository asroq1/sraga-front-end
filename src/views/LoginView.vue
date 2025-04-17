<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { checkAndRegisterUser } from '../services/userService'

const router = useRouter()
const userName = ref('')
const isRegistering = ref(false)
const error = ref('')

async function handleRegister() {
  if (!userName.value.trim()) {
    error.value = '이름을 입력해주세요.'
    return
  }

  try {
    isRegistering.value = true
    error.value = ''

    // 사용자 등록 또는 조회
    await checkAndRegisterUser(userName.value.trim())

    // 배포 환경에서는 window.location.href를 사용하여 직접 페이지 이동
    window.location.href = '/script-list'
  } catch (err) {
    error.value = '등록 중 오류가 발생했습니다. 다시 시도해주세요.'
    console.error('등록 오류:', err)
  } finally {
    isRegistering.value = false
  }
}
</script>

<template>
  <div class="login-view">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">SRAGA</div>
        <h1 class="title">로그인</h1>
        <p class="subtitle">SRAGA를 사용하기 위해 이름을 입력해주세요.</p>
      </div>

      <div class="form-field">
        <label for="user-name">이름</label>
        <div class="input-container" :class="{ focused: userName }">
          <input
            id="user-name"
            v-model="userName"
            type="text"
            placeholder="이름을 입력하세요"
            :disabled="isRegistering"
            @keyup.enter="handleRegister"
          />
          <div class="input-line"></div>
        </div>
        <p v-if="error" class="error-message">
          <span class="error-icon">error</span>
          {{ error }}
        </p>
      </div>

      <button
        class="btn-primary"
        @click="handleRegister"
        :disabled="isRegistering"
        :class="{ loading: isRegistering }"
      >
        <span v-if="isRegistering" class="spinner"></span>
        <span v-if="isRegistering">처리 중...</span>
        <span v-else>시작하기</span>
      </button>

      <div class="login-footer">
        <p>© 2025 SRAGA. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

.login-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
  font-family: 'Roboto', sans-serif;
}

.login-card {
  background-color: white;
  border-radius: 8px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.login-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.login-header {
  padding: 24px 24px 0;
  text-align: center;
}

.logo {
  font-size: 24px;
  font-weight: 500;
  color: #4285f4; /* Google Blue */
  margin-bottom: 24px;
}

.title {
  font-size: 24px;
  font-weight: 500;
  color: #202124;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: #5f6368;
  margin: 0 0 24px;
}

.form-field {
  padding: 0 24px;
  margin-bottom: 24px;
}

.form-field label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #5f6368;
  margin-bottom: 8px;
}

.input-container {
  position: relative;
  margin-bottom: 8px;
}

.input-container input {
  width: 100%;
  padding: 12px 0 8px;
  border: none;
  border-bottom: 1px solid #dadce0;
  font-size: 16px;
  background: transparent;
  transition: border-color 0.2s;
}

.input-container input:focus {
  outline: none;
}

.input-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: #4285f4;
  transition: width 0.3s ease;
}

.input-container input:focus ~ .input-line,
.input-container.focused .input-line {
  width: 100%;
}

.error-message {
  display: flex;
  align-items: center;
  color: #d93025;
  font-size: 12px;
  margin: 8px 0 0;
}

.error-icon {
  font-family: 'Material Icons';
  font-size: 16px;
  margin-right: 4px;
}

.btn-primary {
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(100% - 48px);
  margin: 0 24px 24px;
  padding: 12px 0;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  background-color: #3367d6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.btn-primary:active {
  background-color: #2a56c6;
}

.btn-primary:disabled {
  background-color: rgba(0, 0, 0, 0.12);
  color: rgba(0, 0, 0, 0.38);
  cursor: not-allowed;
  box-shadow: none;
}

.btn-primary.loading {
  background-color: #4285f4;
  color: transparent;
}

.spinner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-footer {
  padding: 16px 24px;
  text-align: center;
  border-top: 1px solid #f1f3f4;
}

.login-footer p {
  font-size: 12px;
  color: #5f6368;
  margin: 0;
}

@media (max-width: 480px) {
  .login-card {
    box-shadow: none;
    border-radius: 0;
  }

  .btn-primary {
    width: calc(100% - 32px);
    margin: 0 16px 16px;
  }

  .form-field {
    padding: 0 16px;
  }

  .login-header {
    padding: 16px 16px 0;
  }
}
</style>
