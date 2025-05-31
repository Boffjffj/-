"use client"

import React from "react"
import { safeLocalStorage, generateId } from "../utils/safe-storage"

// Типы ролей
export type Role = "civilian" | "mafia" | "sheriff" | "doctor" | "lover" | "don"

// Типы фаз игры
export type GamePhase =
  | "setup"
  | "lobby"
  | "day"
  | "voting"
  | "last-word"
  | "night"
  | "mafia-turn"
  | "mafia-chat"
  | "sheriff-turn"
  | "doctor-turn"
  | "lover-turn"
  | "results"
  | "game-over"

// Интерфейс игрока
export interface Player {
  id: string // Изменено на string для консистентности
  name: string
  role: Role
  isAlive: boolean
  isBot: boolean
  avatar: string
  isHost?: boolean
  isConnected?: boolean
  clientId?: string
  // Эффекты любовницы
  isSeduced: boolean
  canVote: boolean
  canUseAbility: boolean
}

// Интерфейс сообщения
export interface Message {
  id: string // Изменено на string
  playerId: string // Изменено на string
  text: string
  timestamp: number
  isSystem?: boolean
}

// Интерфейс состояния игры
interface GameState {
  players: Player[]
  messages: Message[]
  mafiaMessages: Message[]
  phase: GamePhase
  day: number
  selectedPlayer: string | null // Изменено на string
  checkedPlayers: Record<string, Role> // Изменено на string
  votes: Record<string, string> // Изменено на string
  mafiaVotes: Record<string, string> // Изменено на string
  winner: "mafia" | "civilians" | null
  timer: number | null
  mafiaCount: number
  testMode: boolean
  eliminatedPlayer: Player | null
  killedPlayer: Player | null
  // Онлайн
  isOnline: boolean
  roomId: string | null
  isHost: boolean
  clientId: string
  // Роли
  doctorTarget: string | null // Изменено на string
  loverPair: [string, string] | null // Изменено на string
  protectedPlayer: string | null // Изменено на string
  sheriffChecked: string | null // Изменено на string
  seducedPlayer: string | null // Изменено на string
  loverTarget: string | null // Изменено на string
}

// Интерфейс контекста игры
interface GameContextType {
  state: GameState
  setState: React.Dispatch<React.SetStateAction<GameState>>
  initGame: (playerCount: number, playerName: string, testMode: boolean) => void
  selectPlayer: (playerId: string) => void
  sendMessage: (text: string, isMafiaChat?: boolean) => void
  vote: (targetId: string, isMafiaVote?: boolean) => void
  nextPhase: () => void
  leaveRoom: () => void
  // Онлайн
  createRoom: (roomName: string, maxPlayers: number, isPrivate: boolean, password?: string) => Promise<string>
  joinRoom: (roomId: string, password?: string) => Promise<boolean>
  getRooms: () => Promise<any[]>
  // Роли
  doctorProtect: (playerId: string) => void
  sheriffCheck: (playerId: string) => void
  setLoverPair: (player1Id: string, player2Id: string) => void
  loverSeduce: (playerId: string) => void
  donCheck: (playerId: string) => void
  // Добавляем функцию для принудительной синхронизации с сервером
  syncGameState: () => Promise<void>
}

// Создание контекста
const GameContext = React.createContext<GameContextType | undefined>(undefined)

// Генерация случайных имен для ботов
const botNames = [
  "Алексей",
  "Мария",
  "Иван",
  "Елена",
  "Дмитрий",
  "Анна",
  "Сергей",
  "Ольга",
  "Андрей",
  "Наталья",
  "Михаил",
  "Екатерина",
  "Владимир",
  "Татьяна",
  "Артём",
]

