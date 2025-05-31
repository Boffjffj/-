"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { useAuth } from "./auth-context"
import { Copy, Users, Settings, Crown, MessageSquare, Send, RefreshCw } from "lucide-react"

interface GameLobbyProps {
  onGameStart: () => void
  onLeaveRoom: () => void
}

interface Player {
  id: string
  name: string
  isHost: boolean
  isConnected: boolean
}

interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: number
  type: "user" | "system"
}

interface RoomData {
  roomInfo: {
    id: string
    name: string
    maxPlayers: number
    minPlayers: number
    isPrivate: boolean
    status: string
  }
  players: Player[]
  chatMessages: ChatMessage[]
}

const GameLobby: React.FC<GameLobbyProps> = ({ onGameStart, onLeaveRoom }) => {
  const { user } = useAuth()
  const [roomData, setRoomData] = React.useState<RoomData | null>(null)
  const [isHost, setIsHost] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [chatMessage, setChatMessage] = React.useState("")
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const chatContainerRef = React.useRef<HTMLDivElement>(null)
  const intervalRef = React.useRef<NodeJS.Timeout>()

  // Автопрокрутка чата
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [roomData?.chatMessages])

  // Загрузка данных лобби
  React.useEffect(() => {
    loadLobbyData()

    // Обновляем данные каждые 2 секунды
    intervalRef.current = setInterval(() => {
      loadLobbyData(true) // silent refresh
    }, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const loadLobbyData = async (silent = false) => {
    try {
      if (!silent) {
        setIsRefreshing(true)
      }

      const roomId = localStorage.getItem("mafia_room_id")
      const playerId = localStorage.getItem("mafia_player_id")
      const hostStatus = localStorage.getItem("mafia_is_host") === "true"

      if (!roomId || !playerId) {
        setError("Данные комнаты не найдены")
        return
      }

      setIsHost(hostStatus)

      const response = await fetch(`/api/lobby?roomId=${roomId}&playerId=${playerId}`)
      const data = await response.json()

      if (data.success && data.data) {
        console.log(`📊 Loaded lobby data:`, {
          players: data.data.players.length,
          messages: data.data.chatMessages.length,
        })

        setRoomData(data.data)
        setError("")
      } else {
        console.error("❌ Failed to load lobby data:", data.error)
        if (!silent) {
          setError(data.error || "Ошибка загрузки данных лобби")
        }
      }
    } catch (error) {
      console.error("❌ Error loading lobby data:", error)
      if (!silent) {
        setError("Ошибка соединения с сервером")
      }
    } finally {
      if (!silent) {
        setIsRefreshing(false)
      }
    }
  }

  const handleStartGame = () => {
    if (!isHost || !roomData) return

    if (roomData.players.length < roomData.roomInfo.minPlayers) {
      setError(`Недостаточно игроков. Минимум: ${roomData.roomInfo.minPlayers}`)
      return
    }

    setIsLoading(true)

    // Имитируем запуск игры
    setTimeout(() => {
      onGameStart()
    }, 1000)
  }

  const handleLeaveRoom = async () => {
    try {
      const playerId = localStorage.getItem("mafia_player_id")
      if (playerId) {
        await fetch("/api/rooms", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        })
      }
    } catch (error) {
      console.error("❌ Error leaving room:", error)
    }

    // Очищаем данные комнаты
    localStorage.removeItem("mafia_player_id")
    localStorage.removeItem("mafia_room_id")
    localStorage.removeItem("mafia_is_host")
    localStorage.removeItem("mafia_player_name")
    localStorage.removeItem("mafia_room_name")
    onLeaveRoom()
  }

  const copyRoomCode = () => {
    if (roomData?.roomInfo.id) {
      navigator.clipboard.writeText(roomData.roomInfo.id)
      // Можно добавить уведомление
    }
  }

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !roomData) return

    try {
      const roomId = localStorage.getItem("mafia_room_id")
      const playerId = localStorage.getItem("mafia_player_id")
      const playerName = localStorage.getItem("mafia_player_name") || "Игрок"

      const response = await fetch("/api/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          playerId,
          sender: playerName,
          message: chatMessage,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setChatMessage("")
        // Обновляем данные лобби
        loadLobbyData(true)
      } else {
        setError(data.error || "Ошибка отправки сообщения")
      }
    } catch (error) {
      console.error("❌ Error sending message:", error)
      setError("Ошибка отправки сообщения")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!roomData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-white">Загрузка лобби...</p>
          {error && <p className="mt-2 text-red-400">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Заголовок лобби */}
        <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-white">Лобби игры</h1>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => loadLobbyData()}
                disabled={isRefreshing}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <p className="text-gray-300 mb-4">{roomData.roomInfo.name}</p>

            {/* Код комнаты */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-gray-300">Код комнаты:</span>
              <Badge variant="outline" className="text-lg px-3 py-1 text-white">
                {roomData.roomInfo.id}
              </Badge>
              <Button size="sm" variant="ghost" onClick={copyRoomCode}>
                <Copy className="w-4 h-4 text-white" />
              </Button>
            </div>

            {/* Статус игроков */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="font-bold text-green-400">
                  {roomData.players.length}/{roomData.roomInfo.maxPlayers} игроков
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Список игроков */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Игроки в лобби ({roomData.players.length})
              </h2>

              <div className="space-y-3">
                {roomData.players.map((player) => (
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
                          {!player.isConnected && <span className="text-xs text-red-400">(отключен)</span>}
                        </div>
                        <span className="text-sm text-gray-400">{player.isHost ? "Хост" : "Игрок"}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Пустые слоты */}
                {Array.from({ length: Math.max(0, roomData.roomInfo.maxPlayers - roomData.players.length) }).map(
                  (_, index) => (
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
                  ),
                )}
              </div>
            </Card>

            {/* Панель управления */}
            <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800 mt-6">
              <h3 className="text-lg font-bold text-white mb-4">Действия</h3>

              <div className="space-y-3">
                {isHost && (
                  <>
                    <Button
                      onClick={handleStartGame}
                      disabled={roomData.players.length < roomData.roomInfo.minPlayers || isLoading}
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
              <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800 mt-6">
                <h3 className="text-lg font-bold text-white mb-4">Настройки игры</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">
                      Минимум игроков: {roomData.roomInfo.minPlayers}
                    </label>
                    <Slider min={4} max={8} step={1} defaultValue={[roomData.roomInfo.minPlayers]} disabled />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">
                      Максимум игроков: {roomData.roomInfo.maxPlayers}
                    </label>
                    <Slider
                      min={roomData.roomInfo.minPlayers}
                      max={10}
                      step={1}
                      defaultValue={[roomData.roomInfo.maxPlayers]}
                      disabled
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Чат */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800 h-full">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Чат лобби ({roomData.chatMessages.length})
              </h2>

              <div className="flex flex-col h-[500px]">
                {/* Сообщения */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto mb-4 p-3 bg-gray-900/30 rounded-lg border border-gray-700"
                >
                  {roomData.chatMessages.length === 0 ? (
                    <div className="text-gray-500 text-center py-4">Сообщений пока нет</div>
                  ) : (
                    <div className="space-y-2">
                      {roomData.chatMessages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                          {msg.type === "system" ? (
                            <p className="text-green-400 italic">🔔 {msg.message}</p>
                          ) : (
                            <div>
                              <span className="font-bold text-white">{msg.sender}: </span>
                              <span className="text-gray-300">{msg.message}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Поле ввода */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите сообщение..."
                    className="flex-1 bg-gray-900/30 text-white placeholder:text-gray-500 rounded-lg border border-gray-700 px-3 py-2"
                    maxLength={200}
                  />
                  <Button onClick={handleSendMessage} disabled={!chatMessage.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Отправить
                  </Button>
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
