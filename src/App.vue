<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = computed(() => {
  if (route.path === '/main') return 'main'
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
    <main class="main-content">
      <RouterView />
    </main>

    <!-- Only show navigation when user is authenticated -->
    <nav v-if="route.name !== 'login'" class="bottom-nav">
      <button
        class="nav-item"
        :class="{ active: activeTab === 'main' }"
        @click="navigateTo('/main')"
      >
        <span class="material-icon">home</span>
        <span class="nav-label">홈</span>
      </button>

      <button
        class="nav-item"
        :class="{ active: activeTab === 'receipt' }"
        @click="navigateTo('/receipt')"
      >
        <span class="material-icon">receipt</span>
        <span class="nav-label">영수증</span>
      </button>

      <button
        class="nav-item"
        :class="{ active: activeTab === 'meeting' }"
        @click="navigateTo('/meeting-summary')"
      >
        <span class="material-icon">summarize</span>
        <span class="nav-label">회의 요약</span>
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
  flex-direction: column;
  min-height: 100vh;
  max-width: 100%;
  overflow-x: hidden;
}

/* 메인 콘텐츠 영역 */
.main-content {
  flex: 1;
  padding: 0 0 70px 0; /* 하단 네비게이션 바 높이만큼 패딩 추가 */
  overflow-y: auto;
}

/* 하단 네비게이션 바 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 60px;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* 네비게이션 아이템 */
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  background: none;
  border: none;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s;
  padding: 8px 0;
}

.nav-item.active {
  color: #4a90e2;
}

.nav-item:hover {
  color: #4a90e2;
}

/* 아이콘 스타일 */
.material-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

/* 네비게이션 라벨 */
.nav-label {
  font-size: 12px;
  font-weight: 500;
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .main-content {
    padding: 0 0 60px 0;
  }

  .bottom-nav {
    height: 56px;
  }

  .material-icon {
    font-size: 22px;
  }

  .nav-label {
    font-size: 11px;
  }
}
</style>
