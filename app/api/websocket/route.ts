import type { NextRequest } from "next/server"

// Простой WebSocket сервер для игры
interface GameRoom {
  id: string
  name: string
  hostId: string
  players: Map<string, Player>
  maxPlayers: number
  minPlayers: number
  isPrivate: boolean
  password?: string
  status: "waiting" | "playing" | "finished"
  gameState?: any
  lastUpdate: number
  chatMessages: ChatMessage[]
}

interface Player {
  id: string
  name: string
  role?: string
  isAlive: boolean
  isBot: boolean
  isHost: boolean
  ws?: WebSocket
}

interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: number
  type: "user" | "system"
}

interface GameMessage {
  type: "joinRoom" | "leaveRoom" | "startGame" | "chatMessage" | "getRoomState"
  roomId?: string
  playerId?: string
  playerName?: string
  data?: any
}

class GameServer {
  private rooms = new Map<string, GameRoom>()
  private connections = new Map<WebSocket, { playerId: string; roomId?: string }>()

  generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  generatePlayerId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  createRoom(
    name: string,
    maxPlayers: number,
    minPlayers: number,
    isPrivate: boolean,
    password?: string,
    hostId?: string,
  ): string {
    const roomId = this.generateRoomId()
    const room: GameRoom = {
      id: roomId,
      name,
      hostId: hostId || this.generatePlayerId(),
      players: new Map(),
      maxPlayers,
      minPlayers,
      isPrivate,
      password,
      status: "waiting",
      lastUpdate: Date.now(),
      chatMessages: [],
    }

    this.rooms.set(roomId, room)
    console.log(`Создана комната ${roomId}: ${name}`)
    return roomId
  }

  joinRoom(roomId: string, playerId: string, playerName: string, ws: WebSocket, password?: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room) {
      console.log(`Комната ${roomId} не найдена`)
      return false
    }

    if (room.isPrivate && room.password !== password) {
      console.log(`Неверный пароль для комнаты ${roomId}`)
      return false
    }

    if (room.players.size >= room.maxPlayers) {
      console.log(`Комната ${roomId} переполнена`)
      return false
    }

    const isHost = room.players.size === 0 || playerId === room.hostId
    const player: Player = {
      id: playerId,
      name: playerName,
      isAlive: true,
      isBot: false,
      isHost,
      ws,
    }

    room.players.set(playerId, player)
    this.connections.set(ws, { playerId, roomId })

    console.log(`Игрок ${playerName} присоединился к комнате ${roomId}`)

