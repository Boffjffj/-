"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "./auth-context"

interface GameSetupProps {
  onGameStart: () => void
  onShowOnline: () => void
  onShowProfile: () => void
}

export const GameSetup: React.FC<GameSetupProps> = ({ onGameStart, onShowOnline, onShowProfile }) => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center py-8">
      <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm border border-gray-800">
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-white">Мафия</h1>
            <p className="text-gray-300">Онлайн игра</p>
            {user && <p className="text-green-400 mt-2">Добро пожаловать, {user.nickname}!</p>}
          </div>

          <div className="space-y-4">
            <Button
              onClick={onGameStart}
              className="w-full h-14 text-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
            >
              Локальная игра
            </Button>

            <Button
              onClick={onShowOnline}
              className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              Онлайн игра
            </Button>

            <Button
              onClick={onShowProfile}
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
            >
              Профиль
            </Button>
          </div>

          <div className="text-center text-gray-400 text-sm">
            <p>Версия 1.0.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
