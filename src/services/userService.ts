import { ref } from 'vue'

// API 기본 URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// 사용자 인터페이스 정의
export interface User {
  id: number
  name: string
}

// 현재 사용자 상태
export const currentUser = ref<User | null>(null)

// 로컬 스토리지 키
const USER_ID_KEY = 'userId'
const USER_NAME_KEY = 'sraga_name'

/**
 * 로컬 스토리지에서 사용자 정보 로드
 */
export function loadUserFromStorage(): User | null {
  const id = localStorage.getItem(USER_ID_KEY)
  const name = localStorage.getItem(USER_NAME_KEY)

  if (id && name) {
    return {
      id: parseInt(id),
      name,
    }
  }

  return null
}

/**
 * 사용자 정보를 로컬 스토리지에 저장
 */
export function saveUserToStorage(user: User): void {
  localStorage.setItem(USER_ID_KEY, user.id.toString())
  localStorage.setItem(USER_NAME_KEY, user.name)
  currentUser.value = user
}

/**
 * 새 사용자 등록
 */
export async function registerUser(name: string): Promise<User> {
  try {
    const response = await fetch(`${apiBaseUrl}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }

    const user = await response.json()
    saveUserToStorage(user)
    return user
  } catch (error) {
    console.error('사용자 등록 오류:', error)
    throw error
  }
}

/**
 * 사용자 정보 확인 및 필요시 등록
 */
export async function checkAndRegisterUser(): Promise<User> {
  // 로컬 스토리지에서 사용자 정보 확인
  const storedUser = loadUserFromStorage()

  if (storedUser) {
    currentUser.value = storedUser
    return storedUser
  }

  // 사용자 정보가 없으면 등록 필요
  throw new Error('User registration required')
}
