"use client"

import React from "react"
import {
  Button,
  Card,
  Avatar,
  Badge,
  Input,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider,
} from "@heroui/react"
import { useGame } from "./game-context"

// Иконки остаются теми же...
const UserIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
)

const SkullIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 2C5.58 2 2 5.58 2 10c0 2.03.76 3.88 2 5.29V17a1 1 0 001 1h10a1 1 0 001-1v-1.71c1.24-1.41 2-3.26 2-5.29 0-4.42-3.58-8-8-8zM7 11a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z"
      clipRule="evenodd"
    />
  </svg>
)

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
)

const HeartIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
      clipRule="evenodd"
    />
  </svg>
)

const MedicalIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 14a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 7.618V9a1 1 0 11-2 0V7.618L6.237 6.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 14a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
      clipRule="evenodd"
    />
  </svg>
)

const CrownIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M5 2a1 1 0 000 2v6a1 1 0 001 1h1a1 1 0 100-2v-1h5v1a1 1 0 100 2h1a1 1 0 001-1V4a1 1 0 100-2H5zM4 15a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z"
      clipRule="evenodd"
    />
  </svg>
)

const SendIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
)

const ThumbsDownIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9a1 1 0 00-1-1H9c-.6 0-1 .4-1 1v3c0 .6.4 1 1 1h4a1 1 0 001-1V9zM9 15a1 1 0 100 2h4a1 1 0 100-2H9z" />
  </svg>
)

const TargetIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
      clipRule="evenodd"
    />
  </svg>
)

const ProtectIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-7-4z" clipRule="evenodd" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
      clipRule="evenodd"
    />
  </svg>
)

const SeduceIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
      clipRule="evenodd"
    />
  </svg>
)

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
)

const ExitIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
      clipRule="evenodd"
    />
  </svg>
)

interface GameBoardProps {
  onLeaveRoom: () => void
}

