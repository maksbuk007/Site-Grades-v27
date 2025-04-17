"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, Pause, Play } from "lucide-react"
import { Slider } from "@/components/ui/slider"

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"
type SnakeSegment = { x: number; y: number }
type Food = { x: number; y: number; value: number }

const CELL_SIZE = 20
const INITIAL_SPEED = 120
const MAX_SPEED = 50
const FOOD_TYPES = [
  { value: 1, color: "#F44336", chance: 0.7 }, // обычная еда
  { value: 3, color: "#FFD700", chance: 0.2 }, // золотая еда
  { value: 5, color: "#9C27B0", chance: 0.1 }, // редкая еда
]

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gridSize, setGridSize] = useState(20)
  const [snake, setSnake] = useState<SnakeSegment[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ])
  const [food, setFood] = useState<Food>({ x: 15, y: 10, value: 1 })
  const [direction, setDirection] = useState<Direction>("RIGHT")
  const [nextDirection, setNextDirection] = useState<Direction>("RIGHT")
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(INITIAL_SPEED)
  const [speedSetting, setSpeedSetting] = useState(50) // 0-100 для слайдера
  const gameLoopRef = useRef<number | null>(null)
  const lastRenderTimeRef = useRef<number>(0)
  const lastTouchTimeRef = useRef<number>(0)
  const touchThrottleTime = 100 // миллисекунды между разрешенными нажатиями

  // Генерация случайной позиции для еды
  const generateFood = useCallback(() => {
    // Выбираем тип еды на основе шансов
    const random = Math.random()
    let foodType = FOOD_TYPES[0]
    let cumulativeChance = 0

    for (const type of FOOD_TYPES) {
      cumulativeChance += type.chance
      if (random <= cumulativeChance) {
        foodType = type
        break
      }
    }

    // Генерируем позицию, которая не находится на змейке
    let x, y
    do {
      x = Math.floor(Math.random() * gridSize)
      y = Math.floor(Math.random() * gridSize)
    } while (snake.some((segment) => segment.x === x && segment.y === y))

    return { x, y, value: foodType.value }
  }, [snake, gridSize])

  // Проверка столкновений
  const checkCollision = useCallback(
    (head: SnakeSegment) => {
      // Проверка столкновения со стенами
      if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        return true
      }

      // Проверка столкновения с самой собой (кроме последнего сегмента, который будет удален)
      for (let i = 0; i < snake.length - 1; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
          return true
        }
      }

      return false
    },
    [snake, gridSize],
  )

  // Обработка нажатий клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return

      switch (e.key) {
        case "ArrowUp":
          if (direction !== "DOWN") setNextDirection("UP")
          break
        case "ArrowDown":
          if (direction !== "UP") setNextDirection("DOWN")
          break
        case "ArrowLeft":
          if (direction !== "RIGHT") setNextDirection("LEFT")
          break
        case "ArrowRight":
          if (direction !== "LEFT") setNextDirection("RIGHT")
          break
        case " ":
          setIsPaused(!isPaused)
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [direction, gameOver, isPaused])

  // Обновление скорости игры на основе настроек слайдера
  useEffect(() => {
    const calculatedSpeed = INITIAL_SPEED - (speedSetting / 100) * (INITIAL_SPEED - MAX_SPEED)
    setSpeed(calculatedSpeed)
  }, [speedSetting])

  // Игровой цикл с использованием requestAnimationFrame
  useEffect(() => {
    if (gameOver || isPaused) return

    const gameLoop = (currentTime: number) => {
      gameLoopRef.current = requestAnimationFrame(gameLoop)

      // Ограничиваем частоту обновления в зависимости от скорости
      if (currentTime - lastRenderTimeRef.current < speed) return
      lastRenderTimeRef.current = currentTime

      setDirection(nextDirection)

      setSnake((prevSnake) => {
        const newSnake = [...prevSnake]
        const head = { ...newSnake[0] }

        // Перемещение головы в зависимости от направления
        switch (nextDirection) {
          case "UP":
            head.y -= 1
            break
          case "DOWN":
            head.y += 1
            break
          case "LEFT":
            head.x -= 1
            break
          case "RIGHT":
            head.x += 1
            break
        }

        // Проверка столкновений
        if (checkCollision(head)) {
          setGameOver(true)
          if (score > highScore) {
            setHighScore(score)
          }
          cancelAnimationFrame(gameLoopRef.current as number)
          return prevSnake
        }

        // Добавление новой головы
        newSnake.unshift(head)

        // Проверка, съела ли змейка еду
        if (head.x === food.x && head.y === food.y) {
          // Увеличение счета
          setScore((s) => s + food.value)

          // Генерация новой еды
          setFood(generateFood())
        } else {
          // Если еда не съедена, удаляем последний сегмент
          newSnake.pop()
        }

        return newSnake
      })
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [checkCollision, food, gameOver, generateFood, isPaused, nextDirection, score, highScore, speed])

  // Отрисовка игры
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Отрисовка фона
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Отрисовка сетки (опционально)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, gridSize * CELL_SIZE)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(gridSize * CELL_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // Отрисовка змейки с градиентом
    snake.forEach((segment, index) => {
      const gradientPosition = index / snake.length
      const r = Math.floor(76 - gradientPosition * 30)
      const g = Math.floor(175 - gradientPosition * 50)
      const b = Math.floor(80 - gradientPosition * 30)

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)

      // Добавляем блик для 3D эффекта
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE / 2, CELL_SIZE / 2)

      // Добавляем обводку
      ctx.strokeStyle = "#388E3C"
      ctx.strokeRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    })

    // Отрисовка глаз для головы змейки
    if (snake.length > 0) {
      const head = snake[0]
      ctx.fillStyle = "white"

      // Позиция глаз зависит от направления
      let leftEyeX, leftEyeY, rightEyeX, rightEyeY

      switch (direction) {
        case "UP":
          leftEyeX = head.x * CELL_SIZE + CELL_SIZE / 4
          leftEyeY = head.y * CELL_SIZE + CELL_SIZE / 4
          rightEyeX = head.x * CELL_SIZE + (CELL_SIZE * 3) / 4
          rightEyeY = head.y * CELL_SIZE + CELL_SIZE / 4
          break
        case "DOWN":
          leftEyeX = head.x * CELL_SIZE + CELL_SIZE / 4
          leftEyeY = head.y * CELL_SIZE + (CELL_SIZE * 3) / 4
          rightEyeX = head.x * CELL_SIZE + (CELL_SIZE * 3) / 4
          rightEyeY = head.y * CELL_SIZE + (CELL_SIZE * 3) / 4
          break
        case "LEFT":
          leftEyeX = head.x * CELL_SIZE + CELL_SIZE / 4
          leftEyeY = head.y * CELL_SIZE + CELL_SIZE / 4
          rightEyeX = head.x * CELL_SIZE + CELL_SIZE / 4
          rightEyeY = head.y * CELL_SIZE + (CELL_SIZE * 3) / 4
          break
        case "RIGHT":
          leftEyeX = head.x * CELL_SIZE + (CELL_SIZE * 3) / 4
          leftEyeY = head.y * CELL_SIZE + CELL_SIZE / 4
          rightEyeX = head.x * CELL_SIZE + (CELL_SIZE * 3) / 4
          rightEyeY = head.y * CELL_SIZE + (CELL_SIZE * 3) / 4
          break
      }

      // Рисуем глаза
      ctx.beginPath()
      ctx.arc(leftEyeX, leftEyeY, CELL_SIZE / 6, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(rightEyeX, rightEyeY, CELL_SIZE / 6, 0, Math.PI * 2)
      ctx.fill()

      // Зрачки
      ctx.fillStyle = "black"
      ctx.beginPath()
      ctx.arc(leftEyeX, leftEyeY, CELL_SIZE / 10, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(rightEyeX, rightEyeY, CELL_SIZE / 10, 0, Math.PI * 2)
      ctx.fill()
    }

    // Отрисовка еды с эффектом свечения
    const foodType = FOOD_TYPES.find((type) => type.value === food.value) || FOOD_TYPES[0]

    // Создаем свечение
    const gradient = ctx.createRadialGradient(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 6,
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE,
    )
    gradient.addColorStop(0, foodType.color)
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

    // Рисуем свечение
    ctx.fillStyle = gradient
    ctx.fillRect(food.x * CELL_SIZE - CELL_SIZE / 2, food.y * CELL_SIZE - CELL_SIZE / 2, CELL_SIZE * 2, CELL_SIZE * 2)

    // Рисуем саму еду
    ctx.fillStyle = foodType.color
    ctx.beginPath()
    ctx.arc(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2)
    ctx.fill()

    // Добавляем блик
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
    ctx.beginPath()
    ctx.arc(food.x * CELL_SIZE + CELL_SIZE / 3, food.y * CELL_SIZE + CELL_SIZE / 3, CELL_SIZE / 6, 0, Math.PI * 2)
    ctx.fill()
  }, [snake, food, gridSize, direction])

  // Сброс игры
  const resetGame = () => {
    setSnake([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ])
    setFood(generateFood())
    setDirection("RIGHT")
    setNextDirection("RIGHT")
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
  }

  // Управление с помощью кнопок (для мобильных устройств)
  const handleDirectionButton = (newDirection: Direction) => {
    // Предотвращение частых нажатий
    const now = Date.now()
    if (now - lastTouchTimeRef.current < touchThrottleTime) {
      return
    }
    lastTouchTimeRef.current = now

    if (gameOver || isPaused) return

    switch (newDirection) {
      case "UP":
        if (direction !== "DOWN") setNextDirection("UP")
        break
      case "DOWN":
        if (direction !== "UP") setNextDirection("DOWN")
        break
      case "LEFT":
        if (direction !== "RIGHT") setNextDirection("LEFT")
        break
      case "RIGHT":
        if (direction !== "LEFT") setNextDirection("RIGHT")
        break
      default:
        break
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex items-center gap-4 flex-wrap justify-center">
        <Badge variant="outline" className="text-sm">
          Счет: {score}
        </Badge>
        <Badge variant="outline" className="text-sm">
          Рекорд: {highScore}
        </Badge>
        {gameOver && <Badge variant="destructive">Игра окончена!</Badge>}
        {isPaused && !gameOver && <Badge variant="secondary">Пауза</Badge>}

        <div className="flex items-center gap-2">
          <span className="text-sm">Скорость:</span>
          <Slider
            className="w-24"
            value={[speedSetting]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => setSpeedSetting(value[0])}
            disabled={gameOver}
          />
        </div>
      </div>

      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          width={gridSize * CELL_SIZE}
          height={gridSize * CELL_SIZE}
          className="border border-border rounded-lg shadow-lg"
          style={{ touchAction: "none" }}
        />
        {(gameOver || isPaused) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="text-center p-4 bg-card rounded-lg shadow-lg border border-border">
              <h3 className="text-xl font-bold">{gameOver ? "Игра окончена!" : "Пауза"}</h3>
              {gameOver && <p className="mt-2">Ваш счет: {score}</p>}
              <Button
                onClick={gameOver ? resetGame : () => setIsPaused(false)}
                className="mt-4"
                variant="default"
                style={{ touchAction: "manipulation" }}
              >
                {gameOver ? "Начать заново" : "Продолжить"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Кнопки управления для мобильных устройств */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div></div>
        <Button
          variant="outline"
          className="h-12 w-12 rounded-full"
          onClick={() => handleDirectionButton("UP")}
          disabled={gameOver}
          style={{ touchAction: "manipulation" }}
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
        <div></div>
        <Button
          variant="outline"
          className="h-12 w-12 rounded-full"
          onClick={() => handleDirectionButton("LEFT")}
          disabled={gameOver}
          style={{ touchAction: "manipulation" }}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          className="h-12 w-12 rounded-full"
          onClick={() => (gameOver ? resetGame() : setIsPaused(!isPaused))}
          style={{ touchAction: "manipulation" }}
        >
          {gameOver ? (
            <RotateCw className="h-6 w-6" />
          ) : isPaused ? (
            <Play className="h-6 w-6" />
          ) : (
            <Pause className="h-6 w-6" />
          )}
        </Button>
        <Button
          variant="outline"
          className="h-12 w-12 rounded-full"
          onClick={() => handleDirectionButton("RIGHT")}
          disabled={gameOver}
          style={{ touchAction: "manipulation" }}
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
        <div></div>
        <Button
          variant="outline"
          className="h-12 w-12 rounded-full"
          onClick={() => handleDirectionButton("DOWN")}
          disabled={gameOver}
          style={{ touchAction: "manipulation" }}
        >
          <ArrowDown className="h-6 w-6" />
        </Button>
        <div></div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Используйте стрелки для управления или кнопки выше.</p>
        <p>Пробел для паузы.</p>
      </div>
    </div>
  )
}
