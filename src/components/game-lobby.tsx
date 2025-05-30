"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { useAuth } from "./auth-context"
import { Copy, Users, Settings, Crown, UserCheck, UserX, MessageSquare, Send } from "lucide-react"

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

interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: number
  type: "user" | "system"
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
  const [chatMessage, setChatMessage] = React.useState("")
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([])
  const [ws, setWs] = React.useState<WebSocket | null>(null)
  const [connectionStatus, setConnectionStatus] = React.useState<"connecting" | "connected" | "disconnected">(
    "connecting",
  )

  // Подключение к WebSocket
  React.useEffect(() => {
    connectWebSocket()
    loadRoomData()

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  const connectWebSocket = () => {
    try {
      // Используем правильный WebSocket URL
      const wsUrl =
        window.location.protocol === "https:"
          ? `wss://${window.location.host}/api/websocket`
          : `ws://${window.location.host}/api/websocket`

      const websocket = new WebSocket(wsUrl)

      websocket.onopen = () => {
        console.log("WebSocket подключен")
        setConnectionStatus("connected")
        setWs(websocket)

        // Присоединяемся к комнате после подключения
        const roomId = localStorage.getItem("mafia_room_id")
        const playerId = localStorage.getItem("mafia_player_id")
        const playerName = localStorage.getItem("mafia_player_name")

        if (roomId && playerId && playerName) {
          websocket.send(
            JSON.stringify({
              type: "joinRoom",
              roomId,
              playerId,
              playerName,
            }),
          )
        }
      }

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (error) {
          console.error("Ошибка парсинга WebSocket сообщения:", error)
        }
      }

      websocket.onclose = () => {
        console.log("WebSocket отключен")
        setConnectionStatus("disconnected")
        setWs(null)

        // Переподключение через 3 секунды
        setTimeout(() => {
          if (connectionStatus !== "connected") {
            connectWebSocket()
          }
        }, 3000)
      }

      websocket.onerror = (error) => {
        console.error("WebSocket ошибка:", error)
        setConnectionStatus("disconnected")
      }
    } catch (error) {
      console.error("Ошибка подключения WebSocket:", error)
      setConnectionStatus("disconnected")
    }
  }

  const handleWebSocketMessage = (message: any) => {
    console.log("Получено WebSocket сообщение:", message)

    switch (message.type) {
      case "roomState":
        if (message.data.players) {
          setPlayers(message.data.players)
        }
        if (message.data.roomInfo) {
          setRoomInfo((prev) => ({ ...prev, ...message.data.roomInfo }))
        }
        break

      case "playerJoined":
        addPlayer(message.data.player)
        addSystemMessage(`${message.data.player.name} присоединился к игре`)
        break

      case "playerLeft":
        removePlayer(message.data.playerId)
        addSystemMessage(`Игрок покинул игру`)
        break

      case "playerReady":
        updatePlayerReady(message.data.playerId, message.data.isReady)
        break

      case "chatMessage":
        addChatMessage({
          id: Date.now().toString(),
          sender: message.data.sender,
          message: message.data.message,
          timestamp: message.data.timestamp,
          type: "user",
        })
        break

      case "gameStarted":
        onGameStart()
        break

      case "error":
        setError(message.data.message || "Произошла ошибка")
        break
    }
  }

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
      setRoomInfo((prev) => ({
        ...prev,
        id: roomId,
        name: localStorage.getItem("mafia_room_name") || "Комната мафии",
      }))

      // Добавляем текущего игрока в список
      const currentPlayer: Player = {
        id: playerId,
        name: playerName,
        isHost: hostStatus,
        isReady: hostStatus, // Хост всегда готов
      }

      setPlayers([currentPlayer])

      // Добавляем приветственное сообщение
      addSystemMessage(`Добро пожаловать в комнату "${localStorage.getItem("mafia_room_name") || "Комната мафии"}"!`)
    } catch (error) {
      console.error("Error loading room data:", error)
      setError("Ошибка загрузки данных комнаты")
    }
  }

  const addPlayer = (player: Player) => {
    setPlayers((prev) => {
      // Проверяем, есть ли уже такой игрок
      if (prev.some((p) => p.id === player.id)) {
        return prev.map((p) => (p.id === player.id ? { ...p, ...player } : p))
      }
      return [...prev, player]
    })
  }

  const removePlayer = (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId))
  }

  const updatePlayerReady = (playerId: string, isReady: boolean) => {
    setPlayers((prev) =>
      prev.map((player) => {
        if (player.id === playerId) {
          return { ...player, isReady }
        }
        return player
      }),
    )
  }

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message])
  }

  const addSystemMessage = (message: string) => {
    addChatMessage({
      id: Date.now().toString(),
      sender: "Система",
      message,
      timestamp: Date.now(),
      type: "system",
    })
  }

  const handleToggleReady = () => {
    const newReadyState = !isReady
    setIsReady(newReadyState)

    // Отправляем сообщение через WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "playerReady",
          roomId: roomInfo.id,
          playerId: localStorage.getItem("mafia_player_id"),
          isReady: newReadyState,
        }),
      )
    }

    // Обновляем локально
    const playerId = localStorage.getItem("mafia_player_id")
    if (playerId) {
      updatePlayerReady(playerId, newReadyState)
    }
  }

  const handleStartGame = () => {
    if (!isHost) return

    const readyPlayers = players.filter((p) => p.isReady || p.isHost)
    if (readyPlayers.length < roomInfo.minPlayers) {
      setError(`Недостаточно игроков. Минимум: ${roomInfo.minPlayers}`)
      return
    }

    setIsLoading(true)

    // Отправляем сообщение о начале игры
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "startGame",
          roomId: roomInfo.id,
          playerId: localStorage.getItem("mafia_player_id"),
        }),
      )
    }

    // Имитируем запуск игры
    setTimeout(() => {
      onGameStart()
    }, 1000)
  }

  const handleLeaveRoom = () => {
    // Отправляем сообщение о выходе
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "leaveRoom",
          roomId: roomInfo.id,
          playerId: localStorage.getItem("mafia_player_id"),
        }),
      )
    }

    // Закрываем WebSocket
    if (ws) {
      ws.close()
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
    navigator.clipboard.writeText(roomInfo.id)
    addSystemMessage("Код комнаты скопирован в буфер обмена")
  }

  const canStartGame = () => {
    const readyPlayers = players.filter((p) => p.isReady || p.isHost)
    return isHost && readyPlayers.length >= roomInfo.minPlayers && players.length >= roomInfo.minPlayers
  }

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !ws || ws.readyState !== WebSocket.OPEN) return

    const playerName = localStorage.getItem("mafia_player_name") || "Игрок"

    // Отправляем сообщение через WebSocket
    ws.send(
      JSON.stringify({
        type: "chatMessage",
        roomId: roomInfo.id,
        playerId: localStorage.getItem("mafia_player_id"),
        data: {
          sender: playerName,
          message: chatMessage,
          timestamp: Date.now(),
        },
      }),
    )

    // Добавляем сообщение локально
    addChatMessage({
      id: Date.now().toString(),
      sender: playerName,
      message: chatMessage,
      timestamp: Date.now(),
      type: "user",
    })

    // Очищаем поле ввода
    setChatMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Заголовок лобби */}
        <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Лобби игры</h1>
            <p className="text-gray-300 mb-4">{roomInfo.name || "Комната мафии"}</p>

            {/* Код комнаты */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-gray-300">Код комнаты:</span>
              <Badge variant="outline" className="text-lg px-3 py-1 text-white">
                {roomInfo.id}
              </Badge>
              <Button size="sm" variant="ghost" onClick={copyRoomCode}>
                <Copy className="w-4 h-4 text-white" />
              </Button>
            </div>

            {/* Статус игроков и подключения */}
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
              <Badge
                variant={connectionStatus === "connected" ? "default" : "destructive"}
                className={connectionStatus === "connected" ? "bg-green-600" : "bg-red-600"}
              >
                {connectionStatus === "connected"
                  ? "Онлайн"
                  : connectionStatus === "connecting"
                    ? "Подключение..."
                    : "Оффлайн"}
              </Badge>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Список игроков */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Игроки в лобби ({players.length})
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
                {Array.from({ length: Math.max(0, roomInfo.maxPlayers - players.length) }).map((_, index) => (
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

          {/* Чат */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800 h-full">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Чат
              </h2>

              <div className="flex flex-col h-96">
                {/* Сообщения */}
                <div className="flex-1 overflow-y-auto mb-4 p-3 bg-gray-900/30 rounded-lg border border-gray-700">
                  {chatMessages.length === 0 ? (
                    <div className="text-gray-500 text-center py-4 text-sm">Сообщений пока нет</div>
                  ) : (
                    <div className="space-y-2">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                          {msg.type === "system" ? (
                            <p className="text-gray-400 italic text-xs">{msg.message}</p>
                          ) : (
                            <div>
                              <span className="font-bold text-white text-xs">{msg.sender}: </span>
                              <span className="text-gray-300 text-xs">{msg.message}</span>
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
                    placeholder="Сообщение..."
                    disabled={connectionStatus !== "connected"}
                    className="flex-1 bg-gray-900/30 text-white placeholder:text-gray-500 rounded-lg border border-gray-700 px-3 py-2 text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="sm"
                    disabled={!chatMessage.trim() || connectionStatus !== "connected"}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Панель управления */}
          <div className="lg:col-span-1 space-y-6">
            {/* Кнопки действий */}
            <Card className="p-6 bg-black/50 backdrop-blur-sm border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Действия</h3>

              <div className="space-y-3">
                {!isHost && (
                  <Button
                    onClick={handleToggleReady}
                    variant={isReady ? "default" : "outline"}
                    className="w-full"
                    disabled={connectionStatus !== "connected"}
                  >
                    {isReady ? "Отменить готовность" : "Готов к игре"}
                  </Button>
                )}

                {isHost && (
                  <>
                    <Button
                      onClick={handleStartGame}
                      disabled={!canStartGame() || isLoading || connectionStatus !== "connected"}
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
                <div className="flex justify-between">
                  <span>Статус:</span>
                  <span className={connectionStatus === "connected" ? "text-green-400" : "text-red-400"}>
                    {connectionStatus === "connected" ? "Подключено" : "Отключено"}
                  </span>
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
