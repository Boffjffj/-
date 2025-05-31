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
  role?: string
  isAlive: boolean
}

interface GameRoom {
  id: string
  name: string
  hostId: string
  players: string[]
  maxPlayers: number
  minPlayers: number
  isPrivate: boolean
  password?: string
  status: "waiting" | "starting" | "playing" | "finished"
  gameState?: GameState
  lastUpdate: number
  createdAt: number
  chatMessages: ChatMessage[]
  autoStartTimer?: number
  autoStartTimestamp?: number
}

interface GameState {
  phase:
    | "day"
    | "voting"
    | "last-word"
    | "night"
    | "mafia-turn"
    | "sheriff-turn"
    | "doctor-turn"
    | "lover-turn"
    | "game-over"
  day: number
  timer: number | null
  votes: Record<string, string>
  selectedPlayer: string | null
  eliminatedPlayer: { id: string; name: string; role: string } | null
  killedPlayer: { id: string; name: string; role: string } | null
  winner: "mafia" | "civilians" | null
  checkedPlayers: Record<string, string>
  protectedPlayer: string | null
  sheriffChecked: string | null
  loverTarget: string | null
  seducedPlayer: string | null
  messages: GameMessage[]
  mafiaMessages: GameMessage[]
}

interface GameMessage {
  id: string
  playerId: string
  text: string
  timestamp: number
  isSystem?: boolean
}

interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: number
  type: "user" | "system" | "timer"
}

// Роли игры
const ROLES = ["civilian", "mafia", "sheriff", "doctor", "lover", "don"] as const
type Role = (typeof ROLES)[number]

// Очистка старых комнат и игроков
function cleanup() {
  const now = Date.now()
  const timeout = 30 * 60 * 1000 // 30 минут
  const maxRooms = 100

  for (const [playerId, player] of players.entries()) {
    if (now - player.lastSeen > timeout) {
      console.log(`🗑️ Removing inactive player: ${playerId}`)
      players.delete(playerId)

      if (player.roomId) {
        const room = rooms.get(player.roomId)
        if (room) {
          room.players = room.players.filter((id) => id !== playerId)

          room.chatMessages.push({
            id: `system-${Date.now()}`,
            sender: "Система",
            message: `Игрок ${player.name} отключился`,
            timestamp: Date.now(),
            type: "system",
          })

          if (room.players.length === 0) {
            console.log(`🗑️ Removing empty room: ${player.roomId}`)
            rooms.delete(player.roomId)
          } else if (room.hostId === playerId) {
            room.hostId = room.players[0]
            const newHost = players.get(room.hostId)
            if (newHost) {
              newHost.isHost = true
              console.log(`👑 New host assigned: ${room.hostId} for room ${player.roomId}`)
            }
          }
        }
      }
    }
  }

  for (const [roomId, room] of rooms.entries()) {
    if (room.players.length === 0 || now - room.lastUpdate > timeout) {
      console.log(`🗑️ Removing old/empty room: ${roomId}`)
      rooms.delete(roomId)
    }
  }

  if (rooms.size > maxRooms) {
    const sortedRooms = Array.from(rooms.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt)
    const roomsToDelete = sortedRooms.slice(0, rooms.size - maxRooms)

    for (const [roomId] of roomsToDelete) {
      rooms.delete(roomId)
      console.log(`🗑️ Removed old room due to limit: ${roomId}`)
    }
  }
}

// Назначение ролей
function assignRoles(playerIds: string[], playerCount: number): Record<string, Role> {
  const roles: Record<string, Role> = {}
  const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5)

  const mafiaCount = playerCount === 10 ? 3 : Math.max(1, Math.floor(playerCount / 4))
  let roleIndex = 0

  // Назначаем мафию
  for (let i = 0; i < mafiaCount; i++) {
    if (i === 0 && mafiaCount > 1) {
      roles[shuffledPlayers[roleIndex]] = "don"
    } else {
      roles[shuffledPlayers[roleIndex]] = "mafia"
    }
    roleIndex++
  }

  // Назначаем шерифа
  if (roleIndex < shuffledPlayers.length) {
    roles[shuffledPlayers[roleIndex]] = "sheriff"
    roleIndex++
  }

  // Назначаем доктора (если игроков больше 6)
  if (playerCount > 6 && roleIndex < shuffledPlayers.length) {
    roles[shuffledPlayers[roleIndex]] = "doctor"
    roleIndex++
  }

  // Назначаем любовницу (если игроков больше 8)
  if (playerCount > 8 && roleIndex < shuffledPlayers.length) {
    roles[shuffledPlayers[roleIndex]] = "lover"
    roleIndex++
  }

  // Остальные становятся мирными жителями
  for (let i = roleIndex; i < shuffledPlayers.length; i++) {
    roles[shuffledPlayers[i]] = "civilian"
  }

  return roles
}

