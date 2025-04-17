<template>
  <div class="font-sans">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center">
          <h1 class="text-2xl font-bold text-primary">SRAGA</h1>
        </div>
        <nav class="hidden md:flex space-x-6">
          <a href="#features" class="text-gray-700 hover:text-primary transition-colors">기능</a>
          <a href="#how-it-works" class="text-gray-700 hover:text-primary transition-colors"
            >사용방법</a
          >
          <a href="#download" class="text-gray-700 hover:text-primary transition-colors"
            >다운로드</a
          >
        </nav>
        <div class="flex space-x-4">
          <button
            @click="navigateToLogin"
            class="px-4 py-2 text-primary hover:bg-gray-100 rounded-md transition-colors"
          >
            로그인
          </button>
          <button
            @click="navigateToSignup"
            class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            회원가입
          </button>
        </div>
        <button @click="toggleMobileMenu" class="md:hidden text-gray-700">
          <menu-icon v-if="!mobileMenuOpen" class="w-6 h-6" />
          <x-icon v-else class="w-6 h-6" />
        </button>
      </div>
      <!-- Mobile Menu -->
      <div v-if="mobileMenuOpen" class="md:hidden bg-white shadow-md">
        <div class="container mx-auto px-4 py-4 flex flex-col space-y-4">
          <a href="#features" class="text-gray-700 hover:text-primary transition-colors">기능</a>
          <a href="#how-it-works" class="text-gray-700 hover:text-primary transition-colors"
            >사용방법</a
          >
          <a href="#download" class="text-gray-700 hover:text-primary transition-colors"
            >다운로드</a
          >
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-primary-light to-primary-lighter py-20">
      <div class="container mx-auto px-4 flex flex-col md:flex-row items-center">
        <div class="md:w-1/2 mb-10 md:mb-0">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">더 넓은 세상을 향해</h2>
          <p class="text-xl text-gray-700 mb-8">
            SRAGA와 함께 언어의 장벽을 넘어 세계와 소통하세요. 정확하고 자연스러운 번역으로 당신의
            세계를 확장하세요.
          </p>
          <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              @click="navigateToSignup"
              class="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-lg font-medium"
            >
              무료로 시작하기
            </button>
            <button
              @click="scrollToFeatures"
              class="px-6 py-3 bg-white text-primary rounded-md hover:bg-gray-100 transition-colors text-lg font-medium"
            >
              더 알아보기
            </button>
          </div>
        </div>
        <div class="md:w-1/2 flex justify-center">
          <div class="relative w-64 h-[500px] md:w-80">
            <div
              class="absolute top-0 right-0 w-full h-full bg-white rounded-3xl shadow-xl transform rotate-3 z-0"
            ></div>
            <div
              class="absolute top-0 left-0 w-full h-full bg-white rounded-3xl shadow-xl transform -rotate-3 z-0"
            ></div>
            <div
              class="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div class="w-full h-12 bg-primary flex items-center px-4">
                <div class="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div class="p-4">
                <div class="w-full h-10 bg-gray-100 rounded-full mb-4 flex items-center px-4">
                  <search-icon class="w-4 h-4 text-gray-500 mr-2" />
                  <span class="text-gray-500 text-sm">번역하고 싶은 텍스트를 입력하세요</span>
                </div>
                <div class="w-full h-32 bg-gray-100 rounded-lg mb-4 p-3">
                  <p class="text-gray-800">안녕하세요, 오늘 날씨가 정말 좋네요.</p>
                </div>
                <div class="flex justify-center my-4">
                  <arrow-down-icon class="w-6 h-6 text-primary" />
                </div>
                <div class="w-full h-32 bg-gray-100 rounded-lg p-3">
                  <p class="text-gray-800">Hello, the weather is really nice today.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-16">SRAGA의 특별한 기능</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div class="flex flex-col items-center text-center">
            <div
              class="w-20 h-20 bg-primary-lighter rounded-full flex items-center justify-center mb-6"
            >
              <globe-icon class="w-10 h-10 text-primary" />
            </div>
            <h3 class="text-xl font-semibold mb-4">100+ 언어 지원</h3>
            <p class="text-gray-600">
              전 세계 100개 이상의 언어를 지원하여 어디서든 소통할 수 있습니다.
            </p>
          </div>
          <div class="flex flex-col items-center text-center">
            <div
              class="w-20 h-20 bg-primary-lighter rounded-full flex items-center justify-center mb-6"
            >
              <mic-icon class="w-10 h-10 text-primary" />
            </div>
            <h3 class="text-xl font-semibold mb-4">음성 인식 번역</h3>
            <p class="text-gray-600">
              말하기만 하면 실시간으로 번역해주는 음성 인식 기능을 제공합니다.
            </p>
          </div>
          <div class="flex flex-col items-center text-center">
            <div
              class="w-20 h-20 bg-primary-lighter rounded-full flex items-center justify-center mb-6"
            >
              <camera-icon class="w-10 h-10 text-primary" />
            </div>
            <h3 class="text-xl font-semibold mb-4">이미지 번역</h3>
            <p class="text-gray-600">
              카메라로 텍스트를 찍기만 하면 즉시 번역해주는 이미지 인식 기능을 제공합니다.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section id="how-it-works" class="py-20 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-16">사용 방법</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="flex flex-col items-center text-center">
            <div
              class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6 text-white font-bold text-2xl"
            >
              1
            </div>
            <h3 class="text-xl font-semibold mb-4">앱 다운로드</h3>
            <p class="text-gray-600">App Store 또는 Google Play에서 SRAGA 앱을 다운로드하세요.</p>
          </div>
          <div class="flex flex-col items-center text-center">
            <div
              class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6 text-white font-bold text-2xl"
            >
              2
            </div>
            <h3 class="text-xl font-semibold mb-4">계정 생성</h3>
            <p class="text-gray-600">간단한 회원가입 절차를 통해 계정을 만드세요.</p>
          </div>
          <div class="flex flex-col items-center text-center">
            <div
              class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6 text-white font-bold text-2xl"
            >
              3
            </div>
            <h3 class="text-xl font-semibold mb-4">언어 선택</h3>
            <p class="text-gray-600">번역하고자 하는 언어를 선택하세요.</p>
          </div>
          <div class="flex flex-col items-center text-center">
            <div
              class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6 text-white font-bold text-2xl"
            >
              4
            </div>
            <h3 class="text-xl font-semibold mb-4">번역 시작</h3>
            <p class="text-gray-600">
              텍스트 입력, 음성 녹음 또는 이미지 촬영으로 번역을 시작하세요.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Download Section -->
    <section id="download" class="py-20 bg-primary">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold text-white mb-8">지금 바로 SRAGA를 경험해보세요</h2>
        <p class="text-xl text-white opacity-90 mb-10 max-w-2xl mx-auto">
          더 넓은 세상과의 소통을 시작하세요. SRAGA와 함께라면 언어는 더 이상 장벽이 아닙니다.
        </p>
        <div class="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            class="flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
          >
            <apple-icon class="w-6 h-6 mr-2" />
            <span>App Store</span>
          </button>
          <button
            class="flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
          >
            <smartphone-icon class="w-6 h-6 mr-2" />
            <span>Google Play</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-12">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-xl font-bold mb-4">SRAGA</h3>
            <p class="text-gray-400">더 넓은 세상을 향해</p>
          </div>
          <div>
            <h4 class="text-lg font-semibold mb-4">회사</h4>
            <ul class="space-y-2">
              <li><a href="#" class="text-gray-400 hover:text-white transition-colors">소개</a></li>
              <li><a href="#" class="text-gray-400 hover:text-white transition-colors">팀</a></li>
              <li><a href="#" class="text-gray-400 hover:text-white transition-colors">채용</a></li>
              <li>
                <a href="#" class="text-gray-400 hover:text-white transition-colors">블로그</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 class="text-lg font-semibold mb-4">지원</h4>
            <ul class="space-y-2">
              <li>
                <a href="#" class="text-gray-400 hover:text-white transition-colors">도움말</a>
              </li>
              <li><a href="#" class="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
              <li>
                <a href="#" class="text-gray-400 hover:text-white transition-colors">문의하기</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 class="text-lg font-semibold mb-4">법적 정보</h4>
            <ul class="space-y-2">
              <li>
                <a href="#" class="text-gray-400 hover:text-white transition-colors">이용약관</a>
              </li>
              <li>
                <a href="#" class="text-gray-400 hover:text-white transition-colors"
                  >개인정보처리방침</a
                >
              </li>
            </ul>
          </div>
        </div>
        <div
          class="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p class="text-gray-400">© 2025 SRAGA. All rights reserved.</p>
          <div class="flex space-x-4 mt-4 md:mt-0">
            <a href="#" class="text-gray-400 hover:text-white transition-colors">
              <facebook-icon class="w-6 h-6" />
            </a>
            <a href="#" class="text-gray-400 hover:text-white transition-colors">
              <twitter-icon class="w-6 h-6" />
            </a>
            <a href="#" class="text-gray-400 hover:text-white transition-colors">
              <instagram-icon class="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  Menu as MenuIcon,
  X as XIcon,
  Globe as GlobeIcon,
  Mic as MicIcon,
  Camera as CameraIcon,
  Search as SearchIcon,
  ArrowDown as ArrowDownIcon,
  Apple as AppleIcon,
  Smartphone as SmartphoneIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
} from 'lucide-vue-next'

// State
const mobileMenuOpen = ref(false)

// Methods
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const navigateToLogin = () => {
  // In a real app, this would navigate to the login page
  alert('로그인 페이지로 이동합니다.')
}

const navigateToSignup = () => {
  // In a real app, this would navigate to the signup page
  alert('회원가입 페이지로 이동합니다.')
}

const scrollToFeatures = () => {
  const featuresSection = document.getElementById('features')
  if (featuresSection) {
    featuresSection.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style>
:root {
  --color-primary: #4285f4; /* Google Blue */
  --color-primary-dark: #3367d6;
  --color-primary-light: #e8f0fe;
  --color-primary-lighter: #f3f8ff;
}

.bg-primary {
  background-color: var(--color-primary);
}

.bg-primary-dark {
  background-color: var(--color-primary-dark);
}

.bg-primary-light {
  background-color: var(--color-primary-light);
}

.bg-primary-lighter {
  background-color: var(--color-primary-lighter);
}

.text-primary {
  color: var(--color-primary);
}

.hover\:bg-primary-dark:hover {
  background-color: var(--color-primary-dark);
}

.hover\:text-primary:hover {
  color: var(--color-primary);
}
</style>
