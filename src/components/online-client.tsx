"use client"

import React from "react"

interface OnlineContextType {
  isConnected: boolean
  roomId: string | null
  playerId: string | null
  isHost: boolean
  createRoom: (roomName: string, maxPlayers: number, isPrivate: boolean, password?: string) => Promise<string>
  joinRoom: (roomId: string, playerName: string, password?: string) => Promise<boolean>
  leaveRoom: () => Promise<void>
  getRooms: () => Promise<any[]>
  updateGameState: (gameState: any) => Promise<void>
  getGameState: () => Promise<any>
}

const OnlineContext = React.createContext<OnlineContextType | undefined>(undefined)

export const OnlineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = React.useState(false)
  const [roomId, setRoomId] = React.useState<string | null>(null)
  const [playerId, setPlayerId] = React.useState<string | null>(null)
  const [isHost, setIsHost] = React.useState(false)

  // Heartbeat для поддержания соединения
  React.useEffect(() => {
    if (!playerId) return

    const interval = setInterval(async () => {
      try {
        await fetch("/api/rooms", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        })
      } catch (error) {
        console.error("Heartbeat failed:", error)
      }
    }, 1000) // каждую секунду

    return () => clearInterval(interval)
  }, [playerId])

  const createRoom = async (
    roomName: string,
    maxPlayers: number,
    isPrivate: boolean,
    password?: string,
  ): Promise<string> => {
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          playerName: "Host", // Временно
          roomName,
          maxPlayers,
          isPrivate,
          password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setRoomId(data.roomId)
        setPlayerId(data.playerId)
        setIsHost(data.isHost)
        setIsConnected(true)
        return data.roomId
      } else {
        throw new Error(data.error || "Ошибка создания комнаты")
      }
    } catch (error) {
      console.error("Create room error:", error)
      throw error
    }
  }

  const joinRoom = async (targetRoomId: string, playerName: string, password?: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          roomId: targetRoomId,
          playerName,
          password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setRoomId(data.roomId)
        setPlayerId(data.playerId)
        setIsHost(data.isHost)
        setIsConnected(true)
        return true
      } else {
        throw new Error(data.error || "Ошибка присоединения")
      }
    } catch (error) {
      console.error("Join room error:", error)
      return false
    }
  }

  const leaveRoom = async (): Promise<void> => {
    if (!playerId) return

    try {
      await fetch("/api/rooms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      })
    } catch (error) {
      console.error("Leave room error:", error)
    } finally {
      setRoomId(null)
      setPlayerId(null)
      setIsHost(false)
      setIsConnected(false)
    }
  }

  const getRooms = async (): Promise<any[]> => {
    try {
      const response = await fetch("/api/rooms")
      const data = await response.json()
      return data.rooms || []
    } catch (error) {
      console.error("Get rooms error:", error)
      return []
    }
  }

  const updateGameState = async (gameState: any): Promise<void> => {
    if (!roomId || !playerId) return

    try {
      await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          playerId,
          gameState,
        }),
      })
    } catch (error) {
      console.error("Update game state error:", error)
    }
  }

  const getGameState = async (): Promise<any> => {
    if (!roomId || !playerId) return null

    try {
      const response = await fetch(`/api/game?roomId=${roomId}&playerId=${playerId}`)
      const data = await response.json()
      return data.success ? data : null
    } catch (error) {
      console.error("Get game state error:", error)
      return null
    }
  }

  return (
    <OnlineContext.Provider
      value={{
        isConnected,
        roomId,
        playerId,
        isHost,
        createRoom,
        joinRoom,
        leaveRoom,
        getRooms,
        updateGameState,
        getGameState,
      }}
    >
      {children}
    </OnlineContext.Provider>
  )
}

export const useOnline = () => {
  const context = React.useContext(OnlineContext)
  if (!context) {
    throw new Error("useOnline must be used within OnlineProvider")
  }
  return context
}
