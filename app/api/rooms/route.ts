import { type NextRequest, NextResponse } from "next/server"
import { validateRoomData, generateId, generateRoomCode, createErrorHandler } from "../../../src/utils/safe-storage"

// Хранилище комнат в памяти сервера
const rooms = new Map<string, GameRoom>()
const players = new Map<string, Player>()

interface Player {
  id: string
  name: string
  roomId?: string
  lastSeen: number
  isHost: boolean
}

interface GameRoom {
  id: string
  name: string
  hostId: string
  players: string[]
  maxPlayers: number
  isPrivate: boolean
  password?: string
  status: "waiting" | "playing" | "finished"
  gameState?: any
  lastUpdate: number
  createdAt: number
}

// Очистка старых комнат и игроков
function cleanup() {
  const now = Date.now()
  const timeout = 30 * 60 * 1000 // 30 минут
  const maxRooms = 100 // Максимальное количество комнат

  // Удаляем неактивных игроков
  for (const [playerId, player] of players.entries()) {
    if (now - player.lastSeen > timeout) {
      console.log(`Removing inactive player: ${playerId}`)
      players.delete(playerId)

      // Удаляем игрока из комнаты
      if (player.roomId) {
        const room = rooms.get(player.roomId)
        if (room) {
          room.players = room.players.filter((id) => id !== playerId)
          if (room.players.length === 0) {
            console.log(`Removing empty room: ${player.roomId}`)
            rooms.delete(player.roomId)
          } else if (room.hostId === playerId) {
            // Назначаем нового хоста
            room.hostId = room.players[0]
            const newHost = players.get(room.hostId)
            if (newHost) {
              newHost.isHost = true
              console.log(`New host assigned: ${room.hostId} for room ${player.roomId}`)
            }
          }
        }
      }
    }
  }

  // Удаляем пустые комнаты и старые комнаты
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.length === 0 || now - room.lastUpdate > timeout) {
      console.log(`Removing old/empty room: ${roomId}`)
      rooms.delete(roomId)
    }
  }

  // Ограничиваем количество комнат
  if (rooms.size > maxRooms) {
    const sortedRooms = Array.from(rooms.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt)
    const roomsToDelete = sortedRooms.slice(0, rooms.size - maxRooms)

    for (const [roomId] of roomsToDelete) {
      rooms.delete(roomId)
      console.log(`Removed old room due to limit: ${roomId}`)
    }
  }
}

// GET - получить список комнат
export async function GET() {
  try {
    cleanup()

    const publicRooms = Array.from(rooms.values())
      .filter((room) => !room.isPrivate && room.status === "waiting")
      .map((room) => ({
        id: room.id,
        name: room.name,
        players: room.players.length,
        maxPlayers: room.maxPlayers,
        status: room.status,
        isPrivate: room.isPrivate,
      }))
      .slice(0, 50) // Ограничиваем количество возвращаемых комнат

    console.log(`GET /api/rooms - Returning ${publicRooms.length} rooms`)
    return NextResponse.json({ success: true, rooms: publicRooms })
  } catch (error) {
    const errorHandler = createErrorHandler("GET /api/rooms")
    return NextResponse.json(errorHandler(error))
  }
}

