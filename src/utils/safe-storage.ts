// Утилиты для безопасной работы с localStorage
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(key, value)
    } catch {
      console.warn(`Failed to save to localStorage: ${key}`)
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(key)
    } catch {
      console.warn(`Failed to remove from localStorage: ${key}`)
    }
  },
}

// Утилиты для работы с ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15)
}

export const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Валидация данных
export const validateRoomData = (data: any): string[] => {
  const errors: string[] = []

  if (data.roomName && (typeof data.roomName !== "string" || data.roomName.length > 50 || data.roomName.length < 1)) {
    errors.push("Название комнаты должно быть от 1 до 50 символов")
  }

  if (
    data.playerName &&
    (typeof data.playerName !== "string" || data.playerName.length > 30 || data.playerName.length < 1)
  ) {
    errors.push("Имя игрока должно быть от 1 до 30 символов")
  }

  if (data.maxPlayers && (typeof data.maxPlayers !== "number" || data.maxPlayers < 4 || data.maxPlayers > 10)) {
    errors.push("Количество игроков должно быть от 4 до 10")
  }

  if (data.password && (typeof data.password !== "string" || data.password.length > 50)) {
    errors.push("Пароль не должен превышать 50 символов")
  }

  return errors
}

// Утилиты для обработки ошибок
export const createErrorHandler = (context: string) => {
  return (error: any) => {
    console.error(`[${context}]`, error)
    return {
      success: false,
      error: error.message || "Произошла неизвестная ошибка",
    }
  }
}

// Утилита для безопасного fetch с таймаутом
export const safeFetch = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === "AbortError") {
      throw new Error("Превышено время ожидания запроса")
    }
    throw error
  }
}
