<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerUser } from '../services/userService'

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

    await registerUser(userName.value.trim())
    router.push('/main')
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
    <div class="login-container">
      <h2>환영합니다!</h2>
      <p>SRAGA를 사용하기 위해 이름을 입력해주세요.</p>

      <div class="form-group">
        <label for="user-name">이름</label>
        <input
          id="user-name"
          v-model="userName"
          type="text"
          placeholder="이름을 입력하세요"
          :disabled="isRegistering"
          @keyup.enter="handleRegister"
        />
      </div>

      <p v-if="error" class="error-message">{{ error }}</p>

      <button class="btn-primary" @click="handleRegister" :disabled="isRegistering">
        <span v-if="isRegistering">등록 중...</span>
        <span v-else>시작하기</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.login-container {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin: 20px 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 16px;
}

.error-message {
  color: #d93025;
  font-size: 14px;
  margin: 8px 0;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #357abd;
}

.btn-primary:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}
</style>