    // Добавляем системное сообщение
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "Система",
      message: `${playerName} присоединился к игре`,
      timestamp: Date.now(),
      type: "system",
    }
    room.chatMessages.push(systemMessage)

    // Уведомляем всех в комнате о новом игроке
    this.broadcastToRoom(roomId, {
      type: "playerJoined",
      data: { player: this.playerToJSON(player) },
    })

    // Отправляем текущее состояние комнаты новому игроку
    this.sendRoomState(ws, roomId)

    return true
  }

  leaveRoom(playerId: string, roomId?: string) {
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room) return

    const player = room.players.get(playerId)
    room.players.delete(playerId)

    console.log(`Игрок ${player?.name || playerId} покинул комнату ${roomId}`)

    // Если комната пустая, удаляем её
    if (room.players.size === 0) {
      this.rooms.delete(roomId)
      console.log(`Комната ${roomId} удалена (пустая)`)
    } else {
      // Если хост ушел, назначаем нового
      if (player?.isHost) {
        const newHost = Array.from(room.players.values())[0]
        if (newHost) {
          newHost.isHost = true
          room.hostId = newHost.id
          console.log(`Новый хост комнаты ${roomId}: ${newHost.name}`)
        }
      }

      // Добавляем системное сообщение
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "Система",
        message: `${player?.name || "Игрок"} покинул игру`,
        timestamp: Date.now(),
        type: "system",
      }
      room.chatMessages.push(systemMessage)

      // Уведомляем остальных
      this.broadcastToRoom(roomId, {
        type: "playerLeft",
        data: { playerId },
      })

      // Отправляем обновленное состояние
      this.broadcastRoomState(roomId)
    }
  }

  addChatMessage(roomId: string, sender: string, message: string, messageId: string) {
    const room = this.rooms.get(roomId)
    if (!room) return

    const chatMessage: ChatMessage = {
      id: messageId,
      sender,
      message,
      timestamp: Date.now(),
      type: "user",
    }

    room.chatMessages.push(chatMessage)
    console.log(`Сообщение в комнате ${roomId} от ${sender}: ${message}`)

    // Рассылаем сообщение всем в комнате
    this.broadcastToRoom(roomId, {
      type: "chatMessage",
      data: chatMessage,
    })
  }

  startGame(roomId: string, hostId: string) {
    const room = this.rooms.get(roomId)
    if (!room || room.hostId !== hostId) return

    if (room.players.size < room.minPlayers) return

    room.status = "playing"
    console.log(`Игра в комнате ${roomId} началась`)

    // Уведомляем всех о начале игры
    this.broadcastToRoom(roomId, {
      type: "gameStarted",
      data: { players: Array.from(room.players.values()).map((p) => this.playerToJSON(p)) },
    })
  }

  sendRoomState(ws: WebSocket, roomId: string) {
    const room = this.rooms.get(roomId)
    if (!room) return

    const roomState = {
      roomInfo: {
        id: room.id,
        name: room.name,
        maxPlayers: room.maxPlayers,
        minPlayers: room.minPlayers,
        isPrivate: room.isPrivate,
        status: room.status,
      },
      players: Array.from(room.players.values()).map((p) => this.playerToJSON(p)),
      chatMessages: room.chatMessages,
    }

    ws.send(
      JSON.stringify({
        type: "roomState",
        data: roomState,
      }),
    )
  }

  broadcastRoomState(roomId: string) {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.players.forEach((player) => {
      if (player.ws && player.ws.readyState === WebSocket.OPEN) {
        this.sendRoomState(player.ws, roomId)
      }
    })
  }

  broadcastToRoom(roomId: string, message: any) {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.players.forEach((player) => {
      if (player.ws && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message))
      }
    })
  }

  playerToJSON(player: Player) {
    return {
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      isAlive: player.isAlive,
      role: player.role,
    }
  }

  getRooms(): any[] {
    return Array.from(this.rooms.values())
      .filter((room) => !room.isPrivate && room.status === "waiting")
      .map((room) => ({
        id: room.id,
        name: room.name,
        players: room.players.size,
        maxPlayers: room.maxPlayers,
        minPlayers: room.minPlayers,
        status: room.status,
      }))
  }

  handleConnection(ws: WebSocket) {
    console.log("Новое WebSocket подключение")

    ws.on("message", (data: string) => {
      try {
        const message: GameMessage = JSON.parse(data)
        this.handleMessage(ws, message)
      } catch (error) {
        console.error("Ошибка парсинга сообщения:", error)
        ws.send(
          JSON.stringify({
            type: "error",
            data: { message: "Ошибка парсинга сообщения" },
          }),
        )
      }
    })

    ws.on("close", () => {
      console.log("WebSocket подключение закрыто")
      const connection = this.connections.get(ws)
      if (connection) {
        this.leaveRoom(connection.playerId, connection.roomId)
        this.connections.delete(ws)
      }
    })

    ws.on("error", (error) => {
      console.error("WebSocket ошибка:", error)
    })
  }

  private handleMessage(ws: WebSocket, message: GameMessage) {
    console.log("Получено сообщение:", message.type, message)

    switch (message.type) {
      case "joinRoom":
        if (message.roomId && message.playerId && message.playerName) {
          const success = this.joinRoom(message.roomId, message.playerId, message.playerName, ws)
          if (!success) {
            ws.send(
              JSON.stringify({
                type: "error",
                data: { message: "Не удалось присоединиться к комнате" },
              }),
            )
          }
        }
        break

      case "leaveRoom":
        if (message.roomId && message.playerId) {
          this.leaveRoom(message.playerId, message.roomId)
        }
        break

      case "chatMessage":
        if (message.roomId && message.data?.sender && message.data?.message) {
          this.addChatMessage(
            message.roomId,
            message.data.sender,
            message.data.message,
            message.data.id || Date.now().toString(),
          )
        }
        break

      case "startGame":
        if (message.roomId && message.playerId) {
          this.startGame(message.roomId, message.playerId)
        }
        break

      case "getRoomState":
        if (message.roomId) {
          this.sendRoomState(ws, message.roomId)
        }
        break

      default:
        console.log("Неизвестный тип сообщения:", message.type)
    }
  }
}

const gameServer = new GameServer()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const upgrade = request.headers.get("upgrade")

  if (upgrade !== "websocket") {
    return new Response("Expected websocket", { status: 426 })
  }

  // В реальном приложении здесь был бы WebSocket upgrade
  // Для демонстрации возвращаем информацию о сервере
  return new Response(
    JSON.stringify({
      message: "WebSocket server ready",
      rooms: gameServer.getRooms().length,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  )
}

// Экспортируем сервер для использования в других местах
export { gameServer }