export const GameBoard: React.FC<GameBoardProps> = ({ onLeaveRoom }) => {
  const {
    state,
    selectPlayer,
    sendMessage,
    vote,
    nextPhase,
    leaveRoom,
    doctorProtect,
    sheriffCheck,
    loverSeduce,
    donCheck,
    setState,
  } = useGame()
  const [message, setMessage] = React.useState("")
  const [activeChat, setActiveChat] = React.useState<"public" | "mafia">("public")
  const chatRef = React.useRef<HTMLDivElement>(null)
  const mafiaRef = React.useRef<HTMLDivElement>(null)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  // Добавим кнопку для обновления состояния игры в онлайн-режиме
  // Найдем место в компоненте, где отображается информация о фазе игры
  // и добавим кнопку обновления для онлайн-режима

  // В начале компонента добавим состояние для отслеживания обновлений
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Добавим функцию для обновления состояния игры
  const updateGameState = async () => {
    if (!state.isOnline) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/game?roomId=${state.roomId}&playerId=${state.clientId}`)
      const data = await response.json()

      if (data.success && data.room && data.room.gameState) {
        // Обновляем состояние игры из полученных данных
        setState((prev) => ({
          ...prev,
          ...data.room.gameState,
          // Принудительно обновляем игроков
          players: data.room.gameState.players || prev.players,
        }))
      }
    } catch (error) {
      console.error("Ошибка обновления состояния игры:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Добавляем автоматическую синхронизацию каждую секунду
  React.useEffect(() => {
    if (state.isOnline) {
      const syncInterval = setInterval(() => {
        updateGameState()
      }, 1000)

      return () => clearInterval(syncInterval)
    }
  }, [state.isOnline])

  // Прокрутка чата вниз при новых сообщениях
  React.useEffect(() => {
    if (chatRef.current && state?.messages) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [state?.messages])

  if (!state || !state.messages || !state.players) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-danger-500 mx-auto"></div>
          <p className="mt-4 text-white">Загрузка игры...</p>
        </div>
      </div>
    )
  }

  // Получение информации о текущей фазе
  const getPhaseInfo = (): { title: string; description: string } => {
    switch (state.phase) {
      case "day":
        return {
          title: `День ${state.day}`,
          description:
            state.timer !== null
              ? `Обсудите, кто может быть мафией. Осталось: ${state.timer} сек.`
              : "Обсудите, кто может быть мафией.",
        }
      case "voting":
        return {
          title: "Голосование",
          description:
            state.timer !== null
              ? `Выберите, кого вы считаете мафией. Осталось: ${state.timer} сек.`
              : "Выберите, кого вы считаете мафией.",
        }
      case "last-word":
        return {
          title: "Последнее слово",
          description:
            state.timer !== null
              ? `${state.eliminatedPlayer?.name} может сказать последнее слово. Осталось: ${state.timer} сек.`
              : `${state.eliminatedPlayer?.name} говорит последнее слово.`,
        }
      case "mafia-turn":
        return {
          title: "Ход мафии",
          description:
            state.timer !== null ? `Мафия выбирает жертву. Осталось: ${state.timer} сек.` : "Мафия выбирает жертву.",
        }
      case "sheriff-turn":
        return {
          title: "Ход шерифа",
          description:
            state.timer !== null ? `Шериф проверяет игрока. Осталось: ${state.timer} сек.` : "Шериф проверяет игрока.",
        }
      case "doctor-turn":
        return {
          title: "Ход доктора",
          description:
            state.timer !== null ? `Доктор защищает игрока. Осталось: ${state.timer} сек.` : "Доктор защищает игрока.",
        }
      case "lover-turn":
        return {
          title: "Ход любовницы",
          description:
            state.timer !== null
              ? `Любовница соблазняет игрока. Осталось: ${state.timer} сек.`
              : "Любовница соблазняет игрока.",
        }
      case "night":
        return {
          title: "Ночь",
          description: "Город засыпает...",
        }
      case "game-over":
        return {
          title: "Игра окончена",
          description: state.winner === "mafia" ? "Мафия победила!" : "Мирные жители победили!",
        }
      default:
        return {
          title: "Мафия",
          description: "Социально-психологическая ролевая игра",
        }
    }
  }

  // Получение информации о роли игрока
  const getPlayerRole = () => {
    const player = state.players.find((p) => p.clientId === state.clientId)
    if (!player) return null

    return {
      role: player.role,
      name: getRoleName(player.role),
      description: getRoleDescription(player.role),
      icon: getRoleIcon(player.role),
    }
  }

  // Получение названия роли
  const getRoleName = (role: string): string => {
    switch (role) {
      case "civilian":
        return "Мирный житель"
      case "mafia":
        return "Мафия"
      case "sheriff":
        return "Шериф"
      case "doctor":
        return "Доктор"
      case "lover":
        return "Любовница"
      case "don":
        return "Дон мафии"
      default:
        return "Неизвестно"
    }
  }

  // Получение описания роли
  const getRoleDescription = (role: string): string => {
    switch (role) {
      case "civilian":
        return "Ваша задача - вычислить и устранить мафию путем голосования."
      case "mafia":
        return "Ваша задача - устранить всех мирных жителей, оставаясь незамеченным."
      case "sheriff":
        return "Каждую ночь вы можете проверить одного игрока и узнать его роль."
      case "doctor":
        return "Каждую ночь вы можете защитить одного игрока от убийства мафии."
      case "lover":
        return "Каждую ночь вы можете соблазнить игрока, лишив его права голоса и способностей."
      case "don":
        return "Вы глава мафии. Шериф видит вас как мирного жителя. Можете проверять игроков."
      default:
        return ""
    }
  }

  // Получение иконки роли
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "civilian":
        return <UserIcon />
      case "mafia":
        return <SkullIcon />
      case "sheriff":
        return <ShieldIcon />
      case "doctor":
        return <MedicalIcon />
      case "lover":
        return <HeartIcon />
      case "don":
        return <CrownIcon />
      default:
        return <UserIcon />
    }
  }

  // Получение цвета роли
  const getRoleColor = (role: string): "primary" | "danger" | "warning" | "success" | "secondary" | "default" => {
    switch (role) {
      case "civilian":
        return "primary"
      case "mafia":
        return "danger"
      case "sheriff":
        return "warning"
      case "doctor":
        return "success"
      case "lover":
        return "secondary"
      case "don":
        return "danger"
      default:
        return "default"
    }
  }

  // Обработка отправки сообщения
  const handleSendMessage = (isMafiaChat = false) => {
    if (!message.trim()) return
    sendMessage(message, isMafiaChat)
    setMessage("")
  }

  // Обработка нажатия Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage(activeChat === "mafia")
    }
  }

  // Обработка выхода из комнаты
  const handleLeaveRoom = () => {
    leaveRoom()
    onLeaveRoom()
  }

  // Получение информации о фазе
  const phaseInfo = getPhaseInfo()

  // Получение информации о роли игрока
  const playerRole = getPlayerRole()

  // Проверки возможностей игрока
  const currentPlayer = state.players.find((p) => p.clientId === state.clientId)
  const canVote = state.phase === "voting" && currentPlayer?.isAlive && currentPlayer?.canVote
  const canSelectTarget =
    state.phase === "mafia-turn" &&
    (currentPlayer?.role === "mafia" || currentPlayer?.role === "don") &&
    currentPlayer?.isAlive
  const canSheriffCheck =
    state.phase === "sheriff-turn" &&
    currentPlayer?.role === "sheriff" &&
    currentPlayer?.isAlive &&
    currentPlayer?.canUseAbility
  const canDonCheck =
    state.phase === "night" && currentPlayer?.role === "don" && currentPlayer?.isAlive && currentPlayer?.canUseAbility
  const canDoctorProtect =
    state.phase === "doctor-turn" &&
    currentPlayer?.role === "doctor" &&
    currentPlayer?.isAlive &&
    currentPlayer?.canUseAbility
  const canLoverSeduce = state.phase === "lover-turn" && currentPlayer?.role === "lover" && currentPlayer?.isAlive
  const canChat =
    (state.phase === "day" && currentPlayer?.isAlive) ||
    (state.phase === "last-word" && state.eliminatedPlayer?.id === currentPlayer?.id)
  const canMafiaChat = (currentPlayer?.role === "mafia" || currentPlayer?.role === "don") && currentPlayer?.isAlive
  const isMafia = currentPlayer?.role === "mafia" || currentPlayer?.role === "don"

  // Получение ID игрока
  const playerId = currentPlayer?.id

  // Получение игрока, за которого проголосовал текущий игрок
  const votedFor = playerId ? state.votes[playerId] : null

  // Проверка, мертв ли игрок
  const isPlayerDead = !currentPlayer?.isAlive

  // Функция для получения класса роли для тестового режима
  const getRoleClass = (role: string): string => {
    switch (role) {
      case "civilian":
        return "bg-primary-900/50 text-primary-200"
      case "mafia":
        return "bg-danger-900/50 text-danger-200"
      case "sheriff":
        return "bg-warning-900/50 text-warning-200"
      case "doctor":
        return "bg-success-900/50 text-success-200"
      case "lover":
        return "bg-secondary-900/50 text-secondary-200"
      case "don":
        return "bg-danger-900/50 text-danger-200"
      default:
        return "bg-gray-900/50 text-gray-200"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Левая колонка - информация об игре */}
      <div className="md:col-span-1 space-y-4">
        {/* Информация о фазе */}
        <Card className="p-4 bg-black/50 backdrop-blur-sm border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">{phaseInfo.title}</h3>
            <Badge color={state.phase === "game-over" ? (state.winner === "mafia" ? "danger" : "success") : "primary"}>
              {state.phase === "game-over"
                ? state.winner === "mafia"
                  ? "Победа мафии"
                  : "Победа мирных"
                : "В процессе"}
            </Badge>
          </div>
          <p className="text-sm text-white">{phaseInfo.description}</p>

          {/* Индикатор таймера */}
          {state.timer !== null && (
            <div className="mt-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${state.timer < 5 ? "bg-danger" : "bg-danger-500"}`}
                  style={{
                    width: `${
                      state.phase === "day"
                        ? (state.timer / 30) * 100
                        : state.phase === "voting"
                          ? (state.timer / 15) * 100
                          : state.phase === "last-word"
                            ? (state.timer / 30) * 100
                            : (state.timer / 10) * 100
                    }%`,
                  }}
                ></div>
              </div>
              <p className="text-center text-sm mt-1 text-danger-400 font-medium">{state.timer} сек</p>
            </div>
          )}

          {/* Кнопка действия в зависимости от фазы */}
          {state.phase === "day" && !isPlayerDead && (
            <Button color="danger" variant="flat" size="sm" className="mt-3 w-full" onPress={nextPhase}>
              Перейти к голосованию
            </Button>
          )}

          {(state.phase === "game-over" || isPlayerDead) && (
            <Button
              color="danger"
              variant="flat"
              size="sm"
              className="mt-3 w-full"
              onPress={handleLeaveRoom}
              startContent={<ExitIcon />}
            >
              Выйти из комнаты
            </Button>
          )}

          {/* Онлайн статус */}
          {state.isOnline && (
            <div className="mt-3 text-center">
              <Badge color="success" size="sm">
                Онлайн: {state.roomId}
              </Badge>
              {/* Добавляем кнопку обновления */}
              <Button
                size="sm"
                color="primary"
                variant="flat"
                className="mt-2 w-full"
                onPress={updateGameState}
                isLoading={isUpdating}
              >
                Обновить состояние
              </Button>
            </div>
          )}
        </Card>

        {/* Информация о роли игрока */}
        {playerRole && (
          <Card className="p-4 bg-black/50 backdrop-blur-sm border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-full bg-${getRoleColor(playerRole.role)}-900/50`}>
                <div className={`text-${getRoleColor(playerRole.role)}-200`}>{playerRole.icon}</div>
              </div>
              <div>
                <h3 className="font-semibold text-white">Ваша роль</h3>
                <p className={`text-${getRoleColor(playerRole.role)}-200 font-medium`}>{playerRole.name}</p>
              </div>
            </div>
            <p className="text-sm text-white">{playerRole.description}</p>

            {/* Дополнительная информация для специальных ролей */}
            {(playerRole.role === "sheriff" || playerRole.role === "don") &&
              Object.keys(state.checkedPlayers).length > 0 && (
                <div className="mt-3 p-2 bg-warning-900/20 rounded-lg border border-warning-800">
                  <p className="text-sm text-warning-400 mb-1">Проверенные игроки:</p>
                  {Object.entries(state.checkedPlayers).map(([playerId, role]) => {
                    const player = state.players.find((p) => p.id === Number(playerId))
                    return (
                      <p key={playerId} className="text-xs text-white">
                        {player?.name}:{" "}
                        {playerRole.role === "don" && role === "sheriff" ? "Мирный житель" : getRoleName(role)}
                      </p>
                    )
                  })}
                </div>
              )}

            {/* Показываем эффект соблазнения */}
            {currentPlayer?.isSeduced && (
              <div className="mt-3 p-2 bg-secondary-900/20 rounded-lg border border-secondary-800">
                <p className="text-sm text-secondary-400">
                  💋 Вы соблазнены! Не можете голосовать и использовать способности.
                </p>
              </div>
            )}

            <Button
              size="sm"
              variant="light"
              className="mt-3 text-danger-400"
              onPress={onOpen}
              startContent={<InfoIcon />}
            >
              Подробнее о ролях
            </Button>
          </Card>
        )}

        {/* Показываем статус игрока если он мертв */}
        {isPlayerDead && state.phase !== "last-word" && (
          <Card className="p-4 bg-red-900/20 backdrop-blur-sm border border-red-800">
            <div className="text-center">
              <div className="text-red-400 mb-2">
                <SkullIcon />
              </div>
              <h3 className="font-semibold text-red-400 mb-2">Вы мертвы</h3>
              <p className="text-sm text-white mb-3">
                Вы можете наблюдать за игрой, но не можете участвовать в голосовании или отправлять сообщения.
              </p>
              <Button color="danger" variant="flat" size="sm" onPress={handleLeaveRoom} startContent={<ExitIcon />}>
                Выйти из комнаты
              </Button>
            </div>
          </Card>
        )}

        {/* Показываем статус последнего слова */}
        {state.phase === "last-word" && state.eliminatedPlayer?.id === currentPlayer?.id && (
          <Card className="p-4 bg-orange-900/20 backdrop-blur-sm border border-orange-800">
            <div className="text-center">
              <h3 className="font-semibold text-orange-400 mb-2">Ваше последнее слово</h3>
              <p className="text-sm text-white mb-3">
                У вас есть 30 секунд, чтобы сказать последнее слово перед исключением из игры.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Центральная колонка - чат */}
      <div className="md:col-span-1">
        <Card className="h-[600px] flex flex-col bg-black/50 backdrop-blur-sm border border-gray-800">
          {/* Переключатель чатов для мафии */}
          {isMafia && (
            <div className="flex space-x-1 bg-gray-900/50 p-1 m-3 rounded-lg">
              <Button
                size="sm"
                className={`flex-1 ${activeChat === "public" ? "bg-danger-600 text-white" : "bg-transparent text-gray-400"}`}
                onPress={() => setActiveChat("public")}
              >
                Общий чат
              </Button>
              <Button
                size="sm"
                className={`flex-1 ${activeChat === "mafia" ? "bg-danger-600 text-white" : "bg-transparent text-gray-400"}`}
                onPress={() => setActiveChat("mafia")}
              >
                Мафия чат
              </Button>
            </div>
          )}

          <div className="p-3 border-b border-gray-700">
            <h3 className="font-semibold text-white">{activeChat === "mafia" ? "Чат мафии" : "Чат города"}</h3>
          </div>

          <div className="flex-grow overflow-y-auto p-3" ref={activeChat === "mafia" ? mafiaRef : chatRef}>
            <div className="space-y-3">
              {(activeChat === "mafia" ? state.mafiaMessages : state.messages).map((msg) => {
                const sender = msg.isSystem
                  ? { name: "Система", avatar: "" }
                  : state.players.find((p) => p.id === msg.playerId)

                if (!sender) return null

                return (
                  <div key={msg.id} className={`flex ${msg.isSystem ? "justify-center" : "gap-2"}`}>
                    {msg.isSystem ? (
                      <div className="bg-gray-800/50 rounded-lg py-2 px-3 max-w-[90%] border border-gray-700">
                        <p className="text-sm text-white text-center">{msg.text}</p>
                      </div>
                    ) : (
                      <>
                        <Avatar size="sm" name={sender.name.charAt(0)} className="bg-gray-700" />
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm text-white">{sender.name}</span>
                            {activeChat === "mafia" && (
                              <Badge color="danger" size="sm">
                                {sender.name === state.players.find((p) => p.role === "don")?.name ? "Дон" : "Мафия"}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-sm mt-1 text-white">{msg.text}</p>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-3 border-t border-gray-700">
            <div className="flex gap-2">
              <Input
                placeholder={
                  activeChat === "mafia"
                    ? canMafiaChat
                      ? "Сообщение для мафии..."
                      : "Мафия чат недоступен"
                    : canChat
                      ? state.phase === "last-word"
                        ? "Ваше последнее слово..."
                        : "Введите сообщение..."
                      : "Чат недоступен"
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                isDisabled={activeChat === "mafia" ? !canMafiaChat : !canChat}
                className="flex-1 bg-gray-900/50 text-white placeholder:text-gray-400"
              />
              <Button
                isIconOnly
                color="danger"
                onPress={() => handleSendMessage(activeChat === "mafia")}
                isDisabled={(activeChat === "mafia" ? !canMafiaChat : !canChat) || !message.trim()}
              >
                <SendIcon />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Правая колонка - игроки */}
      <div className="md:col-span-1">
        <Card className="p-4 bg-black/50 backdrop-blur-sm border border-gray-800">
          <h3 className="font-semibold mb-3 text-white">Игроки</h3>
          <div className="space-y-3">
            {state.players.map((player) => {
              const isCurrentPlayer = player.clientId === state.clientId
              const isAlive = player.isAlive
              const hasVoted = Object.keys(state.votes).includes(player.id.toString())
              const isSelected = state.selectedPlayer === player.id
              const isProtected = state.protectedPlayer === player.id
              const isChecked = state.sheriffChecked === player.id
              const isSeduced = player.isSeduced
              const isLoverTarget = state.loverTarget === player.id
              const isEliminatedPlayer = state.eliminatedPlayer?.id === player.id

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors border ${
                    isSelected
                      ? "bg-danger-900/30 border-danger-700"
                      : isEliminatedPlayer
                        ? "bg-orange-900/30 border-orange-700"
                        : "hover:bg-gray-800/30 border-gray-700"
                  } ${!isAlive && state.phase !== "last-word" ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="sm"
                      name={player.name.charAt(0)}
                      className={`${!isAlive && state.phase !== "last-word" ? "grayscale" : ""} bg-gray-700`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{player.name}</span>
                        {isCurrentPlayer && (
                          <Badge color="danger" size="sm">
                            Вы
                          </Badge>
                        )}
                        {player.isHost && (
                          <Badge color="warning" size="sm">
                            Хост
                          </Badge>
                        )}
                        {isEliminatedPlayer && state.phase === "last-word" && (
                          <Badge color="warning" size="sm">
                            Исключен
                          </Badge>
                        )}
                        {/* Показываем роль в тестовом режиме */}
                        {state.testMode && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleClass(player.role)}`}>
                            {getRoleName(player.role)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        {!isAlive && state.phase !== "last-word" && <span className="text-red-400">Мёртв</span>}
                        {hasVoted && state.phase === "voting" && <span className="text-white">Проголосовал</span>}
                        {isProtected && <span className="text-success-400">Защищен</span>}
                        {isChecked && <span className="text-warning-400">Проверен</span>}
                        {isSeduced && <span className="text-secondary-400">Соблазнен 💋</span>}
                        {!player.canVote && isAlive && <span className="text-gray-500">Не может голосовать</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {/* Кнопки действий в зависимости от фазы */}
                    {canVote && isAlive && player.id !== playerId && (
                      <Tooltip content="Голосовать против">
                        <Button
                          isIconOnly
                          size="sm"
                          color={votedFor === player.id ? "danger" : "default"}
                          variant={votedFor === player.id ? "solid" : "light"}
                          onPress={() => vote(player.id)}
                        >
                          <ThumbsDownIcon />
                        </Button>
                      </Tooltip>
                    )}

                    {canSelectTarget && isAlive && player.role !== "mafia" && player.role !== "don" && (
                      <Tooltip content="Выбрать жертву">
                        <Button
                          isIconOnly
                          size="sm"
                          color={isSelected ? "danger" : "default"}
                          variant={isSelected ? "solid" : "light"}
                          onPress={() => selectPlayer(player.id)}
                        >
                          <TargetIcon />
                        </Button>
                      </Tooltip>
                    )}

                    {canSheriffCheck && isAlive && player.id !== playerId && (
                      <Tooltip content="Проверить игрока">
                        <Button
                          isIconOnly
                          size="sm"
                          color={isChecked ? "warning" : "default"}
                          variant={isChecked ? "solid" : "light"}
                          onPress={() => sheriffCheck(player.id)}
                        >
                          <SearchIcon />
                        </Button>
                      </Tooltip>
                    )}

                    {canDoctorProtect && isAlive && (
                      <Tooltip content="Защитить игрока">
                        <Button
                          isIconOnly
                          size="sm"
                          color={isProtected ? "success" : "default"}
                          variant={isProtected ? "solid" : "light"}
                          onPress={() => doctorProtect(player.id)}
                        >
                          <ProtectIcon />
                        </Button>
                      </Tooltip>
                    )}

                    {canLoverSeduce && isAlive && player.id !== playerId && (
                      <Tooltip content="Соблазнить игрока">
                        <Button
                          isIconOnly
                          size="sm"
                          color={isLoverTarget ? "secondary" : "default"}
                          variant={isLoverTarget ? "solid" : "light"}
                          onPress={() => loverSeduce(player.id)}
                        >
                          <SeduceIcon />
                        </Button>
                      </Tooltip>
                    )}

                    {canDonCheck && isAlive && player.id !== playerId && (
                      <Tooltip content="Проверить игрока (Дон)">
                        <Button
                          isIconOnly
                          size="sm"
                          color="warning"
                          variant="light"
                          onPress={() => donCheck(player.id)}
                        >
                          <SearchIcon />
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Модальное окно с информацией о ролях */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent className="bg-black/90 border border-gray-800">
          {(onClose) => (
            <>
              <ModalHeader className="text-white">Роли в игре</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary-900/50">
                      <div className="text-primary-200">
                        <UserIcon />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary-200">Мирный житель</h4>
                      <p className="text-sm text-white">
                        Обычный житель города. Днём участвует в обсуждении и голосовании. Цель - вычислить и устранить
                        всех членов мафии.
                      </p>
                    </div>
                  </div>

                  <Divider className="bg-gray-700" />

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-danger-900/50">
                      <div className="text-danger-200">
                        <SkullIcon />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-danger-200">Мафия</h4>
                      <p className="text-sm text-white">
                        Член преступной группировки. Знает других членов мафии. Каждую ночь мафия выбирает одну жертву.
                        Цель - устранить всех мирных жителей.
                      </p>
                    </div>
                  </div>

                  <Divider className="bg-gray-700" />

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-danger-900/50">
                      <div className="text-danger-200">
                        <CrownIcon />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-danger-200">Дон мафии</h4>
                      <p className="text-sm text-white">
                        Глава мафии. Имеет те же способности, что и обычная мафия, но шериф видит его как мирного
                        жителя. Может проверять игроков ночью.
                      </p>
                    </div>
                  </div>

                  <Divider className="bg-gray-700" />

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-warning-900/50">
                      <div className="text-warning-200">
                        <ShieldIcon />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-warning-200">Шериф</h4>
                      <p className="text-sm text-white">
                        Представитель закона. Каждую ночь может проверить одного игрока и узнать его роль. Цель - помочь
                        мирным жителям вычислить мафию.
                      </p>
                    </div>
                  </div>

                  <Divider className="bg-gray-700" />

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-success-900/50">
                      <div className="text-success-200">
                        <MedicalIcon />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-success-200">Доктор</h4>
                      <p className="text-sm text-white">
                        Городской врач. Каждую ночь может защитить одного игрока от убийства мафии. Не может защищать
                        одного и того же игрока две ночи подряд.
                      </p>
                    </div>
                  </div>

                  <Divider className="bg-gray-700" />

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-secondary-900/50">
                      <div className="text-secondary-200">
                        <HeartIcon />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-secondary-200">Любовница</h4>
                      <p className="text-sm text-white">
                        Каждую ночь может соблазнить одного игрока. Соблазненный игрок теряет право голоса на следующий
                        день и не может использовать специальные способности следующей ночью.
                      </p>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" onPress={onClose}>
                  Понятно
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
