<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = computed(() => {
  if (route.path === '/') return 'home'
  if (route.path === '/script-list') return 'script'
  if (route.path === '/receipt') return 'receipt'
  if (route.path === '/meeting-summary') return 'meeting'
  return 'home'
})

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="app-container">
    <!-- 데스크탑용 사이드 네비게이션 -->
    <nav v-if="route.name !== 'login' && route.name !== 'landing'" class="side-nav">
      <div class="nav-brand">
        <span class="material-icon brand-icon">record_voice_over</span>
        <span class="brand-name">SRAGA</span>
      </div>

      <div class="nav-items">
        <button class="nav-item" :class="{ active: activeTab === 'home' }" @click="navigateTo('/')">
          <span class="material-icon">home</span>
          <span class="nav-label">홈</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'script' }"
          @click="navigateTo('/script-list')"
        >
          <span class="material-icon">article</span>
          <span class="nav-label">미팅 기록</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'receipt' }"
          @click="navigateTo('/receipt')"
        >
          <span class="material-icon">receipt</span>
          <span class="nav-label">영수증 정리</span>
        </button>
      </div>
    </nav>

    <main class="main-content">
      <RouterView />
    </main>

    <!-- 모바일용 하단 네비게이션 -->
    <nav v-if="route.name !== 'login' && route.name !== 'landing'" class="bottom-nav">
      <button class="nav-item" :class="{ active: activeTab === 'home' }" @click="navigateTo('/')">
        <span class="material-icon">home</span>
        <span class="nav-label">홈</span>
      </button>

      <button
        class="nav-item"
        :class="{ active: activeTab === 'script' }"
        @click="navigateTo('/script-list')"
      >
        <span class="material-icon">article</span>
        <span class="nav-label">미팅 기록</span>
      </button>

      <button
        class="nav-item"
        :class="{ active: activeTab === 'receipt' }"
        @click="navigateTo('/receipt')"
      >
        <span class="material-icon">receipt</span>
        <span class="nav-label">영수증</span>
      </button>
    </nav>
  </div>
</template>

<style>
/* 전역 스타일 */
body {
  margin: 0;
  padding: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
    'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
  color: #333;
}

/* 앱 컨테이너 스타일 */
.app-container {
  display: flex;
  min-height: 100vh;
  max-width: 100%;
  overflow-x: hidden;
}

/* 사이드 네비게이션 - 데스크탑 */
.side-nav {
  width: 240px;
  background-color: white;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 100;
}

.nav-brand {
  display: flex;
  align-items: center;
  padding: 0 24px 24px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.brand-icon {
  font-size: 28px;
  color: #1a73e8;
  margin-right: 12px;
}

.brand-name {
  font-size: 20px;
  font-weight: 600;
  color: #1a73e8;
  letter-spacing: 0.5px;
}

.nav-items {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.side-nav .nav-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  margin: 4px 12px;
  border-radius: 8px;
  background: none;
  border: none;
  color: #5f6368;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.side-nav .nav-item .material-icon {
  margin-right: 16px;
  font-size: 20px;
}

.side-nav .nav-item .nav-label {
  font-weight: 500;
}

.side-nav .nav-item:hover {
  background-color: #f1f3f4;
  color: #1a73e8;
}

.side-nav .nav-item.active {
  background-color: #e8f0fe;
  color: #1a73e8;
}

/* 메인 콘텐츠 영역 */
.main-content {
  flex: 1;
  /* padding: 24px; */
  overflow-y: auto;
}

/* 하단 네비게이션 바 - 모바일 */
.bottom-nav {
  display: none; /* 기본적으로 숨김 */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  justify-content: space-around;
  align-items: center;
  height: 60px;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* 네비게이션 아이템 - 모바일 */
.bottom-nav .nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  background: none;
  border: none;
  color: #5f6368;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s;
  padding: 8px 0;
}

.bottom-nav .nav-item.active {
  color: #1a73e8;
}

.bottom-nav .nav-item:hover {
  color: #1a73e8;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .side-nav {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }

  .side-nav {
    display: none; /* 모바일에서는 사이드 네비게이션 숨김 */
  }

  .bottom-nav {
    display: flex; /* 모바일에서만 하단 네비게이션 표시 */
  }
}
</style>
