"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { useAuth } from "./auth-context"
import { Copy, Users, Settings, Crown, UserCheck, UserX } from "lucide-react"

interface GameLobbyProps {
  onGameStart: () => void
  onLeaveRoom: () => void
}

interface Player {
  id: string
  name: string
  isHost: boolean
  isReady: boolean
  avatar?: string
}

const GameLobby: React.FC<GameLobbyProps> = ({ onGameStart, onLeaveRoom }) => {
  const { user } = useAuth()
  const [players, setPlayers] = React.useState<Player[]>([])
  const [roomInfo, setRoomInfo] = React.useState({
    id: "",
    name: "",
    minPlayers: 4,
    maxPlayers: 8,
    isPrivate: false,
  })
  const [isReady, setIsReady] = React.useState(false)
  const [isHost, setIsHost] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  // Загружаем данные комнаты при монтировании
  React.useEffect(() => {
    loadRoomData()
  }, [])

  const loadRoomData = () => {
    try {
      const roomId = localStorage.getItem("mafia_room_id")
      const playerId = localStorage.getItem("mafia_player_id")
      const playerName = localStorage.getItem("mafia_player_name")
      const hostStatus = localStorage.getItem("mafia_is_host") === "true"

      if (!roomId || !playerId || !playerName) {
        setError("Данные комнаты не найдены")
        return
      }

      setIsHost(hostStatus)
      setRoomInfo((prev) => ({ ...prev, id: roomId }))

      // Симулируем загрузку игроков (в реальном приложении это будет WebSocket)
      const mockPlayers: Player[] = [
        {
          id: playerId,
          name: playerName,
          isHost: hostStatus,
          isReady: false,
        },
      ]

      setPlayers(mockPlayers)
    } catch (error) {
      console.error("Error loading room data:", error)
      setError("Ошибка загрузки данных комнаты")
    }
  }

  const handleToggleReady = () => {
    setIsReady(!isReady)
    // Обновляем статус готовности в списке игроков
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === localStorage.getItem("mafia_player_id") ? { ...player, isReady: !isReady } : player,
      ),
    )
  }

  const handleStartGame = () => {
    if (!isHost) return

    const readyPlayers = players.filter((p) => p.isReady || p.isHost)
    if (readyPlayers.length < roomInfo.minPlayers) {
      setError(`Недостаточно игроков. Минимум: ${roomInfo.minPlayers}`)
      return
    }

    setIsLoading(true)
    // Симулируем запуск игры
    setTimeout(() => {
      onGameStart()
    }, 1000)
  }

  const handleLeaveRoom = () => {
    // Очищаем данные комнаты
    localStorage.removeItem("mafia_player_id")
    localStorage.removeItem("mafia_room_id")
    localStorage.removeItem("mafia_is_host")
    localStorage.removeItem("mafia_player_name")
    onLeaveRoom()
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomInfo.id)
    // Можно добавить уведомление о копировании
  }

  const canStartGame = () => {
    const readyPlayers = players.filter((p) => p.isReady || p.isHost)
    return isHost && readyPlayers.length >= roomInfo.minPlayers && players.length >= roomInfo.minPlayers
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Заголовок лобби */}
        <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Лобби игры</h1>
            <p className="text-gray-300 mb-4">{roomInfo.name || "Комната мафии"}</p>

            {/* Код комнаты */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-gray-300">Код комнаты:</span>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {roomInfo.id}
              </Badge>
              <Button size="sm" variant="ghost" onClick={copyRoomCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            {/* Статус игроков */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>
                  {players.length}/{roomInfo.maxPlayers} игроков
                </span>
              </div>
              <div className="flex items-center gap-1">
                <UserCheck className="w-4 h-4" />
                <span>{players.filter((p) => p.isReady || p.isHost).length} готовы</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Список игроков */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Игроки в лобби
              </h2>

              <div className="space-y-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                        <span className="text-white font-bold">{player.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{player.name}</span>
                          {player.isHost && <Crown className="w-4 h-4 text-yellow-500" />}
                        </div>
                        <span className="text-sm text-gray-400">{player.isHost ? "Хост" : "Игрок"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {player.isReady || player.isHost ? (
                        <Badge variant="default" className="bg-green-600">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Готов
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <UserX className="w-3 h-3 mr-1" />
                          Не готов
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

                {/* Пустые слоты */}
                {Array.from({ length: roomInfo.maxPlayers - players.length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-900/10 rounded-lg border border-gray-700 border-dashed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-500" />
                      </div>
                      <span className="text-gray-500">Ожидание игрока...</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Панель управления */}
          <div className="space-y-6">
            {/* Кнопки действий */}
            <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Действия</h3>

              <div className="space-y-3">
                {!isHost && (
                  <Button onClick={handleToggleReady} variant={isReady ? "default" : "outline"} className="w-full">
                    {isReady ? "Отменить готовность" : "Готов к игре"}
                  </Button>
                )}

                {isHost && (
                  <>
                    <Button
                      onClick={handleStartGame}
                      disabled={!canStartGame() || isLoading}
                      variant="destructive"
                      className="w-full"
                    >
                      {isLoading ? "Запуск..." : "Начать игру"}
                    </Button>

                    <Button onClick={() => setShowSettings(!showSettings)} variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Настройки
                    </Button>
                  </>
                )}

                <Button onClick={handleLeaveRoom} variant="ghost" className="w-full text-gray-300 hover:text-white">
                  Покинуть комнату
                </Button>
              </div>
            </Card>

            {/* Настройки (только для хоста) */}
            {isHost && showSettings && (
              <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">Настройки игры</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">
                      Минимум игроков: {roomInfo.minPlayers}
                    </label>
                    <Slider
                      min={4}
                      max={8}
                      step={1}
                      defaultValue={[roomInfo.minPlayers]}
                      onValueChange={(value) => setRoomInfo((prev) => ({ ...prev, minPlayers: value[0] }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">
                      Максимум игроков: {roomInfo.maxPlayers}
                    </label>
                    <Slider
                      min={roomInfo.minPlayers}
                      max={10}
                      step={1}
                      defaultValue={[roomInfo.maxPlayers]}
                      onValueChange={(value) => setRoomInfo((prev) => ({ ...prev, maxPlayers: value[0] }))}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Информация о игре */}
            <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Информация</h3>

              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Минимум игроков:</span>
                  <span>{roomInfo.minPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Максимум игроков:</span>
                  <span>{roomInfo.maxPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Тип комнаты:</span>
                  <span>{roomInfo.isPrivate ? "Приватная" : "Публичная"}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Ошибки */}
        {error && (
          <Card className="p-4 bg-red-900/20 border border-red-800">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </Card>
        )}
      </div>
    </div>
  )
}

export default GameLobby
