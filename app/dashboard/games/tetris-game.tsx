"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, Pause, Play } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

// Типы тетромино (фигур)
const TETROMINOES = [
  // I
  {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#00BFFF", // голубой
  },
  // J
  {
    shape: [
      [2, 0, 0],
      [2, 2, 2],
      [0, 0, 0],
    ],
    color: "#0000FF", // синий
  },
  // L
  {
    shape: [
      [0, 0, 3],
      [3, 3, 3],
      [0, 0, 0],
    ],
    color: "#FFA500", // оранжевый
  },
  // O
  {
    shape: [
      [4, 4],
      [4, 4],
    ],
    color: "#FFFF00", // желтый
  },
  // S
  {
    shape: [
      [0, 5, 5],
      [5, 5, 0],
      [0, 0, 0],
    ],
    color: "#00FF00", // зеленый
  },
  // T
  {
    shape: [
      [0, 6, 0],
      [6, 6, 6],
      [0, 0, 0],
    ],
    color: "#800080", // фиолетовый
  },
  // Z
  {
    shape: [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ],
    color: "#FF0000", // красный
  },
]

// Цвета для тетромино
const COLORS = [
  "transparent",
  "#00BFFF", // I - голубой
  "#0000FF", // J - синий
  "#FFA500", // L - оранжевый
  "#FFFF00", // O - желтый
  "#00FF00", // S - зеленый
  "#800080", // T - фиолетовый
  "#FF0000", // Z - красный
]

