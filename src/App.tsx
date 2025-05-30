"use client"

import React from "react"
import { GameProvider } from "./components/game-context"
import { OnlineProvider } from "./components/online-client"
import { AuthProvider } from "./components/auth-context"
import { GameSetup } from "./components/game-setup"
import { GameBoard } from "./components/game-board"
import { OnlineMenu } from "./components/online-menu"
import GameLobby from "./components/game-lobby"
import { AuthScreen } from "./components/auth-screen"
import { ProfileScreen } from "./components/profile-screen"
import { useGame } from "./components/game-context"
import { useAuth } from "./components/auth-context"

function AppContent() {
  const { state } = useGame()
  const { user, isAuthenticated } = useAuth()
  const [currentScreen, setCurrentScreen] = React.useState<"menu" | "online" | "lobby" | "game" | "profile">("menu")
  const [isLoading, setIsLoading] = React.useState(false)

  // Проверяем сохраненную сессию только если пользователь авторизован
  React.useEffect(() => {
    if (!isAuthenticated) return

    const roomId = localStorage.getItem("mafia_room_id")
    const playerId = localStorage.getItem("mafia_player_id")
    const playerName = localStorage.getItem("mafia_player_name")

    if (roomId && playerId && playerName) {
      // Если есть сохраненная сессия, показываем лобби
      setCurrentScreen("lobby")
    }
  }, [isAuthenticated])

  // Отслеживаем изменения фазы игры
  React.useEffect(() => {
    if (state.phase !== "setup" && state.players.length > 0) {
      setCurrentScreen("game")
    }
  }, [state.phase, state.players])

  const handleGameStart = () => {
    setCurrentScreen("game")
  }

  const handleShowOnline = () => {
    setCurrentScreen("online")
  }

  const handleShowProfile = () => {
    setCurrentScreen("profile")
  }

  const handleOnlineGameStart = () => {
    // После создания/присоединения к комнате показываем лобби
    setCurrentScreen("lobby")
  }

  const handleLeaveRoom = () => {
    // Очищаем данные о комнате при выходе
    localStorage.removeItem("mafia_player_id")
    localStorage.removeItem("mafia_room_id")
    localStorage.removeItem("mafia_is_host")
    localStorage.removeItem("mafia_player_name")
    setCurrentScreen("menu")
  }

  const handleBackToMenu = () => {
    setCurrentScreen("menu")
  }

  // Если пользователь не авторизован, показываем экран входа
  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Аватарка в углу */}
      <div className="fixed top-4 right-4 z-50">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-danger-500 to-danger-700 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">{user?.nickname?.charAt(0).toUpperCase() || "М"}</span>
        </div>
      </div>

      {currentScreen === "profile" ? (
        <ProfileScreen onBack={handleBackToMenu} />
      ) : currentScreen === "lobby" ? (
        <GameLobby onGameStart={handleGameStart} onLeaveRoom={handleLeaveRoom} />
      ) : currentScreen === "online" ? (
        <OnlineMenu onBack={handleBackToMenu} onGameStart={handleOnlineGameStart} />
      ) : currentScreen === "game" ? (
        <div className="container mx-auto px-4 py-6">
          <GameBoard onLeaveRoom={handleLeaveRoom} />
        </div>
      ) : (
        <GameSetup onGameStart={handleGameStart} onShowOnline={handleShowOnline} onShowProfile={handleShowProfile} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <OnlineProvider>
        <GameProvider>
          <AppContent />
        </GameProvider>
      </OnlineProvider>
    </AuthProvider>
  )
}
