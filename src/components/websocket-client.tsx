"use client"

import React from "react"

interface WebSocketMessage {
  type: string
  data?: any
  roomId?: string
  playerId?: string
}

interface WebSocketContextType {
  ws: WebSocket | null
  isConnected: boolean
  sendMessage: (message: WebSocketMessage) => void
  connect: () => void
  disconnect: () => void
  connectionState: "disconnected" | "connecting" | "connected" | "error"
}

const WebSocketContext = React.createContext<WebSocketContextType | undefined>(undefined)

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ws, setWs] = React.useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = React.useState(false)
  const [connectionState, setConnectionState] = React.useState<"disconnected" | "connecting" | "connected" | "error">(
    "disconnected",
  )

  // Используем ref для предотвращения повторных подключений
  const isConnectingRef = React.useRef(false)
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout>()

  const disconnect = React.useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (ws) {
      ws.close()
    }

    setWs(null)
    setIsConnected(false)
    setConnectionState("disconnected")
    isConnectingRef.current = false
  }, [ws])

  const handleMockResponse = React.useCallback((message: WebSocketMessage) => {
    // Имитация ответов сервера
    switch (message.type) {
      case "create":
        window.dispatchEvent(
          new CustomEvent("websocket-message", {
            detail: {
              type: "create",
              data: { roomId: "MOCK" + Math.random().toString(36).substring(2, 6).toUpperCase() },
            },
          }),
        )
        break
      case "join":
        window.dispatchEvent(
          new CustomEvent("websocket-message", {
            detail: { type: "join", data: { success: true, roomId: message.roomId } },
          }),
        )
        break
      case "roomList":
        window.dispatchEvent(
          new CustomEvent("websocket-message", {
            detail: {
              type: "roomList",
              data: [
                { id: "ROOM1", name: "Комната новичков", players: { size: 3 }, maxPlayers: 8, status: "waiting" },
                { id: "ROOM2", name: "Профи игра", players: { size: 5 }, maxPlayers: 10, status: "waiting" },
              ],
            },
          }),
        )
        break
    }
  }, [])

  const connect = React.useCallback(() => {
    // Предотвращаем множественные подключения
    if (isConnectingRef.current || ws?.readyState === WebSocket.OPEN) {
      return
    }

    isConnectingRef.current = true
    setConnectionState("connecting")

    try {
      // В реальном приложении это был бы WebSocket URL
      // Для демонстрации используем простую имитацию
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: (data: string) => {
          console.log("WebSocket send:", data)
          // Имитируем ответ сервера с задержкой
          setTimeout(() => {
            try {
              const message = JSON.parse(data)
              handleMockResponse(message)
            } catch (error) {
              console.error("Error parsing message:", error)
            }
          }, 100)
        },
        close: () => {
          setIsConnected(false)
          setWs(null)
          setConnectionState("disconnected")
          isConnectingRef.current = false
        },
        addEventListener: () => {},
        removeEventListener: () => {},
      } as unknown as WebSocket

      setWs(mockWs)
      setIsConnected(true)
      setConnectionState("connected")
      isConnectingRef.current = false
    } catch (error) {
      console.error("WebSocket connection error:", error)
      setConnectionState("error")
      isConnectingRef.current = false

      // Автоматическое переподключение через 5 секунд
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isConnectingRef.current) {
          connect()
        }
      }, 5000)
    }
  }, [handleMockResponse, ws])

  const sendMessage = React.useCallback(
    (message: WebSocketMessage) => {
      if (ws && isConnected && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(message))
        } catch (error) {
          console.error("Error sending message:", error)
          setConnectionState("error")
        }
      } else {
        console.warn("WebSocket is not connected. Message not sent:", message)
      }
    },
    [ws, isConnected],
  )

  // Подключаемся только один раз при монтировании
  React.useEffect(() => {
    connect()

    // Cleanup при размонтировании
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (ws) {
        ws.close()
      }
      isConnectingRef.current = false
    }
  }, []) // Пустой массив зависимостей

  const value = React.useMemo(
    () => ({
      ws,
      isConnected,
      sendMessage,
      connect,
      disconnect,
      connectionState,
    }),
    [ws, isConnected, sendMessage, connect, disconnect, connectionState],
  )

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

export const useWebSocket = () => {
  const context = React.useContext(WebSocketContext)
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider")
  }
  return context
}
