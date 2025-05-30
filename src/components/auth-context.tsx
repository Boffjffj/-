"use client"

import React from "react"
import { safeLocalStorage, generateId } from "../utils/safe-storage"

interface UserStats {
  gamesPlayed: number
  gamesWon: number
  winRate: number
  favoriteRole?: string
}

interface User {
  id: string
  email: string
  nickname: string
  avatar?: string
  createdAt: number
  stats: UserStats
  favoriteRole?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, nickname: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>
  updateStats: (stat: keyof UserStats, value: number) => Promise<boolean>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)

  // Проверяем сохраненную сессию при загрузке
  React.useEffect(() => {
    const savedUser = safeLocalStorage.getItem("mafia_user")
    const savedToken = safeLocalStorage.getItem("mafia_token")

    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser)

        // Убедимся, что у пользователя есть поле stats
        if (!userData.stats) {
          userData.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
          }
        }

        setUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Error parsing saved user data:", error)
        safeLocalStorage.removeItem("mafia_user")
        safeLocalStorage.removeItem("mafia_token")
      }
    }
  }, [])

  const register = async (email: string, nickname: string, password: string) => {
    try {
      // Валидация
      if (!email || !nickname || !password) {
        return { success: false, error: "Все поля обязательны" }
      }

      if (password.length < 6) {
        return { success: false, error: "Пароль должен содержать минимум 6 символов" }
      }

      if (nickname.length < 3) {
        return { success: false, error: "Никнейм должен содержать минимум 3 символа" }
      }

      // Проверяем email формат
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: "Неверный формат email" }
      }

      // Имитируем запрос к серверу
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Проверяем, не существует ли уже пользователь
      const existingUsers = safeLocalStorage.getItem("mafia_users")
      const users = existingUsers ? JSON.parse(existingUsers) : []

      const existingUser = users.find((u: any) => u.email === email || u.nickname === nickname)
      if (existingUser) {
        return { success: false, error: "Пользователь с таким email или никнеймом уже существует" }
      }

      // Создаем нового пользователя
      const newUser: User = {
        id: generateId(),
        email,
        nickname,
        createdAt: Date.now(),
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          winRate: 0,
        },
        favoriteRole: "Мирный",
      }

      // Сохраняем пользователя в "базе данных"
      users.push({ ...newUser, password })
      safeLocalStorage.setItem("mafia_users", JSON.stringify(users))

      // Создаем токен
      const token = generateId()
      safeLocalStorage.setItem("mafia_user", JSON.stringify(newUser))
      safeLocalStorage.setItem("mafia_token", token)

      setUser(newUser)
      setIsAuthenticated(true)

      return { success: true }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: "Ошибка регистрации" }
    }
  }

  const login = async (email: string, password: string) => {
    try {
      // Валидация
      if (!email || !password) {
        return { success: false, error: "Все поля обязательны" }
      }

      // Имитируем запрос к серверу
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Проверяем пользователя
      const existingUsers = safeLocalStorage.getItem("mafia_users")
      const users = existingUsers ? JSON.parse(existingUsers) : []

      const foundUser = users.find((u: any) => u.email === email && u.password === password)
      if (!foundUser) {
        return { success: false, error: "Неверный email или пароль" }
      }

      // Создаем токен
      const token = generateId()

      // Убедимся, что у пользователя есть поле stats
      if (!foundUser.stats) {
        foundUser.stats = {
          gamesPlayed: 0,
          gamesWon: 0,
          winRate: 0,
        }
      }

      // Не сохраняем пароль в локальном состоянии
      const userData: User = {
        id: foundUser.id,
        email: foundUser.email,
        nickname: foundUser.nickname,
        createdAt: foundUser.createdAt,
        stats: foundUser.stats,
        favoriteRole: foundUser.favoriteRole || "Мирный",
      }

      safeLocalStorage.setItem("mafia_user", JSON.stringify(userData))
      safeLocalStorage.setItem("mafia_token", token)

      setUser(userData)
      setIsAuthenticated(true)

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Ошибка входа" }
    }
  }

  const logout = () => {
    safeLocalStorage.removeItem("mafia_user")
    safeLocalStorage.removeItem("mafia_token")
    safeLocalStorage.removeItem("mafia_room_id")
    safeLocalStorage.removeItem("mafia_player_id")
    safeLocalStorage.removeItem("mafia_is_host")
    safeLocalStorage.removeItem("mafia_player_name")

    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) {
        return { success: false, error: "Пользователь не авторизован" }
      }

      // Валидация
      if (updates.nickname && updates.nickname.length < 3) {
        return { success: false, error: "Никнейм должен содержать минимум 3 символа" }
      }

      if (updates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(updates.email)) {
          return { success: false, error: "Неверный формат email" }
        }
      }

      // Имитируем запрос к серверу
      await new Promise((resolve) => setTimeout(resolve, 500))

      const updatedUser = { ...user, ...updates }

      // Обновляем в списке пользователей
      const existingUsers = safeLocalStorage.getItem("mafia_users")
      const users = existingUsers ? JSON.parse(existingUsers) : []
      const userIndex = users.findIndex((u: any) => u.id === user.id)

      if (userIndex !== -1) {
        // Сохраняем пароль
        const password = users[userIndex].password
        users[userIndex] = { ...updatedUser, password }
        safeLocalStorage.setItem("mafia_users", JSON.stringify(users))
      }

      safeLocalStorage.setItem("mafia_user", JSON.stringify(updatedUser))
      setUser(updatedUser)

      return { success: true }
    } catch (error) {
      console.error("Update profile error:", error)
      return { success: false, error: "Ошибка обновления профиля" }
    }
  }

  const updateStats = async (stat: keyof UserStats, value: number): Promise<boolean> => {
    try {
      if (!user) return false

      // Обновляем статистику пользователя
      const updatedStats = { ...user.stats }
      updatedStats[stat] = (updatedStats[stat] || 0) + value

      // Пересчитываем процент побед
      if (updatedStats.gamesPlayed > 0) {
        updatedStats.winRate = (updatedStats.gamesWon / updatedStats.gamesPlayed) * 100
      }

      const updatedUser = { ...user, stats: updatedStats }

      // Обновляем в списке пользователей
      const existingUsers = safeLocalStorage.getItem("mafia_users")
      const users = existingUsers ? JSON.parse(existingUsers) : []
      const userIndex = users.findIndex((u: any) => u.id === user.id)

      if (userIndex !== -1) {
        // Сохраняем пароль
        const password = users[userIndex].password
        users[userIndex] = { ...updatedUser, password }
        safeLocalStorage.setItem("mafia_users", JSON.stringify(users))
      }

      safeLocalStorage.setItem("mafia_user", JSON.stringify(updatedUser))
      setUser(updatedUser)

      return true
    } catch (error) {
      console.error("Update stats error:", error)
      return false
    }
  }

  const value = React.useMemo(
    () => ({
      user,
      isAuthenticated,
      login,
      register,
      logout,
      updateProfile,
      updateStats,
    }),
    [user, isAuthenticated],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
