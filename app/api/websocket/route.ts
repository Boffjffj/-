import type { NextRequest } from "next/server"

// Простой WebSocket сервер для игры
interface GameRoom {
  id: string
  name: string
  hostId: string
  players: Map<string, Player>
  maxPlayers: number
  isPrivate: boolean
  password?: string
  status: "waiting" | "playing" | "finished"
  gameState?: any
  lastUpdate: number
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

interface GameMessage {
  type: "join" | "leave" | "create" | "gameState" | "chat" | "error" | "roomList"
  data?: any
  roomId?: string
  playerId?: string
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

  createRoom(name: string, maxPlayers: number, isPrivate: boolean, password?: string, hostId?: string): string {
    const roomId = this.generateRoomId()
    const room: GameRoom = {
      id: roomId,
      name,
      hostId: hostId || this.generatePlayerId(),
      players: new Map(),
      maxPlayers,
      isPrivate,
      password,
      status: "waiting",
      lastUpdate: Date.now(),
    }

    this.rooms.set(roomId, room)
    return roomId
  }

  joinRoom(roomId: string, playerId: string, playerName: string, ws: WebSocket, password?: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room) return false

    if (room.isPrivate && room.password !== password) return false
    if (room.players.size >= room.maxPlayers) return false

    const player: Player = {
      id: playerId,
      name: playerName,
      isAlive: true,
      isBot: false,
      isHost: room.players.size === 0,
      ws,
    }

    room.players.set(playerId, player)
    this.connections.set(ws, { playerId, roomId })

    // Уведомляем всех в комнате о новом игроке
    this.broadcastToRoom(roomId, {
      type: "gameState",
      data: { players: Array.from(room.players.values()) },
    })

    return true
  }

  leaveRoom(playerId: string, roomId?: string) {
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room) return

    room.players.delete(playerId)

    // Если комната пустая, удаляем её
    if (room.players.size === 0) {
      this.rooms.delete(roomId)
    } else {
      // Если хост ушел, назначаем нового
      const player = room.players.get(playerId)
      if (player?.isHost) {
        const newHost = Array.from(room.players.values())[0]
        if (newHost) {
          newHost.isHost = true
          room.hostId = newHost.id
        }
      }

      // Уведомляем остальных
      this.broadcastToRoom(roomId, {
        type: "gameState",
        data: { players: Array.from(room.players.values()) },
      })
    }
  }

  updateGameState(roomId: string, gameState: any) {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.gameState = gameState
    room.lastUpdate = Date.now()

    this.broadcastToRoom(roomId, {
      type: "gameState",
      data: gameState,
    })
  }

  broadcastToRoom(roomId: string, message: GameMessage) {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.players.forEach((player) => {
      if (player.ws && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message))
      }
    })
  }

  getRooms(): GameRoom[] {
    return Array.from(this.rooms.values())
      .filter((room) => !room.isPrivate && room.status === "waiting")
      .map((room) => ({
        ...room,
        players: new Map(), // Не отправляем полную информацию об игроках
      }))
  }

  handleConnection(ws: WebSocket) {
    ws.on("message", (data: string) => {
      try {
        const message: GameMessage = JSON.parse(data)
        this.handleMessage(ws, message)
      } catch (error) {
        console.error("Error parsing message:", error)
      }
    })

    ws.on("close", () => {
      const connection = this.connections.get(ws)
      if (connection) {
        this.leaveRoom(connection.playerId, connection.roomId)
        this.connections.delete(ws)
      }
    })
  }

  private handleMessage(ws: WebSocket, message: GameMessage) {
    switch (message.type) {
      case "create":
        const roomId = this.createRoom(
          message.data.name,
          message.data.maxPlayers,
          message.data.isPrivate,
          message.data.password,
          message.data.hostId,
        )
        ws.send(JSON.stringify({ type: "create", data: { roomId } }))
        break

      case "join":
        const success = this.joinRoom(message.roomId!, message.playerId!, message.data.name, ws, message.data.password)
        ws.send(
          JSON.stringify({
            type: "join",
            data: { success, roomId: message.roomId },
          }),
        )
        break

      case "gameState":
        if (message.roomId) {
          this.updateGameState(message.roomId, message.data)
        }
        break

      case "roomList":
        ws.send(
          JSON.stringify({
            type: "roomList",
            data: this.getRooms(),
          }),
        )
        break
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