// Провайдер контекста
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<GameState>({
    players: [],
    messages: [],
    mafiaMessages: [],
    phase: "setup",
    day: 1,
    selectedPlayer: null,
    checkedPlayers: {},
    votes: {},
    mafiaVotes: {},
    winner: null,
    timer: null,
    mafiaCount: 0,
    testMode: false,
    eliminatedPlayer: null,
    killedPlayer: null,
    isOnline: false,
    roomId: null,
    isHost: false,
    clientId: generateId(),
    doctorTarget: null,
    loverPair: null,
    protectedPlayer: null,
    sheriffChecked: null,
    seducedPlayer: null,
    loverTarget: null,
  })

  // Refs для предотвращения race conditions
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)
  const botTalkTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const phaseTransitionRef = React.useRef<NodeJS.Timeout | null>(null)

  // Cleanup функция
  const cleanup = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (botTalkTimeoutRef.current) {
      clearTimeout(botTalkTimeoutRef.current)
      botTalkTimeoutRef.current = null
    }
    if (phaseTransitionRef.current) {
      clearTimeout(phaseTransitionRef.current)
      phaseTransitionRef.current = null
    }
  }, [])

  // Cleanup при размонтировании
  React.useEffect(() => {
    return cleanup
  }, [cleanup])

  // Таймер для фаз (исправлен race condition)
  React.useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (state.timer !== null && state.timer > 0) {
      timerRef.current = setInterval(() => {
        setState((prevState) => {
          if (prevState.timer === null || prevState.timer <= 0) {
            return prevState
          }

          const newTimer = prevState.timer - 1

          if (newTimer <= 0) {
            // Планируем обработку окончания таймера
            if (phaseTransitionRef.current) {
              clearTimeout(phaseTransitionRef.current)
            }

            phaseTransitionRef.current = setTimeout(() => {
              handleTimerEnd(prevState.phase)
            }, 100)

            return { ...prevState, timer: null }
          }

          return { ...prevState, timer: newTimer }
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state.phase, state.timer])

  // Обработка окончания таймера
  const handleTimerEnd = React.useCallback((phase: GamePhase) => {
    switch (phase) {
      case "day":
        setState((prev) => ({
          ...prev,
          phase: "voting",
          timer: 15,
          messages: [
            ...prev.messages,
            {
              id: generateId(),
              playerId: "system",
              text: "Время обсуждения истекло. Начинается голосование.",
              timestamp: Date.now(),
              isSystem: true,
            },
          ],
        }))
        break
      case "voting":
        processVotes()
        break
      case "last-word":
        processLastWord()
        break
      case "mafia-turn":
        processMafiaAction()
        break
      case "sheriff-turn":
        processSheriffAction()
        break
      case "doctor-turn":
        processDoctorAction()
        break
      case "lover-turn":
        processLoverAction()
        break
    }
  }, [])

  // Инициализация игры
  const initGame = React.useCallback(
    (playerCount: number, playerName: string, testMode = false) => {
      cleanup() // Очищаем предыдущие таймеры

      const players: Player[] = []

      // Добавляем реального игрока, если не тестовый режим
      if (!testMode) {
        players.push({
          id: "1",
          name: playerName,
          role: "civilian",
          isAlive: true,
          isBot: false,
          avatar: "",
          isHost: true,
          isConnected: true,
          clientId: state.clientId,
          isSeduced: false,
          canVote: true,
          canUseAbility: true,
        })
      } else {
        players.push({
          id: "1",
          name: "Вы (Тест)",
          role: "civilian",
          isAlive: true,
          isBot: true,
          avatar: "",
          isHost: true,
          isConnected: true,
          clientId: state.clientId,
          isSeduced: false,
          canVote: true,
          canUseAbility: true,
        })
      }

      // Добавляем ботов
      const usedNames = new Set<string>()
      for (let i = 2; i <= playerCount; i++) {
        let name
        do {
          name = botNames[Math.floor(Math.random() * botNames.length)]
        } while (usedNames.has(name))
        usedNames.add(name)

        players.push({
          id: i.toString(),
          name,
          role: "civilian",
          isAlive: true,
          isBot: true,
          avatar: "",
          isHost: false,
          isConnected: true,
          clientId: `bot_${i}`,
          isSeduced: false,
          canVote: true,
          canUseAbility: true,
        })
      }

      // Назначаем роли
      const mafiaCount = playerCount === 10 ? 3 : Math.max(1, Math.floor(playerCount / 4))
      assignRoles(players, mafiaCount, playerCount)

      // Обновляем состояние
      setState((prev) => ({
        ...prev,
        players,
        messages: [
          {
            id: generateId(),
            playerId: "system",
            text: "Игра началась! Наступил день 1. У вас 30 секунд на обсуждение.",
            timestamp: Date.now(),
            isSystem: true,
          },
        ],
        mafiaMessages: [],
        phase: "day",
        day: 1,
        selectedPlayer: null,
        checkedPlayers: {},
        votes: {},
        mafiaVotes: {},
        winner: null,
        timer: 30,
        mafiaCount,
        testMode,
        eliminatedPlayer: null,
        killedPlayer: null,
        doctorTarget: null,
        loverPair: null,
        protectedPlayer: null,
        sheriffChecked: null,
        seducedPlayer: null,
        loverTarget: null,
      }))

      // Запускаем ботов
      botTalkTimeoutRef.current = setTimeout(() => {
        botsTalk()
      }, 2000)
    },
    [state.clientId, cleanup],
  )

  // Назначение ролей
  const assignRoles = (players: Player[], mafiaCount: number, totalPlayers: number) => {
    const playersCopy = [...players]

    // Перемешиваем массив
    for (let i = playersCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[playersCopy[i], playersCopy[j]] = [playersCopy[j], playersCopy[i]]
    }

    let roleIndex = 0

    // Назначаем мафию
    for (let i = 0; i < mafiaCount; i++) {
      if (i === 0 && mafiaCount > 1) {
        playersCopy[roleIndex].role = "don"
      } else {
        playersCopy[roleIndex].role = "mafia"
      }
      roleIndex++
    }

    // Назначаем шерифа
    if (roleIndex < playersCopy.length) {
      playersCopy[roleIndex].role = "sheriff"
      roleIndex++
    }

    // Назначаем доктора (если игроков больше 6)
    if (totalPlayers > 6 && roleIndex < playersCopy.length) {
      playersCopy[roleIndex].role = "doctor"
      roleIndex++
    }

    // Назначаем любовницу (если игроков больше 8)
    if (totalPlayers > 8 && roleIndex < playersCopy.length) {
      playersCopy[roleIndex].role = "lover"
      roleIndex++
    }

    // Остальные становятся мирными жителями
    for (let i = roleIndex; i < playersCopy.length; i++) {
      playersCopy[i].role = "civilian"
    }

    // Возвращаем игроков на их места
    for (let i = 0; i < players.length; i++) {
      const originalIndex = players.findIndex((p) => p.id === playersCopy[i].id)
      if (originalIndex !== -1) {
        players[originalIndex].role = playersCopy[i].role
      }
    }
  }

  // Боты общаются (исправлена мутация состояния)
  const botsTalk = React.useCallback(() => {
    setState((prev) => {
      if (!prev || (prev.phase !== "day" && prev.phase !== "last-word") || prev.winner) return prev

      const livingBots = prev.players.filter((p) => p.isBot && p.isAlive)
      if (livingBots.length === 0) return prev

      // В фазе последнего слова говорит только исключенный игрок
      if (prev.phase === "last-word") {
        if (prev.eliminatedPlayer && prev.eliminatedPlayer.isBot) {
          const lastWords = [
            "Я был честным игроком...",
            "Вы совершили ошибку!",
            "Ищите мафию среди живых!",
            "Я не мафия, поверьте мне!",
            "Отомстите за меня!",
            "Я знал, что это произойдет...",
          ]

          const text = lastWords[Math.floor(Math.random() * lastWords.length)]

          const newMessage: Message = {
            id: generateId(),
            playerId: prev.eliminatedPlayer.id,
            text,
            timestamp: Date.now(),
          }

          return {
            ...prev,
            messages: [...prev.messages, newMessage], // Создаем новый массив
          }
        }
        return prev
      }

      const bot = livingBots[Math.floor(Math.random() * livingBots.length)]
      const text = getBotMessage(bot.role, prev)

      const newMessage: Message = {
        id: generateId(),
        playerId: bot.id,
        text,
        timestamp: Date.now(),
      }

      return {
        ...prev,
        messages: [...prev.messages, newMessage], // Создаем новый массив
      }
    })

    // Планируем следующее сообщение
    const randomDelay = 3000 + Math.floor(Math.random() * 4000)
    botTalkTimeoutRef.current = setTimeout(() => {
      setState((currentState) => {
        if (currentState?.phase === "day" && !currentState?.winner) {
          botsTalk()
        }
        return currentState
      })
    }, randomDelay)
  }, [])

  // Получение сообщения бота
  const getBotMessage = (role: Role, gameState: GameState): string => {
    const phrases = {
      mafia: [
        "Я думаю, нам нужно быть осторожнее с обвинениями.",
        "Кто-то из нас точно подозрительный...",
        "Я не доверяю тем, кто молчит.",
        "Давайте логически подумаем, кто может быть мафией.",
        "Мне кажется, некоторые ведут себя странно.",
      ],
      sheriff: [
        "Я внимательно наблюдаю за всеми.",
        "У меня есть подозрения на некоторых игроков.",
        "Давайте будем внимательны к поведению друг друга.",
        "Я заметил странности в поведении некоторых.",
        "Нужно анализировать каждое слово и действие.",
      ],
      civilian: [
        "Кто-то из нас точно мафия!",
        "Я мирный житель и хочу найти мафию.",
        "Давайте внимательно следить за поведением.",
        "Мне кажется подозрительным поведение некоторых.",
        "Нужно быть осторожными с голосованием.",
      ],
      doctor: [
        "Я стараюсь помочь городу.",
        "Нужно защищать невинных.",
        "Я слежу за здоровьем всех жителей.",
        "Важно сохранить как можно больше жизней.",
      ],
      lover: [
        "Сегодня кто-то будет очарован...",
        "Любовь - это сила.",
        "Я знаю, как влиять на людей.",
        "Некоторые потеряют голову от любви.",
      ],
      don: [
        "Порядок должен быть восстановлен.",
        "Я знаю, как действовать.",
        "Нужно принимать решения обдуманно.",
        "У меня есть опыт в таких делах.",
      ],
    }

    const rolePhrases = phrases[role] || phrases.civilian
    return rolePhrases[Math.floor(Math.random() * rolePhrases.length)]
  }

  // Обработка действий
  const processMafiaAction = React.useCallback(() => {
    setState((prev) => {
      let targetId = prev.selectedPlayer

      // Если игрок-мафия не выбрал цель, боты выбирают случайную
      if (!targetId) {
        const livingMafia = prev.players.filter((p) => p.isAlive && (p.role === "mafia" || p.role === "don") && p.isBot)
        const potentialTargets = prev.players.filter((p) => p.isAlive && p.role !== "mafia" && p.role !== "don")

        if (livingMafia.length > 0 && potentialTargets.length > 0) {
          const randomTarget = potentialTargets[Math.floor(Math.random() * potentialTargets.length)]
          targetId = randomTarget.id
        }
      }

      // Переходим к ходу шерифа
      return {
        ...prev,
        selectedPlayer: targetId,
        phase: "sheriff-turn",
        timer: 10,
        messages: [
          ...prev.messages,
          {
            id: generateId(),
            playerId: "system",
            text: "Шериф проводит расследование...",
            timestamp: Date.now(),
            isSystem: true,
          },
        ],
      }
    })
  }, [])

  const processSheriffAction = React.useCallback(() => {
    setState((prev) => {
      const hasDoctor = prev.players.some((p) => p.role === "doctor" && p.isAlive)

      if (hasDoctor) {
        return {
          ...prev,
          phase: "doctor-turn",
          timer: 10,
          messages: [
            ...prev.messages,
            {
              id: generateId(),
              playerId: "system",
              text: "Доктор выбирает, кого защитить...",
              timestamp: Date.now(),
              isSystem: true,
            },
          ],
        }
      } else {
        // Если нет доктора, сразу переходим к результатам
        setTimeout(() => startNewDay(prev.selectedPlayer), 1000)
        return { ...prev, phase: "results" }
      }
    })
  }, [])

  const processDoctorAction = React.useCallback(() => {
    setState((prev) => {
      // После доктора всегда переходим к результатам
      setTimeout(() => startNewDay(prev.selectedPlayer), 1000)
      return { ...prev, phase: "results" }
    })
  }, [])

  const processLoverAction = React.useCallback(() => {
    setState((prev) => {
      // Применяем эффект соблазнения (создаем новый массив игроков)
      const newPlayers = prev.players.map((player) => {
        const resetPlayer = {
          ...player,
          isSeduced: false,
          canVote: true,
          canUseAbility: true,
        }

        if (prev.loverTarget && player.id === prev.loverTarget) {
          return {
            ...resetPlayer,
            isSeduced: true,
            canVote: false,
            canUseAbility: false,
          }
        }

        return resetPlayer
      })

      // Переходим к ходу мафии
      return {
        ...prev,
        players: newPlayers,
        seducedPlayer: prev.loverTarget,
        phase: "mafia-turn",
        timer: 15,
        messages: [
          ...prev.messages,
          {
            id: generateId(),
            playerId: "system",
            text: "Мафия выбирает жертву...",
            timestamp: Date.now(),
            isSystem: true,
          },
        ],
      }
    })
  }, [])

  const processLastWord = React.useCallback(() => {
    setState((prev) => {
      if (!prev.eliminatedPlayer) return prev

      // Убиваем исключенного игрока (создаем новый массив)
      const newPlayers = prev.players.map((p) => {
        if (p.id === prev.eliminatedPlayer?.id) {
          return { ...p, isAlive: false }
        }
        return p
      })

      const winner = checkWinCondition(newPlayers)

      if (winner) {
        return {
          ...prev,
          players: newPlayers,
          messages: [
            ...prev.messages,
            {
              id: generateId(),
              playerId: "system",
              text: `${prev.eliminatedPlayer.name} покидает игру.`,
              timestamp: Date.now(),
              isSystem: true,
            },
            {
              id: generateId(),
              playerId: "system",
              text:
                winner === "mafia"
                  ? "Мафия победила! Они устранили всех мирных жителей."
                  : "Мирные жители победили! Вся мафия устранена.",
              timestamp: Date.now(),
              isSystem: true,
            },
          ],
          phase: "game-over",
          winner,
          timer: null,
        }
      }

      // Проверяем, есть ли живая любовница для начала ночи
      const hasLover = newPlayers.some((p) => p.role === "lover" && p.isAlive)

      return {
        ...prev,
        players: newPlayers,
        messages: [
          ...prev.messages,
          {
            id: generateId(),
            playerId: "system",
            text: `${prev.eliminatedPlayer.name} покидает игру.`,
            timestamp: Date.now(),
            isSystem: true,
          },
          {
            id: generateId(),
            playerId: "system",
            text: hasLover
              ? "Наступила ночь. Любовница выбирает свою жертву..."
              : "Наступила ночь. Мафия выбирает жертву...",
            timestamp: Date.now(),
            isSystem: true,
          },
        ],
        phase: hasLover ? "lover-turn" : "mafia-turn",
        timer: 10,
      }
    })
  }, [])

  const startNewDay = React.useCallback(
    (mafiaTargetId: string | null) => {
      setState((prev) => {
        let newPlayers = [...prev.players]
        const newMessages = [...prev.messages]
        let killedPlayer: Player | null = null

        const isProtected = prev.protectedPlayer === mafiaTargetId

        // Обрабатываем убийство мафии
        if (mafiaTargetId && !isProtected) {
          const victim = newPlayers.find((p) => p.id === mafiaTargetId)
          if (victim && victim.isAlive) {
            killedPlayer = victim
            newPlayers = newPlayers.map((p) => {
              if (p.id === mafiaTargetId) {
                return { ...p, isAlive: false }
              }
              return p
            })
          }
        }

        // Показываем результаты ночи
        if (prev.eliminatedPlayer) {
          newMessages.push({
            id: generateId(),
            playerId: "system",
            text: `Вчера был исключен ${prev.eliminatedPlayer.name}. Его роль: ${getRoleName(prev.eliminatedPlayer.role)}.`,
            timestamp: Date.now(),
            isSystem: true,
          })
        }

        if (killedPlayer) {
          newMessages.push({
            id: generateId(),
            playerId: "system",
            text: `${killedPlayer.name} был убит ночью. Его роль: ${getRoleName(killedPlayer.role)}.`,
            timestamp: Date.now(),
            isSystem: true,
          })
        } else if (mafiaTargetId && isProtected) {
          newMessages.push({
            id: generateId(),
            playerId: "system",
            text: "Доктор спас жизнь этой ночью!",
            timestamp: Date.now(),
            isSystem: true,
          })
        } else {
          newMessages.push({
            id: generateId(),
            playerId: "system",
            text: "Этой ночью никто не погиб.",
            timestamp: Date.now(),
            isSystem: true,
          })
        }

        const winner = checkWinCondition(newPlayers)

        if (winner) {
          return {
            ...prev,
            players: newPlayers,
            messages: [
              ...newMessages,
              {
                id: generateId(),
                playerId: "system",
                text:
                  winner === "mafia"
                    ? "Мафия победила! Они устранили всех мирных жителей."
                    : "Мирные жители победили! Вся мафия устранена.",
                timestamp: Date.now(),
                isSystem: true,
              },
            ],
            phase: "game-over",
            winner,
            timer: null,
            protectedPlayer: null,
            sheriffChecked: null,
            loverTarget: null,
            eliminatedPlayer: null,
            killedPlayer,
          }
        }

        return {
          ...prev,
          players: newPlayers,
          messages: [
            ...newMessages,
            {
              id: generateId(),
              playerId: "system",
              text: `День ${prev.day + 1}. У вас 30 секунд на обсуждение.`,
              timestamp: Date.now(),
              isSystem: true,
            },
          ],
          phase: "day",
          day: prev.day + 1,
          timer: 30,
          selectedPlayer: null,
          protectedPlayer: null,
          sheriffChecked: null,
          loverTarget: null,
          eliminatedPlayer: null,
          killedPlayer,
        }
      })

      botTalkTimeoutRef.current = setTimeout(() => {
        botsTalk()
      }, 2000)
    },
    [botsTalk],
  )

  const processVotes = React.useCallback(() => {
    setState((prev) => {
      const voteCounts: Record<string, number> = {}
      Object.values(prev.votes).forEach((targetId) => {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1
      })

      let maxVotes = 0
      let eliminatedId: string | null = null

      Object.entries(voteCounts).forEach(([id, count]) => {
        if (count > maxVotes) {
          maxVotes = count
          eliminatedId = id
        }
      })

      if (eliminatedId === null || maxVotes <= 1) {
        // Проверяем, есть ли живая любовница для начала ночи
        const hasLover = prev.players.some((p) => p.role === "lover" && p.isAlive)

        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: generateId(),
              playerId: "system",
              text: "Никто не был исключен в результате голосования.",
              timestamp: Date.now(),
              isSystem: true,
            },
            {
              id: generateId(),
              playerId: "system",
              text: hasLover
                ? "Наступила ночь. Любовница выбирает свою жертву..."
                : "Наступила ночь. Мафия выбирает жертву...",
              timestamp: Date.now(),
              isSystem: true,
            },
          ],
          phase: hasLover ? "lover-turn" : "mafia-turn",
          votes: {},
          timer: 10,
          eliminatedPlayer: null,
        }
      }

      const eliminatedPlayer = prev.players.find((p) => p.id === eliminatedId)
      if (!eliminatedPlayer) return prev

      // Переходим к фазе последнего слова
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: generateId(),
            playerId: "system",
            text: `${eliminatedPlayer.name} был исключен голосованием. Последнее слово...`,
            timestamp: Date.now(),
            isSystem: true,
          },
        ],
        phase: "last-word",
        votes: {},
        timer: 30,
        eliminatedPlayer: eliminatedPlayer,
      }
    })
  }, [])

  // Исправленная проверка условий победы
  const checkWinCondition = (players: Player[]): "mafia" | "civilians" | null => {
    const livingPlayers = players.filter((p) => p.isAlive)
    const livingMafia = livingPlayers.filter((p) => p.role === "mafia" || p.role === "don")
    const livingCivilians = livingPlayers.filter((p) => p.role !== "mafia" && p.role !== "don")

    // Мафия побеждает, если их количество больше или равно количеству мирных
    if (livingMafia.length >= livingCivilians.length && livingMafia.length > 0) {
      return "mafia"
    }

    // Мирные побеждают, если мафии не осталось
    if (livingMafia.length === 0) {
      return "civilians"
    }

    return null
  }

  const getRoleName = (role: Role): string => {
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

  const botsVote = React.useCallback(() => {
    setState((prev) => {
      if (!prev || prev.phase !== "voting") return prev

      const newVotes = { ...prev.votes }
      const livingBots = prev.players.filter((p) => p.isBot && p.isAlive && p.canVote)
      const livingPlayers = prev.players.filter((p) => p.isAlive)

      // Создаем новый массив сообщений
      const newMessages = [...prev.messages]

      for (const bot of livingBots) {
        if (newVotes[bot.id]) continue

        const targets = livingPlayers.filter((p) => p.isAlive && p.id !== bot.id)
        if (targets.length > 0) {
          const target = targets[Math.floor(Math.random() * targets.length)]
          newVotes[bot.id] = target.id

          newMessages.push({
            id: generateId(),
            playerId: bot.id,
            text: `Я голосую против ${target.name}!`,
            timestamp: Date.now(),
          })
        }
      }

      const livingPlayersCount = livingPlayers.filter((p) => p.canVote).length
      const votedPlayersCount = Object.keys(newVotes).length

      if (votedPlayersCount >= livingPlayersCount) {
        setTimeout(() => {
          processVotes()
        }, 2000)
        return {
          ...prev,
          votes: newVotes,
          messages: newMessages,
          timer: null,
        }
      }

      return {
        ...prev,
        votes: newVotes,
        messages: newMessages,
      }
    })
  }, [processVotes])

  // Функции для ролей
  const doctorProtect = React.useCallback((playerId: string) => {
    setState((prev) => ({
      ...prev,
      protectedPlayer: playerId,
      doctorTarget: playerId,
    }))
  }, [])

  const sheriffCheck = React.useCallback((playerId: string) => {
    setState((prev) => ({
      ...prev,
      sheriffChecked: playerId,
      checkedPlayers: {
        ...prev.checkedPlayers,
        [playerId]: prev.players.find((p) => p.id === playerId)?.role || "civilian",
      },
    }))
  }, [])

  const setLoverPair = React.useCallback((player1Id: string, player2Id: string) => {
    setState((prev) => ({
      ...prev,
      loverPair: [player1Id, player2Id],
    }))
  }, [])

  const loverSeduce = React.useCallback((playerId: string) => {
    setState((prev) => ({
      ...prev,
      loverTarget: playerId,
    }))
  }, [])

  const donCheck = React.useCallback((playerId: string) => {
    setState((prev) => ({
      ...prev,
      checkedPlayers: {
        ...prev.checkedPlayers,
        [playerId]: prev.players.find((p) => p.id === playerId)?.role || "civilian",
      },
    }))
  }, [])

  const selectPlayer = React.useCallback((playerId: string) => {
    setState((prev) => ({
      ...prev,
      selectedPlayer: playerId,
    }))
  }, [])

  const sendMessage = React.useCallback(
    (text: string, isMafiaChat = false) => {
      const player = state.players.find((p) => p.clientId === state.clientId)

      if (!player || !text.trim()) return

      // В фазе последнего слова может говорить только исключенный игрок
      if (state.phase === "last-word") {
        if (state.eliminatedPlayer?.id !== player.id) return
      } else if (!player.isAlive) {
        return
      }

      const newMessage: Message = {
        id: generateId(),
        playerId: player.id,
        text,
        timestamp: Date.now(),
      }

      setState((prev) => {
        if (isMafiaChat) {
          return {
            ...prev,
            mafiaMessages: [...prev.mafiaMessages, newMessage],
          }
        } else {
          return {
            ...prev,
            messages: [...prev.messages, newMessage],
          }
        }
      })
    },
    [state.players, state.clientId, state.phase, state.eliminatedPlayer],
  )

  const vote = React.useCallback(
    (targetId: string, isMafiaVote = false) => {
      if ((isMafiaVote && state.phase !== "mafia-turn") || (!isMafiaVote && state.phase !== "voting")) return

      const player = state.players.find((p) => p.clientId === state.clientId)
      if (!player || !player.isAlive) return

      if (!isMafiaVote && !player.canVote) return

      if (isMafiaVote && player.role !== "mafia" && player.role !== "don") return

      setState((prev) => {
        const newVotes = isMafiaVote
          ? { ...prev.mafiaVotes, [player.id]: targetId }
          : { ...prev.votes, [player.id]: targetId }

        if (!isMafiaVote && state.phase === "voting") {
          setTimeout(() => {
            botsVote()
          }, 1000)
        }

        return {
          ...prev,
          mafiaVotes: isMafiaVote ? newVotes : prev.mafiaVotes,
          votes: isMafiaVote ? prev.votes : newVotes,
          selectedPlayer: isMafiaVote ? targetId : prev.selectedPlayer,
        }
      })
    },
    [state.phase, state.players, state.clientId, botsVote],
  )

  const nextPhase = React.useCallback(() => {
    setState((prev) => {
      if (prev.phase === "day") {
        return {
          ...prev,
          phase: "voting",
          timer: 15,
          messages: [
            ...prev.messages,
            {
              id: generateId(),
              playerId: "system",
              text: "Начинается голосование. У вас 15 секунд, чтобы выбрать, кого вы считаете мафией.",
              timestamp: Date.now(),
              isSystem: true,
            },
          ],
        }
      }
      return prev
    })

    if (state.phase === "voting") {
      setTimeout(() => {
        botsVote()
      }, 2000)
    }
  }, [state.phase, botsVote])

  const leaveRoom = React.useCallback(() => {
    cleanup()

    // Удаляем данные из localStorage при выходе
    safeLocalStorage.removeItem("mafia_player_id")
    safeLocalStorage.removeItem("mafia_room_id")
    safeLocalStorage.removeItem("mafia_is_host")
    safeLocalStorage.removeItem("mafia_player_name")

    setState((prev) => ({
      ...prev,
      players: [],
      messages: [],
      mafiaMessages: [],
      phase: "setup",
      day: 1,
      selectedPlayer: null,
      checkedPlayers: {},
      votes: {},
      mafiaVotes: {},
      winner: null,
      timer: null,
      mafiaCount: 0,
      testMode: false,
      eliminatedPlayer: null,
      killedPlayer: null,
      isOnline: false,
      roomId: null,
      isHost: false,
      doctorTarget: null,
      loverPair: null,
      protectedPlayer: null,
      sheriffChecked: null,
      seducedPlayer: null,
      loverTarget: null,
    }))
  }, [cleanup])

  // Онлайн функции (упрощенные)
  const createRoom = React.useCallback(
    async (roomName: string, maxPlayers: number, isPrivate: boolean, password?: string): Promise<string> => {
      // Используем данные из localStorage, если они есть
      const roomId = safeLocalStorage.getItem("mafia_room_id")
      const playerId = safeLocalStorage.getItem("mafia_player_id")
      const isHost = safeLocalStorage.getItem("mafia_is_host") === "true"

      if (roomId && playerId) {
        setState((prev) => ({
          ...prev,
          isOnline: true,
          roomId,
          isHost,
          clientId: playerId,
          phase: "lobby",
        }))

        return roomId
      }

      return roomId || ""
    },
    [],
  )

  const joinRoom = React.useCallback(async (roomId: string, password?: string): Promise<boolean> => {
    // Используем данные из localStorage, если они есть
    const savedRoomId = safeLocalStorage.getItem("mafia_room_id")
    const playerId = safeLocalStorage.getItem("mafia_player_id")
    const isHost = safeLocalStorage.getItem("mafia_is_host") === "true"

    if (savedRoomId && playerId) {
      setState((prev) => ({
        ...prev,
        isOnline: true,
        roomId: savedRoomId,
        isHost,
        clientId: playerId,
        phase: "lobby",
      }))

      return true
    }

    return false
  }, [])

  const getRooms = React.useCallback(async (): Promise<any[]> => {
    try {
      const response = await fetch("/api/rooms")
      const data = await response.json()
      return data.rooms || []
    } catch (error) {
      console.error("Ошибка получения списка комнат:", error)
      return []
    }
  }, [])

  // Добавляем функцию для принудительной синхронизации с сервером
  const syncGameState = React.useCallback(async () => {
    if (!state.isOnline || !state.roomId || !state.clientId) return

    try {
      const response = await fetch(`/api/game?roomId=${state.roomId}&playerId=${state.clientId}`)
      const data = await response.json()

      if (data.success && data.room && data.room.gameState) {
        setState((prevState) => ({
          ...prevState,
          ...data.room.gameState,
          players: data.room.gameState.players || prevState.players,
        }))
      }
    } catch (error) {
      console.error("Error syncing game state:", error)
    }
  }, [state.isOnline, state.roomId, state.clientId])

  // Добавляем syncGameState в возвращаемый объект value:
  const value = React.useMemo(
    () => ({
      state,
      setState,
      initGame,
      selectPlayer,
      sendMessage,
      vote,
      nextPhase,
      leaveRoom,
      createRoom,
      joinRoom,
      getRooms,
      doctorProtect,
      sheriffCheck,
      setLoverPair,
      loverSeduce,
      donCheck,
      syncGameState, // Добавляем новую функцию
    }),
    [
      state,
      setState,
      initGame,
      selectPlayer,
      sendMessage,
      vote,
      nextPhase,
      leaveRoom,
      createRoom,
      joinRoom,
      getRooms,
      doctorProtect,
      sheriffCheck,
      setLoverPair,
      loverSeduce,
      donCheck,
      syncGameState, // Добавляем новую функцию
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export const useGame = () => {
  const context = React.useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
