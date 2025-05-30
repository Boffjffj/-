"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "./auth-context"

interface ProfileScreenProps {
  onBack: () => void
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { user, logout, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = React.useState(false)
  const [nickname, setNickname] = React.useState(user?.nickname || "")
  const [email, setEmail] = React.useState(user?.email || "")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")

  const handleSave = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    const result = await updateProfile({ nickname, email })

    if (result.success) {
      setSuccess("Профиль успешно обновлен!")
      setIsEditing(false)
    } else {
      setError(result.error || "Ошибка обновления профиля")
    }

    setIsLoading(false)
  }

  const handleLogout = () => {
    logout()
  }

  const getRoleStats = () => {
    if (!user) return []

    // В реальном приложении эти данные приходили бы с сервера
    return [
      {
        role: "Мирный житель",
        games: Math.floor(user.stats.gamesPlayed * 0.4),
        wins: Math.floor(user.stats.gamesWon * 0.3),
      },
      { role: "Мафия", games: Math.floor(user.stats.gamesPlayed * 0.3), wins: Math.floor(user.stats.gamesWon * 0.4) },
      { role: "Шериф", games: Math.floor(user.stats.gamesPlayed * 0.15), wins: Math.floor(user.stats.gamesWon * 0.2) },
      { role: "Доктор", games: Math.floor(user.stats.gamesPlayed * 0.1), wins: Math.floor(user.stats.gamesWon * 0.1) },
      {
        role: "Любовница",
        games: Math.floor(user.stats.gamesPlayed * 0.05),
        wins: Math.floor(user.stats.gamesWon * 0.05),
      },
    ]
  }

  if (!user) return null

  const winRate = user.stats?.winRate || 0
  const roleStats = getRoleStats()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black py-8">
      <Card className="w-full max-w-2xl p-6 bg-black/50 backdrop-blur-sm border border-gray-800">
        <CardHeader className="text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">{user.nickname.charAt(0).toUpperCase()}</span>
          </div>
          <CardTitle className="text-3xl font-bold text-white">Профиль игрока</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Основная информация</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Никнейм</label>
                {isEditing ? (
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-gray-900/50 text-white border-gray-700"
                  />
                ) : (
                  <p className="text-gray-300 bg-gray-900/30 p-2 rounded border border-gray-700">{user.nickname}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">Email</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-900/50 text-white border-gray-700"
                  />
                ) : (
                  <p className="text-gray-300 bg-gray-900/30 p-2 rounded border border-gray-700">{user.email}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Сохранить
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setNickname(user.nickname)
                      setEmail(user.email)
                      setError("")
                      setSuccess("")
                    }}
                    className="border-gray-600 text-gray-300"
                  >
                    Отмена
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Редактировать
                </Button>
              )}
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Статистика */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Статистика</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-900/30 rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-blue-400">{user.stats?.gamesPlayed || 0}</div>
                <div className="text-sm text-gray-400">Игр сыграно</div>
              </div>

              <div className="text-center p-4 bg-gray-900/30 rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-green-400">{user.stats?.gamesWon || 0}</div>
                <div className="text-sm text-gray-400">Побед</div>
              </div>

              <div className="text-center p-4 bg-gray-900/30 rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-yellow-400">{winRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Процент побед</div>
              </div>

              <div className="text-center p-4 bg-gray-900/30 rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-purple-400">{user.favoriteRole || "Мирный"}</div>
                <div className="text-sm text-gray-400">Любимая роль</div>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Статистика по ролям */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Статистика по ролям</h3>

            <div className="space-y-3">
              {roleStats.map((stat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-700"
                >
                  <span className="text-white font-medium">{stat.role}</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">
                      {stat.games} игр, {stat.wins} побед
                    </div>
                    <div className="text-xs text-gray-400">
                      {stat.games > 0 ? Math.round((stat.wins / stat.games) * 100) : 0}% побед
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Дополнительная информация */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Дополнительно</h3>

            <div className="text-sm text-gray-300 space-y-2">
              <p>Дата регистрации: {new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
              <p>Статус: Активный игрок</p>
              <p>ID: {user.id}</p>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Кнопки действий */}
          <div className="flex gap-4">
            <Button variant="ghost" onClick={onBack} className="flex-1 text-gray-300 hover:text-white">
              Назад в меню
            </Button>

            <Button variant="destructive" onClick={handleLogout} className="flex-1">
              Выйти из аккаунта
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