export function TetrisGame() {
  const GRID_WIDTH = 10
  const GRID_HEIGHT = 20
  const CELL_SIZE = 25
  const INITIAL_SPEED = 800
  const SPEED_INCREMENT = 50
  const MIN_SPEED = 100

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextCanvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [speed, setSpeed] = useState(INITIAL_SPEED)
  const [speedSetting, setSpeedSetting] = useState(50) // 0-100 для слайдера
  const [gameStarted, setGameStarted] = useState(false)
  const [nextPiece, setNextPiece] = useState<number[][]>([])
  const [currentPiece, setCurrentPiece] = useState<number[][]>([])
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })
  const [grid, setGrid] = useState<number[][]>(
    Array(GRID_HEIGHT)
      .fill(null)
      .map(() => Array(GRID_WIDTH).fill(0)),
  )
  const [fallSpeed, setFallSpeed] = useState(50) // 0-100 для слайдера скорости падения

  const gameLoopRef = useRef<number | null>(null)
  const lastRenderTimeRef = useRef<number>(0)
  const lastTouchTimeRef = useRef<number>(0)
  const touchThrottleTime = 100 // миллисекунды между разрешенными нажатиями
  const gameContainerRef = useRef<HTMLDivElement>(null)

  // Генерация случайной фигуры
  const getRandomPiece = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * TETROMINOES.length)
    return TETROMINOES[randomIndex].shape
  }, [])

  // Инициализация игры
  useEffect(() => {
    if (gameStarted && !gameOver && (!currentPiece.length || currentPiece.length === 0)) {
      const piece = getRandomPiece()
      const next = getRandomPiece()
      setCurrentPiece(piece)
      setNextPiece(next)
      setCurrentPosition({
        x: Math.floor(GRID_WIDTH / 2) - Math.floor(piece[0].length / 2),
        y: 0,
      })
    }
  }, [gameStarted, gameOver, currentPiece, getRandomPiece, GRID_WIDTH])

  // Обработка нажатий клавиш для предотвращения прокрутки страницы
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Проверяем, активна ли игра и нажата ли стрелка
      if (gameContainerRef.current && gameStarted && !gameOver && !isPaused) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
          e.preventDefault() // Предотвращаем прокрутку страницы
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameStarted, gameOver, isPaused])

  // Обновление скорости игры на основе настроек слайдера
  useEffect(() => {
    const calculatedSpeed = INITIAL_SPEED - (speedSetting / 100) * (INITIAL_SPEED - MIN_SPEED)
    setSpeed(calculatedSpeed)
  }, [speedSetting, INITIAL_SPEED, MIN_SPEED])

  // Обновление скорости падения на основе настроек слайдера
  useEffect(() => {
    // Скорость падения: от 800мс (медленно) до 100мс (быстро)
    const calculatedFallSpeed = INITIAL_SPEED - (fallSpeed / 100) * (INITIAL_SPEED - MIN_SPEED)
    setSpeed(calculatedFallSpeed)
  }, [fallSpeed, INITIAL_SPEED, MIN_SPEED])

  // Проверка столкновений
  const checkCollision = useCallback(
    (piece: number[][], position: { x: number; y: number }, grid: number[][]) => {
      if (!piece || !piece.length) return true

      for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
          if (piece[row][col] !== 0) {
            const x = position.x + col
            const y = position.y + row

            if (x < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT || (y >= 0 && grid[y][x] !== 0)) {
              return true
            }
          }
        }
      }
      return false
    },
    [GRID_HEIGHT, GRID_WIDTH],
  )

  // Очистка завершенных линий
  const clearLines = useCallback(
    (currentGrid: number[][]) => {
      let linesCleared = 0
      const newGrid = currentGrid.filter((row) => !row.every((cell) => cell !== 0))
      linesCleared = GRID_HEIGHT - newGrid.length

      while (newGrid.length < GRID_HEIGHT) {
        newGrid.unshift(Array(GRID_WIDTH).fill(0))
      }

      if (linesCleared > 0) {
        setScore((prevScore) => prevScore + linesCleared * 100)
        setLevel((prevLevel) => Math.floor(score / 1000) + 1)
        setSpeed((prevSpeed) => Math.max(MIN_SPEED, INITIAL_SPEED - level * SPEED_INCREMENT))
      }

      return newGrid
    },
    [GRID_HEIGHT, GRID_WIDTH, INITIAL_SPEED, level, MIN_SPEED, SPEED_INCREMENT, score],
  )

  // Размещение фигуры на сетке
  const placePiece = useCallback(
    (currentPiece: number[][], currentPosition: { x: number; y: number }, currentGrid: number[][]) => {
      if (!currentPiece || !currentPiece.length) return currentGrid

      const newGrid = currentGrid.map((row) => [...row])

      for (let row = 0; row < currentPiece.length; row++) {
        for (let col = 0; col < currentPiece[row].length; col++) {
          if (currentPiece[row][col] !== 0) {
            const x = currentPosition.x + col
            const y = currentPosition.y + row
            if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) {
              newGrid[y][x] = currentPiece[row][col]
            }
          }
        }
      }

      return newGrid
    },
    [GRID_HEIGHT, GRID_WIDTH],
  )

  // Вращение фигуры
  const rotatePiece = useCallback((piece: number[][]) => {
    if (!piece || !piece.length) return piece

    const rows = piece.length
    const cols = piece[0].length

    const rotatedPiece: number[][] = Array(cols)
      .fill(null)
      .map(() => Array(rows).fill(0))

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        rotatedPiece[col][rows - 1 - row] = piece[row][col]
      }
    }

    return rotatedPiece
  }, [])

  // Обработка нажатий клавиш
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused || !currentPiece || !currentPiece.length) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const newPosition = { ...currentPosition }

      switch (e.key) {
        case "ArrowLeft":
          newPosition.x -= 1
          if (!checkCollision(currentPiece, newPosition, grid)) {
            setCurrentPosition(newPosition)
          }
          break
        case "ArrowRight":
          newPosition.x += 1
          if (!checkCollision(currentPiece, newPosition, grid)) {
            setCurrentPosition(newPosition)
          }
          break
        case "ArrowDown":
          newPosition.y += 1
          if (!checkCollision(currentPiece, newPosition, grid)) {
            setCurrentPosition(newPosition)
          } else {
            // Фигура достигла дна
            const newGrid = placePiece(currentPiece, currentPosition, grid)
            const clearedGrid = clearLines(newGrid)
            setGrid(clearedGrid)

            const nextPieceToUse = nextPiece
            const nextNextPiece = getRandomPiece()

            setCurrentPiece(nextPieceToUse)
            setNextPiece(nextNextPiece)

            if (nextPieceToUse && nextPieceToUse.length > 0) {
              setCurrentPosition({
                x: Math.floor(GRID_WIDTH / 2) - Math.floor(nextPieceToUse[0].length / 2),
                y: 0,
              })

              if (
                checkCollision(
                  nextPieceToUse,
                  { x: Math.floor(GRID_WIDTH / 2) - Math.floor(nextPieceToUse[0].length / 2), y: 0 },
                  clearedGrid,
                )
              ) {
                setGameOver(true)
                if (score > highScore) {
                  setHighScore(score)
                }
              }
            }
          }
          break
        case " ":
          setIsPaused(!isPaused)
          break
        case "ArrowUp":
          const rotated = rotatePiece(currentPiece)
          if (!checkCollision(rotated, currentPosition, grid)) {
            setCurrentPiece(rotated)
          }
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    checkCollision,
    clearLines,
    currentPiece,
    currentPosition,
    gameOver,
    gameStarted,
    getRandomPiece,
    grid,
    highScore,
    isPaused,
    nextPiece,
    placePiece,
    rotatePiece,
    score,
    GRID_WIDTH,
  ])

  // Игровой цикл с использованием requestAnimationFrame
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused || !currentPiece || !currentPiece.length) return

    const gameLoop = (currentTime: number) => {
      gameLoopRef.current = requestAnimationFrame(gameLoop)

      // Ограничиваем частоту обновления в зависимости от скорости
      if (currentTime - lastRenderTimeRef.current < speed) return
      lastRenderTimeRef.current = currentTime

      const newPosition = { ...currentPosition }
      newPosition.y += 1

      if (!checkCollision(currentPiece, newPosition, grid)) {
        setCurrentPosition(newPosition)
      } else {
        // Фигура достигла дна
        const newGrid = placePiece(currentPiece, currentPosition, grid)
        const clearedGrid = clearLines(newGrid)
        setGrid(clearedGrid)

        const nextPieceToUse = nextPiece
        const nextNextPiece = getRandomPiece()

        setCurrentPiece(nextPieceToUse)
        setNextPiece(nextNextPiece)

        if (nextPieceToUse && nextPieceToUse.length > 0) {
          setCurrentPosition({
            x: Math.floor(GRID_WIDTH / 2) - Math.floor(nextPieceToUse[0].length / 2),
            y: 0,
          })

          if (
            checkCollision(
              nextPieceToUse,
              { x: Math.floor(GRID_WIDTH / 2) - Math.floor(nextPieceToUse[0].length / 2), y: 0 },
              clearedGrid,
            )
          ) {
            setGameOver(true)
            if (score > highScore) {
              setHighScore(score)
            }
          }
        }
      }
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [
    checkCollision,
    clearLines,
    currentPiece,
    currentPosition,
    gameOver,
    gameStarted,
    getRandomPiece,
    grid,
    highScore,
    isPaused,
    nextPiece,
    placePiece,
    score,
    speed,
    GRID_WIDTH,
  ])

  // Отрисовка игры
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !gameStarted) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Отрисовка фона
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Отрисовка сетки
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
    for (let i = 0; i <= GRID_WIDTH; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, GRID_HEIGHT * CELL_SIZE)
      ctx.stroke()
    }

    for (let i = 0; i <= GRID_HEIGHT; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(GRID_WIDTH * CELL_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // Отрисовка сетки
    grid.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          // Основной цвет ячейки
          ctx.fillStyle = COLORS[value]
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)

          // Светлая грань (сверху и слева)
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
          ctx.beginPath()
          ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE)
          ctx.lineTo((x + 1) * CELL_SIZE, y * CELL_SIZE)
          ctx.lineTo(x * CELL_SIZE, (y + 1) * CELL_SIZE)
          ctx.closePath()
          ctx.fill()

          // Темная грань (снизу и справа)
          ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
          ctx.beginPath()
          ctx.moveTo((x + 1) * CELL_SIZE, y * CELL_SIZE)
          ctx.lineTo((x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE)
          ctx.lineTo(x * CELL_SIZE, (y + 1) * CELL_SIZE)
          ctx.closePath()
          ctx.fill()

          // Обводка
          ctx.strokeStyle = "#000"
          ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }
      })
    })

    // Отрисовка текущей фигуры
    if (currentPiece && currentPiece.length > 0) {
      currentPiece.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const posX = (currentPosition.x + x) * CELL_SIZE
            const posY = (currentPosition.y + y) * CELL_SIZE

            // Основной цвет ячейки
            ctx.fillStyle = COLORS[value]
            ctx.fillRect(posX, posY, CELL_SIZE, CELL_SIZE)

            // Светлая грань (сверху и слева)
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
            ctx.beginPath()
            ctx.moveTo(posX, posY)
            ctx.lineTo(posX + CELL_SIZE, posY)
            ctx.lineTo(posX, posY + CELL_SIZE)
            ctx.closePath()
            ctx.fill()

            // Темная грань (снизу и справа)
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
            ctx.beginPath()
            ctx.moveTo(posX + CELL_SIZE, posY)
            ctx.lineTo(posX + CELL_SIZE, posY + CELL_SIZE)
            ctx.lineTo(posX, posY + CELL_SIZE)
            ctx.closePath()
            ctx.fill()

            // Обводка
            ctx.strokeStyle = "#000"
            ctx.strokeRect(posX, posY, CELL_SIZE, CELL_SIZE)
          }
        })
      })
    }

    // Отрисовка следующей фигуры (в отдельном мини-холсте)
    const nextCanvas = nextCanvasRef.current
    if (nextCanvas && nextPiece && nextPiece.length > 0) {
      const nextCtx = nextCanvas.getContext("2d")
      if (nextCtx) {
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height)
        nextCtx.fillStyle = "#1a1a1a"
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height)

        // Центрируем следующую фигуру
        const offsetX = (nextCanvas.width / CELL_SIZE - nextPiece[0].length) / 2
        const offsetY = (nextCanvas.height / CELL_SIZE - nextPiece.length) / 2

        nextPiece.forEach((row, y) => {
          row.forEach((value, x) => {
            if (value !== 0) {
              const posX = (offsetX + x) * CELL_SIZE
              const posY = (offsetY + y) * CELL_SIZE

              // Основной цвет ячейки
              nextCtx.fillStyle = COLORS[value]
              nextCtx.fillRect(posX, posY, CELL_SIZE, CELL_SIZE)

              // Светлая грань (сверху и слева)
              nextCtx.fillStyle = "rgba(255, 255, 255, 0.3)"
              nextCtx.beginPath()
              nextCtx.moveTo(posX, posY)
              nextCtx.lineTo(posX + CELL_SIZE, posY)
              nextCtx.lineTo(posX, posY + CELL_SIZE)
              nextCtx.closePath()
              nextCtx.fill()

              // Темная грань (снизу и справа)
              nextCtx.fillStyle = "rgba(0, 0, 0, 0.3)"
              nextCtx.beginPath()
              nextCtx.moveTo(posX + CELL_SIZE, posY)
              nextCtx.lineTo(posX + CELL_SIZE, posY + CELL_SIZE)
              nextCtx.lineTo(posX, posY + CELL_SIZE)
              nextCtx.closePath()
              nextCtx.fill()

              // Обводка
              nextCtx.strokeStyle = "#000"
              nextCtx.strokeRect(posX, posY, CELL_SIZE, CELL_SIZE)
            }
          })
        })
      }
    }
  }, [CELL_SIZE, COLORS, GRID_HEIGHT, GRID_WIDTH, currentPiece, currentPosition, gameStarted, grid, nextPiece])

  // Сброс игры
  const resetGame = () => {
    setGrid(
      Array(GRID_HEIGHT)
        .fill(null)
        .map(() => Array(GRID_WIDTH).fill(0)),
    )
    const piece = getRandomPiece()
    const next = getRandomPiece()
    setCurrentPiece(piece)
    setNextPiece(next)
    setCurrentPosition({
      x: Math.floor(GRID_WIDTH / 2) - Math.floor(piece[0].length / 2),
      y: 0,
    })
    setScore(0)
    setLevel(1)
    setGameOver(false)
    setIsPaused(false)
    setSpeed(INITIAL_SPEED)
  }

  // Обработчики кнопок управления
  const handleMove = (direction: string) => {
    // Предотвращение частых нажатий
    const now = Date.now()
    if (now - lastTouchTimeRef.current < touchThrottleTime) {
      return
    }
    lastTouchTimeRef.current = now

    if (!gameStarted || gameOver || isPaused || !currentPiece || !currentPiece.length) return

    const newPosition = { ...currentPosition }

    switch (direction) {
      case "left":
        newPosition.x -= 1
        if (!checkCollision(currentPiece, newPosition, grid)) {
          setCurrentPosition(newPosition)
        }
        break
      case "right":
        newPosition.x += 1
        if (!checkCollision(currentPiece, newPosition, grid)) {
          setCurrentPosition(newPosition)
        }
        break
      case "down":
        newPosition.y += 1
        if (!checkCollision(currentPiece, newPosition, grid)) {
          setCurrentPosition(newPosition)
        }
        break
      case "rotate":
        const rotated = rotatePiece(currentPiece)
        if (!checkCollision(rotated, currentPosition, grid)) {
          setCurrentPiece(rotated)
        }
        break
      default:
        break
    }
  }

  // Функция для мгновенного падения фигуры вниз (хард-дроп)
  const hardDrop = () => {
    if (!gameStarted || gameOver || isPaused || !currentPiece || !currentPiece.length) return

    let newY = currentPosition.y

    // Находим самую нижнюю позицию, куда может упасть фигура
    while (!checkCollision(currentPiece, { x: currentPosition.x, y: newY + 1 }, grid)) {
      newY += 1
    }

    // Устанавливаем фигуру в эту позицию
    setCurrentPosition({ ...currentPosition, y: newY })

    // Размещаем фигуру на сетке
    const newGrid = placePiece(currentPiece, { x: currentPosition.x, y: newY }, grid)
    const clearedGrid = clearLines(newGrid)
    setGrid(clearedGrid)

    // Подготавливаем следующую фигуру
    const nextPieceToUse = nextPiece
    const nextNextPiece = getRandomPiece()

    setCurrentPiece(nextPieceToUse)
    setNextPiece(nextNextPiece)

    if (nextPieceToUse && nextPieceToUse.length > 0) {
      setCurrentPosition({
        x: Math.floor(GRID_WIDTH / 2) - Math.floor(nextPieceToUse[0].length / 2),
        y: 0,
      })

      // Проверяем, закончилась ли игра
      if (
        checkCollision(
          nextPieceToUse,
          { x: Math.floor(GRID_WIDTH / 2) - Math.floor(nextPieceToUse[0].length / 2), y: 0 },
          clearedGrid,
        )
      ) {
        setGameOver(true)
        if (score > highScore) {
          setHighScore(score)
        }
      }
    }
  }

  return (
    <div className="flex flex-col items-center" ref={gameContainerRef}>
      {!gameStarted ? (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold">Тетрис</h3>
            <p className="text-sm text-muted-foreground">Управляйте падающими блоками и собирайте линии</p>
          </div>

          <div className="flex flex-col gap-2 w-full max-w-xs">
            <div className="flex items-center justify-between">
              <Label htmlFor="fall-speed" className="text-sm">
                Скорость падения:
              </Label>
              <span className="text-sm">{fallSpeed < 33 ? "Медленно" : fallSpeed < 66 ? "Средне" : "Быстро"}</span>
            </div>
            <Slider
              id="fall-speed"
              className="w-full"
              value={[fallSpeed]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setFallSpeed(value[0])}
            />
          </div>

          <Button onClick={() => setGameStarted(true)} style={{ touchAction: "manipulation" }}>
            Начать игру
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center gap-4 flex-wrap justify-center">
            <Badge variant="outline" className="text-sm">
              Счет: {score}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Уровень: {level}
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
                value={[fallSpeed]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setFallSpeed(value[0])}
                disabled={gameOver}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={GRID_WIDTH * CELL_SIZE}
                height={GRID_HEIGHT * CELL_SIZE}
                className="border border-border rounded-lg shadow-lg dark:border-gray-600"
                style={{ touchAction: "none" }}
              />
              {(gameOver || isPaused) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <div className="text-center p-4 bg-card rounded-lg shadow-lg border border-border">
                    <h3 className="text-xl font-bold">{gameOver ? "Игра окончена!" : "Пауза"}</h3>
                    {gameOver && <p className="mt-2">Ваш счет: {score}</p>}
                    <Button onClick={gameOver ? resetGame : () => setIsPaused(false)} className="mt-4">
                      {gameOver ? "Начать заново" : "Продолжить"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <canvas
                ref={nextCanvasRef}
                width={125}
                height={100}
                className="border border-border rounded-lg shadow-md dark:border-gray-600"
              />
              <p className="text-sm text-muted-foreground">Следующая фигура</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMove("left")}
              aria-label="Move Left"
              style={{ touchAction: "manipulation" }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMove("right")}
              aria-label="Move Right"
              style={{ touchAction: "manipulation" }}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMove("down")}
              aria-label="Move Down"
              style={{ touchAction: "manipulation" }}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMove("rotate")}
              aria-label="Rotate"
              style={{ touchAction: "manipulation" }}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={hardDrop}
              aria-label="Hard Drop"
              style={{ touchAction: "manipulation" }}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setIsPaused(!isPaused)
            }}
            style={{ touchAction: "manipulation" }}
          >
            {isPaused ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Продолжить
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Пауза
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