// Запуск игры
function startGame(roomId: string) {
  const room = rooms.get(roomId)
  if (!room || room.status !== "waiting") return

  console.log(`🎮 Starting game in room ${roomId}`)

  // Назначаем роли
  const roleAssignments = assignRoles(room.players, room.players.length)

  // Обновляем роли игроков
  room.players.forEach((playerId) => {
    const player = players.get(playerId)
    if (player) {
      player.role = roleAssignments[playerId]
      player.isAlive = true
    }
  })

  // Создаем начальное состояние игры
  room.gameState = {
    phase: "day",
    day: 1,
    timer: 30,
    votes: {},
    selectedPlayer: null,
    eliminatedPlayer: null,
    killedPlayer: null,
    winner: null,
    checkedPlayers: {},
    protectedPlayer: null,
    sheriffChecked: null,
    loverTarget: null,
    seducedPlayer: null,
    messages: [
      {
        id: `system-${Date.now()}`,
        playerId: "system",
        text: "Игра началась! Наступил день 1. У вас 30 секунд на обсуждение.",
        timestamp: Date.now(),
        isSystem: true,
      },
    ],
    mafiaMessages: [],
  }

  room.status = "playing"
  room.autoStartTimer = undefined
  room.autoStartTimestamp = undefined

  // Добавляем системное сообщение о начале игры
  room.chatMessages.push({
    id: `system-${Date.now()}`,
    sender: "Система",
    message: "🎮 Игра началась! Всем игрокам назначены роли.",
    timestamp: Date.now(),
    type: "system",
  })

  console.log(`✅ Game started in room ${roomId} with ${room.players.length} players`)
}

