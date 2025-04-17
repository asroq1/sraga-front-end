import { ref } from 'vue'

// API 기본 URL
const URI_API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const URI_USER_REGISTER = `${URI_API_BASE}/user/register`
const URI_USER_GET_BY_NAME = `${URI_API_BASE}/user`

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
    const response = await fetch(URI_USER_REGISTER, {
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
 * 사용자 정보 확인
 */
export async function getUserByName(name: string): Promise<User> {
  try {
    const response = await fetch(URI_USER_GET_BY_NAME + '/' + encodeURIComponent(name), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }

    const user: User = await response.json()
    saveUserToStorage(user)
    return user
  } catch (error) {
    console.error('사용자 조회 오류:', error)
    throw error
  }
}

/**
 * 사용자 정보 확인 및 필요시 등록
 */
export async function checkAndRegisterUser(name: string): Promise<User> {
  try {
    // 먼저 사용자 조회 시도
    try {
      const existingUser = await getUserByName(name)
      return existingUser
    } catch (error) {
      // 사용자가 없는 경우 새로 등록
      if (error instanceof Error && error.message.includes('404')) {
        console.log('사용자를 찾을 수 없어 새로 등록합니다.')
        const newUser = await registerUser(name)
        return newUser
      }
      // 다른 에러는 상위로 전파
      throw error
    }
  } catch (error) {
    console.error('사용자 확인/등록 중 오류:', error)
    throw new Error(
      `사용자 확인/등록 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    )
  }
}
