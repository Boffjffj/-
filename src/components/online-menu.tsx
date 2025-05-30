"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { useGame } from "./game-context"
import { useAuth } from "./auth-context"
import { safeFetch, validateRoomData } from "../utils/safe-storage"

interface OnlineMenuProps {
  onBack: () => void
  onGameStart: () => void
}

export const OnlineMenu: React.FC<OnlineMenuProps> = ({ onBack, onGameStart }) => {
  const { user } = useAuth()
  const { createRoom, joinRoom, getRooms } = useGame()
  const [activeTab, setActiveTab] = React.useState<"join" | "create">("join")
  const [roomName, setRoomName] = React.useState("")
  const [roomCode, setRoomCode] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [maxPlayers, setMaxPlayers] = React.useState(8)
  const [minPlayers, setMinPlayers] = React.useState(4)
  const [isPrivate, setIsPrivate] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [rooms, setRooms] = React.useState<any[]>([])
  const [error, setError] = React.useState("")

  // Refs для предотвращения race conditions
  const mountedRef = React.useRef(true)
  const abortControllerRef = React.useRef<AbortController>()

  React.useEffect(() => {
    return () => {
      mountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  React.useEffect(() => {
    if (activeTab === "join") {
      loadRooms()
    }
  }, [activeTab])

  const loadRooms = async () => {
    if (!mountedRef.current) return

    setIsLoading(true)
    setError("")

    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      const response = await safeFetch("/api/rooms", {
        signal: abortControllerRef.current.signal,
      })

      if (!mountedRef.current) return

      const data = await response.json()
      console.log("Loaded rooms:", data.rooms)
      setRooms(data.rooms || [])
    } catch (error: any) {
      if (!mountedRef.current) return

      if (error.name !== "AbortError") {
        console.error("Ошибка загрузки комнат:", error)
        setError("Не удалось загрузить список комнат")
        setRooms([])
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const handleCreateRoom = async () => {
    if (!user) {
      setError("Необходимо авторизоваться")
      return
    }

    const roomData = {
      roomName: roomName.trim(),
      playerName: user.nickname,
      minPlayers,
      maxPlayers,
      isPrivate,
      password: isPrivate ? password : undefined,
    }

    // Валидация данных
    const validationErrors = validateRoomData(roomData)
    if (validationErrors.length > 0) {
      setError(validationErrors[0])
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await safeFetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...roomData,
        }),
      })

      if (!mountedRef.current) return

      const data = await response.json()
      console.log("Create room response:", data)

      if (data.success) {
        localStorage.setItem("mafia_player_id", data.playerId)
        localStorage.setItem("mafia_room_id", data.roomId)
        localStorage.setItem("mafia_is_host", String(data.isHost))
        localStorage.setItem("mafia_player_name", roomData.playerName)

        // Обновляем статистику игрока
        updatePlayerStats("gamesPlayed", 1)

        // Переходим к игре без перезагрузки страницы
        onGameStart()
      } else {
        setError(data.error || "Не удалось создать комнату")
      }
    } catch (error: any) {
      if (!mountedRef.current) return

      console.error("Ошибка создания комнаты:", error)
      setError(error.message || "Не удалось создать комнату. Проверьте соединение с сервером.")
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const handleJoinRoom = async (roomId?: string) => {
    if (!user) {
      setError("Необходимо авторизоваться")
      return
    }

    const targetRoomId = roomId || roomCode.trim()
    const joinData = {
      roomId: targetRoomId,
      playerName: user.nickname,
      password: password,
    }

    // Валидация данных
    const validationErrors = validateRoomData(joinData)
    if (validationErrors.length > 0) {
      setError(validationErrors[0])
      return
    }

    if (!targetRoomId) {
      setError("Введите код комнаты")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await safeFetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          ...joinData,
        }),
      })

      if (!mountedRef.current) return

      const data = await response.json()
      console.log("Join room response:", data)

      if (data.success) {
        localStorage.setItem("mafia_player_id", data.playerId)
        localStorage.setItem("mafia_room_id", data.roomId)
        localStorage.setItem("mafia_is_host", String(data.isHost))
        localStorage.setItem("mafia_player_name", joinData.playerName)

        // Обновляем статистику игрока
        updatePlayerStats("gamesPlayed", 1)

        onGameStart()
      } else {
        setError(data.error || "Не удалось присоединиться к комнате")
      }
    } catch (error: any) {
      if (!mountedRef.current) return

      console.error("Ошибка присоединения к комнате:", error)
      setError(error.message || "Не удалось присоединиться к комнате. Проверьте соединение с сервером.")
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  // Функция для обновления статистики игрока
  const updatePlayerStats = (stat: string, value: number) => {
    try {
      // Получаем текущих пользователей
      const usersJson = localStorage.getItem("mafia_users")
      if (!usersJson || !user) return

      const users = JSON.parse(usersJson)
      const userIndex = users.findIndex((u: any) => u.id === user.id)

      if (userIndex !== -1) {
        // Обновляем статистику
        if (!users[userIndex].stats) {
          users[userIndex].stats = { gamesPlayed: 0, gamesWon: 0, winRate: 0 }
        }

        users[userIndex].stats[stat] += value

        // Пересчитываем процент побед
        if (users[userIndex].stats.gamesPlayed > 0) {
          users[userIndex].stats.winRate = (users[userIndex].stats.gamesWon / users[userIndex].stats.gamesPlayed) * 100
        }

        // Сохраняем обновленные данные
        localStorage.setItem("mafia_users", JSON.stringify(users))

        // Обновляем текущего пользователя
        const currentUserJson = localStorage.getItem("mafia_user")
        if (currentUserJson) {
          const currentUser = JSON.parse(currentUserJson)
          if (!currentUser.stats) {
            currentUser.stats = { gamesPlayed: 0, gamesWon: 0, winRate: 0 }
          }
          currentUser.stats[stat] += value

          if (currentUser.stats.gamesPlayed > 0) {
            currentUser.stats.winRate = (currentUser.stats.gamesWon / currentUser.stats.gamesPlayed) * 100
          }

          localStorage.setItem("mafia_user", JSON.stringify(currentUser))
        }
      }
    } catch (error) {
      console.error("Error updating player stats:", error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-2xl p-6 space-y-6 bg-black/50 backdrop-blur-sm border border-gray-800">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold mb-2 text-white">Онлайн игра</h2>
          <p className="text-gray-300">Создайте комнату или присоединитесь к существующей</p>
          {user && <p className="text-green-400 mt-2">Вы играете как: {user.nickname}</p>}
        </div>

        {/* Показываем ошибки */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Табы */}
        <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg">
          <Button
            className={`flex-1 ${activeTab === "join" ? "bg-red-600 text-white" : "bg-transparent text-gray-400"}`}
            onClick={() => setActiveTab("join")}
          >
            Присоединиться
          </Button>
          <Button
            className={`flex-1 ${activeTab === "create" ? "bg-red-600 text-white" : "bg-transparent text-gray-400"}`}
            onClick={() => setActiveTab("create")}
          >
            Создать комнату
          </Button>
        </div>

        {activeTab === "join" ? (
          <div className="space-y-4">
            {/* Поиск по коду */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Код комнаты</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Введите код комнаты"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-gray-900/50 text-white placeholder:text-gray-400"
                  maxLength={10}
                />
                <Button
                  variant="destructive"
                  onClick={() => handleJoinRoom()}
                  disabled={!roomCode.trim() || isLoading}
                  className="w-fit"
                >
                  {isLoading ? "Загрузка..." : "Войти"}
                </Button>
              </div>
            </div>

            {/* Пароль для приватных комнат */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Пароль (если комната приватная)</label>
              <Input
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-900/50 text-white placeholder:text-gray-400"
                maxLength={50}
              />
            </div>

            {/* Список комнат */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-white">Доступные комнаты</label>
                <Button size="sm" variant="ghost" onClick={loadRooms} disabled={isLoading}>
                  Обновить
                </Button>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-8">Загрузка...</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {rooms.length === 0 ? (
                    <div className="text-center py-8 text-gray-300">
                      <p>Нет доступных комнат</p>
                    </div>
                  ) : (
                    rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-700"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{room.name}</span>
                            <Badge size="sm">{room.id}</Badge>
                            {room.isPrivate && (
                              <Badge variant="secondary" size="sm">
                                Приватная
                              </Badge>
                            )}
                            <Badge variant="outline" size="sm">
                              {room.status === "waiting" ? "Ожидание" : "В игре"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300">
                            Игроков: {room.players}/{room.maxPlayers}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={room.status !== "waiting" || room.players >= room.maxPlayers || isLoading}
                        >
                          Войти
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Название комнаты</label>
              <Input
                placeholder="Введите название комнаты"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-gray-900/50 text-white placeholder:text-gray-400"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-white">Минимум игроков: {minPlayers}</label>
              <Slider
                min={4}
                max={8}
                step={1}
                defaultValue={[minPlayers]}
                onValueChange={(value) => {
                  const newMin = value[0]
                  setMinPlayers(newMin)
                  if (maxPlayers < newMin) {
                    setMaxPlayers(newMin)
                  }
                }}
              />
              <div className="flex justify-between text-xs text-gray-300 mt-1">
                <span>4</span>
                <span>8</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-white">Максимум игроков: {maxPlayers}</label>
              <Slider
                min={minPlayers}
                max={10}
                step={1}
                defaultValue={[maxPlayers]}
                onValueChange={(value) => setMaxPlayers(value[0])}
              />
              <div className="flex justify-between text-xs text-gray-300 mt-1">
                <span>{minPlayers}</span>
                <span>10</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isPrivate"
                checked={isPrivate}
                onCheckedChange={(e) => setIsPrivate(!!e)}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500 bg-gray-900 border-gray-600"
              />
              <label htmlFor="isPrivate" className="text-sm font-medium text-white">
                Приватная комната
              </label>
            </div>

            {isPrivate && (
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Пароль</label>
                <Input
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-900/50 text-white placeholder:text-gray-400"
                  maxLength={50}
                />
              </div>
            )}

            <Button
              variant="destructive"
              onClick={handleCreateRoom}
              disabled={!roomName.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? "Создание комнаты..." : "Создать комнату"}
            </Button>
          </div>
        )}

        <div className="pt-4 border-t border-gray-700">
          <Button variant="ghost" onClick={onBack} className="w-full text-gray-300 hover:text-white">
            Назад
          </Button>
        </div>
      </Card>
    </div>
  )
}