// Проверка автозапуска
function checkAutoStart(roomId: string) {
  const room = rooms.get(roomId)
  if (!room || room.status !== "waiting") return

  const now = Date.now()

  // Если достаточно игроков и таймер не запущен
  if (room.players.length >= room.minPlayers && !room.autoStartTimer) {
    room.autoStartTimer = 15 // 15 секунд
    room.autoStartTimestamp = now

    room.chatMessages.push({
      id: `timer-${Date.now()}`,
      sender: "Система",
      message: "⏰ Набрано минимальное количество игроков! Игра начнется через 15 секунд...",
      timestamp: Date.now(),
      type: "timer",
    })

    console.log(`⏰ Auto-start timer started for room ${roomId}`)
  }
  // Если недостаточно игроков и таймер запущен
  else if (room.players.length < room.minPlayers && room.autoStartTimer) {
    room.autoStartTimer = undefined
    room.autoStartTimestamp = undefined

    room.chatMessages.push({
      id: `timer-${Date.now()}`,
      sender: "Система",
      message: "❌ Автозапуск отменен - недостаточно игроков",
      timestamp: Date.now(),
      type: "timer",
    })

    console.log(`❌ Auto-start timer cancelled for room ${roomId}`)
  }
  // Обновляем таймер
  else if (room.autoStartTimer && room.autoStartTimestamp) {
    const elapsed = Math.floor((now - room.autoStartTimestamp) / 1000)
    const remaining = Math.max(0, 15 - elapsed)

    if (remaining <= 0) {
      // Запускаем игру
      startGame(roomId)
    } else {
      room.autoStartTimer = remaining
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
      .slice(0, 50)

    console.log(`📊 GET /api/rooms - Returning ${publicRooms.length} rooms`)
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

    const contentLength = request.headers.get("content-length")
    if (contentLength && Number.parseInt(contentLength) > 1024) {
      return NextResponse.json({ success: false, error: "Слишком большой запрос" })
    }

    const body = await request.json()
    console.log("📨 POST /api/rooms - Received body:", body)

    const validationErrors = validateRoomData(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ success: false, error: validationErrors[0] })
    }

    const { action, playerName, roomName, maxPlayers, minPlayers, isPrivate, password, roomId, playerId } = body

    if (action === "create") {
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
        isAlive: true,
      }

      const room: GameRoom = {
        id: newRoomId,
        name: roomName.trim(),
        hostId: newPlayerId,
        players: [newPlayerId],
        maxPlayers: Math.min(Math.max(maxPlayers, 4), 10),
        minPlayers: Math.min(Math.max(minPlayers || 4, 4), 8),
        isPrivate: Boolean(isPrivate),
        password: isPrivate ? password?.trim() : undefined,
        status: "waiting",
        lastUpdate: Date.now(),
        createdAt: Date.now(),
        chatMessages: [
          {
            id: `system-${Date.now()}`,
            sender: "Система",
            message: `Добро пожаловать в комнату "${roomName.trim()}"!`,
            timestamp: Date.now(),
            type: "system",
          },
          {
            id: `system-${Date.now() + 1}`,
            sender: "Система",
            message: `Игрок ${playerName.trim()} создал комнату`,
            timestamp: Date.now(),
            type: "system",
          },
        ],
      }

      players.set(newPlayerId, player)
      rooms.set(newRoomId, room)

      // Проверяем автозапуск
      checkAutoStart(newRoomId)

      console.log(`🎉 Room created: ${newRoomId} by player ${newPlayerId} (${playerName})`)
      console.log(`👥 Players in room: ${room.players.length}`)

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

      console.log(`🎯 Attempting to join room: ${roomId}`)
      const room = rooms.get(roomId.trim())
      if (!room) {
        console.log(`❌ Room not found: ${roomId}`)
        return NextResponse.json({ success: false, error: "Комната не найдена" })
      }

      console.log(
        `🏠 Room found: ${room.name}, status: ${room.status}, players: ${room.players.length}/${room.maxPlayers}`,
      )

      if (room.isPrivate && room.password !== password?.trim()) {
        console.log(`❌ Invalid password for room: ${roomId}`)
        return NextResponse.json({ success: false, error: "Неверный пароль" })
      }

      if (room.players.length >= room.maxPlayers) {
        console.log(`❌ Room is full: ${roomId}`)
        return NextResponse.json({ success: false, error: "Комната заполнена" })
      }

      if (room.status !== "waiting") {
        console.log(`❌ Game already started in room: ${roomId}`)
        return NextResponse.json({ success: false, error: "Игра уже началась" })
      }

      const newPlayerId = playerId || generateId()

      if (room.players.includes(newPlayerId)) {
        console.log(`⚠️ Player ${newPlayerId} already in room ${roomId}`)
        const existingPlayer = players.get(newPlayerId)
        if (existingPlayer) {
          existingPlayer.lastSeen = Date.now()
        }
        return NextResponse.json({
          success: true,
          roomId,
          playerId: newPlayerId,
          isHost: room.hostId === newPlayerId,
        })
      }

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
        isAlive: true,
      }

      room.players.push(newPlayerId)
      room.lastUpdate = Date.now()
      players.set(newPlayerId, player)

      room.chatMessages.push({
        id: `system-${Date.now()}`,
        sender: "Система",
        message: `Игрок ${playerName.trim()} присоединился к игре`,
        timestamp: Date.now(),
        type: "system",
      })

      // Проверяем автозапуск
      checkAutoStart(roomId.trim())

      console.log(
        `🎉 Player ${newPlayerId} (${playerName}) joined room ${roomId}. Total players: ${room.players.length}`,
      )

      return NextResponse.json({
        success: true,
        roomId,
        playerId: newPlayerId,
        isHost: false,
      })
    }

    console.log(`❓ Unknown action: ${action}`)
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
          // Проверяем автозапуск при каждом heartbeat
          checkAutoStart(player.roomId)
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

        room.chatMessages.push({
          id: `system-${Date.now()}`,
          sender: "Система",
          message: `Игрок ${player.name} покинул комнату`,
          timestamp: Date.now(),
          type: "system",
        })

        if (room.players.length === 0) {
          rooms.delete(player.roomId)
          console.log(`🗑️ Room ${player.roomId} deleted - no players left`)
        } else {
          // Проверяем автозапуск после выхода игрока
          checkAutoStart(player.roomId)

          if (room.hostId === playerId) {
            room.hostId = room.players[0]
            const newHost = players.get(room.hostId)
            if (newHost) {
              newHost.isHost = true
              console.log(`👑 New host assigned: ${room.hostId} for room ${player.roomId}`)
            }
          }
        }
      }

      players.delete(playerId)
      console.log(`👋 Player ${playerId} left room ${player.roomId}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorHandler = createErrorHandler("DELETE /api/rooms")
    return NextResponse.json(errorHandler(error))
  }
}

// Экспортируем функции для получения данных
export function getRoomData(roomId: string) {
  const room = rooms.get(roomId)
  if (!room) return null

  // Обновляем таймер автозапуска
  checkAutoStart(roomId)

  const roomPlayers = room.players
    .map((pid) => {
      const p = players.get(pid)
      return p
        ? {
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            isConnected: Date.now() - p.lastSeen < 10000,
            role: p.role,
            isAlive: p.isAlive,
          }
        : null
    })
    .filter(Boolean)

  return {
    roomInfo: {
      id: room.id,
      name: room.name,
      maxPlayers: room.maxPlayers,
      minPlayers: room.minPlayers,
      isPrivate: room.isPrivate,
      status: room.status,
      autoStartTimer: room.autoStartTimer,
    },
    players: roomPlayers,
    chatMessages: room.chatMessages,
    gameState: room.gameState,
  }
}

export function addChatMessage(roomId: string, sender: string, message: string) {
  const room = rooms.get(roomId)
  if (!room) return false

  const chatMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random()}`,
    sender,
    message,
    timestamp: Date.now(),
    type: "user",
  }

  room.chatMessages.push(chatMessage)
  room.lastUpdate = Date.now()

  console.log(`💬 Added chat message in room ${roomId}: ${sender}: ${message}`)
  return true
}
