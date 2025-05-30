"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "./auth-context"

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth()
  const [activeTab, setActiveTab] = React.useState("login")
  const [loginData, setLoginData] = React.useState({ email: "", password: "" })
  const [registerData, setRegisterData] = React.useState({ email: "", nickname: "", password: "", confirmPassword: "" })
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await login(loginData.email, loginData.password)
      if (!result.success) {
        setError(result.error || "Ошибка входа")
      }
    } catch (error) {
      setError("Произошла ошибка при входе")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Валидация
    if (!registerData.email || !registerData.nickname || !registerData.password) {
      setError("Все поля обязательны")
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError("Пароли не совпадают")
      return
    }

    if (registerData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов")
      return
    }

    if (registerData.nickname.length < 3) {
      setError("Никнейм должен содержать минимум 3 символа")
      return
    }

    setIsLoading(true)

    try {
      const result = await register(registerData.email, registerData.nickname, registerData.password)
      if (!result.success) {
        setError(result.error || "Ошибка регистрации")
      }
    } catch (error) {
      setError("Произошла ошибка при регистрации")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black py-8">
      <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm border border-gray-800">
        <CardHeader className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">М</span>
          </div>
          <CardTitle className="text-3xl font-bold text-white">Мафия</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Email</label>
                  <Input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="Введите email"
                    className="bg-gray-900/50 text-white border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Пароль</label>
                  <Input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Введите пароль"
                    className="bg-gray-900/50 text-white border-gray-700"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
                >
                  {isLoading ? "Вход..." : "Войти"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Email</label>
                  <Input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="Введите email"
                    className="bg-gray-900/50 text-white border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Никнейм</label>
                  <Input
                    value={registerData.nickname}
                    onChange={(e) => setRegisterData({ ...registerData, nickname: e.target.value })}
                    placeholder="Введите никнейм"
                    className="bg-gray-900/50 text-white border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Пароль</label>
                  <Input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Введите пароль"
                    className="bg-gray-900/50 text-white border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Подтверждение пароля</label>
                  <Input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    placeholder="Повторите пароль"
                    className="bg-gray-900/50 text-white border-gray-700"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
                >
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