// POST - создать комнату или присоединиться
export async function POST(request: NextRequest) {
  try {
    cleanup()

    // Проверяем размер запроса
    const contentLength = request.headers.get("content-length")
    if (contentLength && Number.parseInt(contentLength) > 1024) {
      return NextResponse.json({ success: false, error: "Слишком большой запрос" })
    }

    const body = await request.json()
    console.log("POST /api/rooms - Received body:", body)

    // Валидируем входные данные
    const validationErrors = validateRoomData(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ success: false, error: validationErrors[0] })
    }

    const { action, playerName, roomName, maxPlayers, isPrivate, password, roomId, playerId } = body

    if (action === "create") {
      // Проверяем лимит комнат
      if (rooms.size >= 100) {
        return NextResponse.json({ success: false, error: "Достигнут лимит комнат на сервере" })
      }

      if (!roomName?.trim() || !playerName?.trim() || !maxPlayers) {
        return NextResponse.json({ success: false, error: "Отсутствуют обязательные поля" })
      }

      const newPlayerId = playerId || generateId()
      const newRoomId = generateRoomCode()

      const player: Player = {
        id: newPlayerId,
        name: playerName.trim(),
        roomId: newRoomId,
        lastSeen: Date.now(),
        isHost: true,
      }

      const room: GameRoom = {
        id: newRoomId,
        name: roomName.trim(),
        hostId: newPlayerId,
        players: [newPlayerId],
        maxPlayers: Math.min(Math.max(maxPlayers, 4), 10), // Ограничиваем диапазон
        isPrivate: Boolean(isPrivate),
        password: isPrivate ? password?.trim() : undefined,
        status: "waiting",
        lastUpdate: Date.now(),
        createdAt: Date.now(),
      }

      players.set(newPlayerId, player)
      rooms.set(newRoomId, room)

      console.log(`Room created: ${newRoomId} by player ${newPlayerId} (${playerName})`)
      return NextResponse.json({
        success: true,
        roomId: newRoomId,
        playerId: newPlayerId,
        isHost: true,
      })
    }

    if (action === "join") {
      if (!roomId?.trim() || !playerName?.trim()) {
        return NextResponse.json({ success: false, error: "Отсутствуют обязательные поля" })
      }

      console.log(`Attempting to join room: ${roomId}`)
      const room = rooms.get(roomId.trim())
      if (!room) {
        console.log(`Room not found: ${roomId}`)
        return NextResponse.json({ success: false, error: "Комната не найдена" })
      }

      console.log(
        `Room found: ${room.name}, status: ${room.status}, players: ${room.players.length}/${room.maxPlayers}`,
      )

      if (room.isPrivate && room.password !== password?.trim()) {
        console.log(`Invalid password for room: ${roomId}`)
        return NextResponse.json({ success: false, error: "Неверный пароль" })
      }

      if (room.players.length >= room.maxPlayers) {
        console.log(`Room is full: ${roomId}`)
        return NextResponse.json({ success: false, error: "Комната заполнена" })
      }

      if (room.status !== "waiting") {
        console.log(`Game already started in room: ${roomId}`)
        return NextResponse.json({ success: false, error: "Игра уже началась" })
      }

      const newPlayerId = playerId || generateId()

      // Проверяем, не присоединился ли игрок уже
      if (room.players.includes(newPlayerId)) {
        console.log(`Player ${newPlayerId} already in room ${roomId}`)
        return NextResponse.json({
          success: true,
          roomId,
          playerId: newPlayerId,
          isHost: room.hostId === newPlayerId,
        })
      }

      // Проверяем, нет ли игрока с таким же именем
      const existingPlayerWithName = room.players.find((pid) => {
        const p = players.get(pid)
        return p && p.name.toLowerCase() === playerName.trim().toLowerCase()
      })

      if (existingPlayerWithName) {
        return NextResponse.json({ success: false, error: "Игрок с таким именем уже в комнате" })
      }

      const player: Player = {
        id: newPlayerId,
        name: playerName.trim(),
        roomId: roomId.trim(),
        lastSeen: Date.now(),
        isHost: false,
      }

      room.players.push(newPlayerId)
      room.lastUpdate = Date.now()
      players.set(newPlayerId, player)

      console.log(`Player ${newPlayerId} (${playerName}) joined room ${roomId}. Total players: ${room.players.length}`)
      return NextResponse.json({
        success: true,
        roomId,
        playerId: newPlayerId,
        isHost: false,
      })
    }

    console.log(`Unknown action: ${action}`)
    return NextResponse.json({ success: false, error: "Неизвестное действие" })
  } catch (error) {
    const errorHandler = createErrorHandler("POST /api/rooms")
    return NextResponse.json(errorHandler(error))
  }
}

// PUT - обновить состояние игрока (heartbeat)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerId } = body

    if (!playerId) {
      return NextResponse.json({ success: false, error: "Отсутствует ID игрока" })
    }

    const player = players.get(playerId)
    if (player) {
      player.lastSeen = Date.now()

      if (player.roomId) {
        const room = rooms.get(player.roomId)
        if (room) {
          room.lastUpdate = Date.now()
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorHandler = createErrorHandler("PUT /api/rooms")
    return NextResponse.json(errorHandler(error))
  }
}

// DELETE - покинуть комнату
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerId } = body

    if (!playerId) {
      return NextResponse.json({ success: false, error: "Отсутствует ID игрока" })
    }

    const player = players.get(playerId)
    if (player && player.roomId) {
      const room = rooms.get(player.roomId)
      if (room) {
        room.players = room.players.filter((id) => id !== playerId)

        if (room.players.length === 0) {
          rooms.delete(player.roomId)
          console.log(`Room ${player.roomId} deleted - no players left`)
        } else if (room.hostId === playerId) {
          // Назначаем нового хоста
          room.hostId = room.players[0]
          const newHost = players.get(room.hostId)
          if (newHost) {
            newHost.isHost = true
            console.log(`New host assigned: ${room.hostId} for room ${player.roomId}`)
          }
        }
      }

      players.delete(playerId)
      console.log(`Player ${playerId} left room ${player.roomId}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorHandler = createErrorHandler("DELETE /api/rooms")
    return NextResponse.json(errorHandler(error))
  }
}
