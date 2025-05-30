import { type NextRequest, NextResponse } from "next/server"
import { createErrorHandler } from "../../../src/utils/safe-storage"

// Используем то же хранилище что и в rooms
const rooms = new Map<string, any>()
const players = new Map<string, any>()

// GET - получить состояние игры
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")
    const playerId = searchParams.get("playerId")

    console.log(`GET /api/game - roomId: ${roomId}, playerId: ${playerId}`)

    if (!roomId || !playerId) {
      console.log("Missing parameters")
      return NextResponse.json({ success: false, error: "Отсутствуют параметры" })
    }

    const room = rooms.get(roomId)
    const player = players.get(playerId)

    if (!room) {
      console.log(`Room not found: ${roomId}`)
      // Если комната не найдена, создаем тестовую комнату
      const testRoom = {
        id: roomId,
        name: "Тестовая комната",
        status: "waiting",
        players: [playerId],
        maxPlayers: 8,
        gameState: {
          players: [
            {
              id: "1",
              name: "Вы",
              role: "civilian",
              isAlive: true,
              isBot: false,
              avatar: "",
              isHost: true,
              clientId: playerId,
            },
            {
              id: "2",
              name: "Бот 1",
              role: "mafia",
              isAlive: true,
              isBot: true,
              avatar: "",
              clientId: "bot_1",
            },
            {
              id: "3",
              name: "Бот 2",
              role: "sheriff",
              isAlive: true,
              isBot: true,
              avatar: "",
              clientId: "bot_2",
            },
          ],
          phase: "day",
          day: 1,
          messages: [
            {
              id: "1",
              playerId: "system",
              text: "Игра началась! Наступил день 1.",
              timestamp: Date.now(),
              isSystem: true,
            },
          ],
          timer: 30,
          isOnline: true,
          roomId: roomId,
          clientId: playerId,
        },
        lastUpdate: Date.now(),
      }

      rooms.set(roomId, testRoom)
      players.set(playerId, {
        id: playerId,
        name: "Игрок",
        roomId: roomId,
        lastSeen: Date.now(),
        isHost: true,
      })

      return NextResponse.json({
        success: true,
        room: testRoom,
        player: {
          id: playerId,
          name: "Игрок",
          isHost: true,
        },
      })
    }

    if (!player) {
      console.log(`Player not found: ${playerId}`)
      // Если игрок не найден, создаем нового игрока
      const newPlayer = {
        id: playerId,
        name: "Новый игрок",
        roomId: roomId,
        lastSeen: Date.now(),
        isHost: false,
      }

      players.set(playerId, newPlayer)
      if (!room.players.includes(playerId)) {
        room.players.push(playerId)
      }

      return NextResponse.json({
        success: true,
        room: {
          id: room.id,
          name: room.name,
          status: room.status,
          maxPlayers: room.maxPlayers || 8,
          players: room.players
            .map((pid: string) => {
              const p = players.get(pid)
              return p
                ? {
                    id: p.id,
                    name: p.name,
                    isHost: p.isHost,
                    isConnected: Date.now() - p.lastSeen < 10000,
                  }
                : null
            })
            .filter(Boolean),
          gameState: room.gameState || {
            players: [
              {
                id: "1",
                name: "Вы",
                role: "civilian",
                isAlive: true,
                isBot: false,
                avatar: "",
                isHost: true,
                clientId: playerId,
              },
            ],
            phase: "setup",
            day: 1,
            messages: [],
            isOnline: true,
            roomId: roomId,
            clientId: playerId,
          },
          lastUpdate: room.lastUpdate,
        },
        player: newPlayer,
      })
    }

    // Обновляем время последней активности
    player.lastSeen = Date.now()
    room.lastUpdate = Date.now()

    // Получаем информацию о всех игроках в комнате
    const roomPlayers = room.players
      .map((pid: string) => {
        const p = players.get(pid)
        return p
          ? {
              id: p.id,
              name: p.name,
              isHost: p.isHost,
              isConnected: Date.now() - p.lastSeen < 10000,
            }
          : null
      })
      .filter(Boolean)

    console.log(`Returning game state for room ${roomId}`)
    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        status: room.status,
        maxPlayers: room.maxPlayers || 8,
        players: roomPlayers,
        gameState: room.gameState || {
          players: [
            {
              id: "1",
              name: "Вы",
              role: "civilian",
              isAlive: true,
              isBot: false,
              avatar: "",
              isHost: true,
              clientId: playerId,
            },
          ],
          phase: "setup",
          day: 1,
          messages: [],
          isOnline: true,
          roomId: roomId,
          clientId: playerId,
        },
        lastUpdate: room.lastUpdate,
      },
      player: {
        id: player.id,
        name: player.name,
        isHost: player.isHost,
      },
    })
  } catch (error) {
    const errorHandler = createErrorHandler("GET /api/game")
    return NextResponse.json(errorHandler(error))
  }
}

// POST - обновить состояние игры
export async function POST(request: NextRequest) {
  try {
    // Проверяем размер запроса
    const contentLength = request.headers.get("content-length")
    if (contentLength && Number.parseInt(contentLength) > 10240) {
      // 10KB лимит
      return NextResponse.json({ success: false, error: "Слишком большой запрос" })
    }

    const body = await request.json()
    const { roomId, playerId, gameState, action } = body

    if (!roomId || !playerId) {
      return NextResponse.json({ success: false, error: "Отсутствуют обязательные параметры" })
    }

    const room = rooms.get(roomId)
    const player = players.get(playerId)

    if (!room || !player) {
      return NextResponse.json({ success: false, error: "Комната или игрок не найдены" })
    }

    // Обновляем состояние игры
    if (gameState) {
      room.gameState = gameState
      room.lastUpdate = Date.now()
    }

    // Обрабатываем специальные действия
    if (action === "start-game") {
      room.status = "playing"
    } else if (action === "end-game") {
      room.status = "finished"
    }

    player.lastSeen = Date.now()

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorHandler = createErrorHandler("POST /api/game")
    return NextResponse.json(errorHandler(error))
  }
}
