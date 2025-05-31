import { type NextRequest, NextResponse } from "next/server"
import { getRoomData, addChatMessage } from "../rooms/route"

// GET - получить состояние лобби
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")
    const playerId = searchParams.get("playerId")

    console.log(`📊 GET /api/lobby - roomId: ${roomId}, playerId: ${playerId}`)

    if (!roomId || !playerId) {
      return NextResponse.json({ success: false, error: "Отсутствуют параметры" })
    }

    const roomData = getRoomData(roomId)
    if (!roomData) {
      return NextResponse.json({ success: false, error: "Комната не найдена" })
    }

    console.log(`📤 Returning lobby data for room ${roomId}:`, {
      playersCount: roomData.players.length,
      messagesCount: roomData.chatMessages.length,
    })

    return NextResponse.json({
      success: true,
      data: roomData,
    })
  } catch (error) {
    console.error("❌ GET /api/lobby error:", error)
    return NextResponse.json({ success: false, error: "Ошибка сервера" })
  }
}

// POST - отправить сообщение в чат лобби
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, playerId, sender, message } = body

    console.log(`💬 POST /api/lobby - Chat message from ${sender} in room ${roomId}`)

    if (!roomId || !playerId || !sender || !message?.trim()) {
      return NextResponse.json({ success: false, error: "Отсутствуют обязательные поля" })
    }

    const success = addChatMessage(roomId, sender, message.trim())
    if (!success) {
      return NextResponse.json({ success: false, error: "Комната не найдена" })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ POST /api/lobby error:", error)
    return NextResponse.json({ success: false, error: "Ошибка сервера" })
  }
}
