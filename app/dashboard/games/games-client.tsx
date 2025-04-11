"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCw,
} from "lucide-react"

/* =============================== */
/*           Главный компонент     */
/* =============================== */
export function GamesClient() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Игры</h1>
          <p className="text-muted-foreground">
            Отдохните и поиграйте в наши модернизированные игры
          </p>
        </div>

        <Tabs defaultValue="tictactoe" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="tictactoe">Крестики-нолики</TabsTrigger>
            <TabsTrigger value="memory">Память</TabsTrigger>
            <TabsTrigger value="quiz">Викторина</TabsTrigger>
            <TabsTrigger value="snake">Змейка</TabsTrigger>
            <TabsTrigger value="tetris">Тетрис</TabsTrigger>
            <TabsTrigger value="racing">Гонки</TabsTrigger>
          </TabsList>

          <TabsContent value="tictactoe" className="mt-6">
            <TicTacToe />
          </TabsContent>

          <TabsContent value="memory" className="mt-6">
            <MemoryGame />
          </TabsContent>

          <TabsContent value="quiz" className="mt-6">
            <Quiz />
          </TabsContent>

          <TabsContent value="snake" className="mt-6">
            <SnakeGame />
          </TabsContent>

          <TabsContent value="tetris" className="mt-6">
            <BlockBlastGame />
          </TabsContent>

          <TabsContent value="racing" className="mt-6">
            <RacingGame />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/* =============================== */
/*         Игра "Крестики-нолики"  */
/* =============================== */
function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)
  const [gameOver, setGameOver] = useState(false)

  const handleClick = (i: number) => {
    if (board[i] || gameOver) return

    const newBoard = [...board]
    newBoard[i] = xIsNext ? "X" : "O"
    setBoard(newBoard)
    setXIsNext(!xIsNext)

    const winner = calculateWinner(newBoard)
    if (winner || newBoard.every((square) => square)) {
      setGameOver(true)
    }
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setXIsNext(true)
    setGameOver(false)
  }

  const winner = calculateWinner(board)
  const status = winner
    ? `Победитель: ${winner}`
    : board.every((square) => square)
    ? "Ничья!"
    : `Следующий ход: ${xIsNext ? "X" : "O"}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Крестики-нолики</CardTitle>
        <CardDescription>Классическая игра для двух игроков</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="mb-4 text-lg font-medium">{status}</div>
          <div className="grid grid-cols-3 gap-2">
            {board.map((square, i) => (
              <Button
                key={i}
                variant="outline"
                className="h-20 w-20 text-2xl"
                onClick={() => handleClick(i)}
                style={{ touchAction: "manipulation" }}
              >
                {square}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={resetGame} style={{ touchAction: "manipulation" }}>
          Начать заново
        </Button>
      </CardFooter>
    </Card>
  )
}

function calculateWinner(squares: Array<string | null>) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // горизонтали
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // вертикали
    [0, 4, 8],
    [2, 4, 6], // диагонали
  ]

  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}

/* =============================== */
/*          Игра "Память"         */
/* =============================== */
function MemoryGame() {
  const emojis = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"]
  const allEmojis = [...emojis, ...emojis]

  const [cards, setCards] = useState(() =>
    shuffle(allEmojis).map((emoji, index) => ({
      id: index,
      content: emoji,
      flipped: false,
      matched: false,
    })),
  )
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)

  const handleCardClick = (id: number) => {
    if (cards[id].flipped || cards[id].matched) return
    if (flippedCards.length === 2) return

    const newCards = [...cards]
    newCards[id].flipped = true
    setCards(newCards)
    const newFlipped = [...flippedCards, id]
    setFlippedCards(newFlipped)

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1)
      const [firstId, secondId] = newFlipped
      if (cards[firstId].content === cards[secondId].content) {
        setTimeout(() => {
          const updatedCards = [...cards]
          updatedCards[firstId].matched = true
          updatedCards[secondId].matched = true
          setCards(updatedCards)
          setFlippedCards([])
          if (updatedCards.every((card) => card.matched)) {
            setGameCompleted(true)
          }
        }, 500)
      } else {
        setTimeout(() => {
          const resetCards = [...cards]
          resetCards[firstId].flipped = false
          resetCards[secondId].flipped = false
          setCards(resetCards)
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  const resetGame = () => {
    setCards(
      shuffle(allEmojis).map((emoji, index) => ({
        id: index,
        content: emoji,
        flipped: false,
        matched: false,
      })),
    )
    setFlippedCards([])
    setMoves(0)
    setGameCompleted(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Игра на память</CardTitle>
        <CardDescription>Найдите все пары одинаковых карточек</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              Ходы: {moves}
            </Badge>
            {gameCompleted && (
              <Badge className="bg-green-500">Игра завершена!</Badge>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {cards.map((card) => (
              <Button
                key={card.id}
                variant="outline"
                className="h-16 w-16 text-2xl transition-all"
                onClick={() => handleCardClick(card.id)}
                disabled={card.matched}
                style={{ touchAction: "manipulation" }}
              >
                {card.flipped || card.matched ? card.content : "?"}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={resetGame} style={{ touchAction: "manipulation" }}>
          Начать заново
        </Button>
      </CardFooter>
    </Card>
  )
}

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/* =============================== */
/*          Викторина             */
/* =============================== */
// Новый формат вопросов: "Столица <страна>" с отображением флага
const countryQuizData = [
  { country: "Франция", capital: "Париж", flag: "🇫🇷" },
  { country: "Германия", capital: "Берлин", flag: "🇩🇪" },
  { country: "Япония", capital: "Токио", flag: "🇯🇵" },
  { country: "Италия", capital: "Рим", flag: "🇮🇹" },
  { country: "Бразилия", capital: "Бразилиа", flag: "🇧🇷" },
  { country: "Канада", capital: "Оттава", flag: "🇨🇦" },
  { country: "Австралия", capital: "Канберра", flag: "🇦🇺" },
  { country: "Россия", capital: "Москва", flag: "🇷🇺" },
]

function Quiz() {
  // Формирование вопросов на основе countryQuizData
  const allQuestions = useMemo(
    () =>
      countryQuizData.map((item) => ({
        question: `Столица ${item.country}? ${item.flag}`,
        options: shuffle([
          item.capital,
          ...[...countryQuizData]
            .filter((c) => c.capital !== item.capital)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3),
        ]).map((opt) =>
          typeof opt === "string" ? opt : opt.capital,
        ),
        answer: 0, // ответ будет найден по поиску правильного варианта
        correctCapital: item.capital,
      })),
    [],
  )

  // Выбираем 5 случайных вопросов при каждом запуске
  const [questions, setQuestions] = useState<typeof allQuestions>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    resetQuiz()
  }, [])

  const handleAnswer = (optionIndex: number) => {
    if (answered) return
    setSelectedOption(optionIndex)
    setAnswered(true)

    const current = questions[currentQuestion]
    // Находим индекс правильного ответа (correctCapital)
    const correctIndex = current.options.findIndex(
      (opt) => opt === current.correctCapital,
    )

    if (optionIndex === correctIndex) {
      setScore((prev) => prev + 1)
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
        setSelectedOption(null)
        setAnswered(false)
      } else {
        setShowResult(true)
      }
    }, 1000)
  }

  const resetQuiz = () => {
    const shuffled = shuffle([...allQuestions]).slice(0, 5)
    setQuestions(shuffled)
    setCurrentQuestion(0)
    setScore(0)
    setShowResult(false)
    setSelectedOption(null)
    setAnswered(false)
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Викторина</CardTitle>
          <CardDescription>Загрузка вопросов...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Викторина</CardTitle>
        <CardDescription>Проверьте свои знания столиц стран</CardDescription>
      </CardHeader>
      <CardContent>
        {showResult ? (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-xl font-bold">Результат</h3>
            <p className="text-lg">
              Вы ответили правильно на {score} из {questions.length} вопросов
            </p>
            <div className="text-2xl">
              {score === questions.length
                ? "🎉 Отлично!"
                : score >= questions.length / 2
                ? "👍 Хорошо!"
                : "😕 Попробуйте еще раз!"}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between">
              <Badge variant="outline">
                Вопрос {currentQuestion + 1} из {questions.length}
              </Badge>
              <Badge variant="outline">Счет: {score}</Badge>
            </div>
            <h3 className="text-lg font-medium">
              {questions[currentQuestion].question}
            </h3>
            <div className="flex flex-col gap-2">
              {questions[currentQuestion].options.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    selectedOption === index
                      ? index ===
                        questions[currentQuestion].options.findIndex(
                          (opt) => opt === questions[currentQuestion].correctCapital,
                        )
                        ? "default"
                        : "destructive"
                      : answered &&
                        index ===
                          questions[currentQuestion].options.findIndex(
                            (opt) => opt === questions[currentQuestion].correctCapital,
                          )
                      ? "default"
                      : "outline"
                  }
                  className="justify-start text-left"
                  onClick={() => handleAnswer(index)}
                  disabled={answered}
                  style={{ touchAction: "manipulation" }}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        {showResult && (
          <Button onClick={resetQuiz} style={{ touchAction: "manipulation" }}>
            Начать заново
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

/* =============================== */
/*           Змейка              */
/* =============================== */
function SnakeGame() {
  const GRID_SIZE = 20
  const CELL_SIZE = 20

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(150)
  const [highScore, setHighScore] = useState(0)
  const [snake, setSnake] = useState([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ])
  const [food, setFood] = useState({ x: 15, y: 10 })
  const [direction, setDirection] = useState("RIGHT")
  const [nextDirection, setNextDirection] = useState("RIGHT")

  const generateFood = useCallback(() => {
    const x = Math.floor(Math.random() * GRID_SIZE)
    const y = Math.floor(Math.random() * GRID_SIZE)
    return { x, y }
  }, [])

  const checkCollision = useCallback(
    (head: { x: number; y: number }) => {
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return true
      }
      for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
          return true
        }
      }
      return false
    },
    [snake, GRID_SIZE],
  )

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
          setIsPaused((prev) => !prev)
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [direction, gameOver])

  useEffect(() => {
    if (gameOver || isPaused) return

    const moveSnake = () => {
      setDirection(nextDirection)
      const newSnake = [...snake]
      const head = { ...newSnake[0] }

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
        default:
          break
      }

      if (checkCollision(head)) {
        setGameOver(true)
        if (score > highScore) {
          setHighScore(score)
        }
        return
      }

      newSnake.unshift(head)

      if (head.x === food.x && head.y === food.y) {
        setScore((s) => s + 1)
        if (speed > 50) {
          setSpeed((s) => Math.max(s - 10, 50))
        }
        let newFood = generateFood()
        while (newSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)) {
          newFood = generateFood()
        }
        setFood(newFood)
      } else {
        newSnake.pop()
      }
      setSnake(newSnake)
    }

    const interval = setInterval(moveSnake, speed)
    return () => clearInterval(interval)
  }, [snake, food, direction, nextDirection, gameOver, isPaused, checkCollision, generateFood, speed, score, highScore])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "#4CAF50" : "#8BC34A"
      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      ctx.strokeStyle = "#388E3C"
      ctx.strokeRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    })

    ctx.fillStyle = "#F44336"
    ctx.beginPath()
    ctx.arc(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
  }, [snake, food])

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
    setSpeed(150)
  }

  // Для мобильных устройств: добавляем обработку касаний для кнопок управления
  const handleDirectionButton = (newDir: string) => {
    if (gameOver || isPaused) return
    switch (newDir) {
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
    <Card>
      <CardHeader>
        <CardTitle>Змейка</CardTitle>
        <CardDescription>
          Управляйте змейкой с помощью стрелок, кнопок ниже или касаний. Соберите еду и избегайте столкновений.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              Счет: {score}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Рекорд: {highScore}
            </Badge>
            {gameOver && <Badge variant="destructive">Игра окончена!</Badge>}
            {isPaused && !gameOver && <Badge variant="secondary">Пауза</Badge>}
          </div>

          <div className="relative mb-4">
            <canvas
              ref={canvasRef}
              width={GRID_SIZE * CELL_SIZE}
              height={GRID_SIZE * CELL_SIZE}
              className="border border-border"
            />
            {(gameOver || isPaused) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center">
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

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="h-12 w-12"
              onClick={() => handleDirectionButton("UP")}
              disabled={gameOver}
              style={{ touchAction: "manipulation" }}
            >
              <ArrowUp className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              className="h-12 w-12"
              onClick={() => handleDirectionButton("LEFT")}
              disabled={gameOver}
              style={{ touchAction: "manipulation" }}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              className="h-12 w-12"
              onClick={() => handleDirectionButton("RIGHT")}
              disabled={gameOver}
              style={{ touchAction: "manipulation" }}
            >
              <ArrowRight className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              className="h-12 w-12 col-span-3"
              onClick={() => handleDirectionButton("DOWN")}
              disabled={gameOver}
              style={{ touchAction: "manipulation" }}
            >
              <ArrowDown className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={resetGame} style={{ touchAction: "manipulation" }}>
          Начать заново
        </Button>
      </CardFooter>
    </Card>
  )
}

/* =============================== */
/*             Тетрис             */
/* =============================== */
function BlockBlastGame() {
  const GRID_WIDTH = 10
  const GRID_HEIGHT = 20
  const CELL_SIZE = 25
  const INITIAL_SPEED = 800
  const SPEED_INCREMENT = 50
  const MIN_SPEED = 100

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [speed, setSpeed] = useState(INITIAL_SPEED)
  const [nextPiece, setNextPiece] = useState<number[][]>([])

  const tetrominoes = useMemo(
    () => [
      // I - голубой
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      // J - синий
      [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0],
      ],
      // L - оранжевый
      [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0],
      ],
      // O - желтый
      [
        [4, 4],
        [4, 4],
      ],
      // S - зеленый
      [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0],
      ],
      // T - фиолетовый
      [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0],
      ],
      // Z - красный
      [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
      ],
    ],
    [],
  )

  const colors = useMemo(
    () => [
      "transparent",
      "#00BFFF",
      "#0000FF",
      "#FFA500",
      "#FFFF00",
      "#00FF00",
      "#800080",
      "#FF0000",
    ],
    [],
  )

  const [grid, setGrid] = useState<number[][]>(
    Array(GRID_HEIGHT)
      .fill(null)
      .map(() => Array(GRID_WIDTH).fill(0)),
  )
  const [currentPiece, setCurrentPiece] = useState<number[][]>([])
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })

  const getRandomPiece = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * tetrominoes.length)
    return tetrominoes[randomIndex]
  }, [tetrominoes])

  useEffect(() => {
    if (!gameOver && currentPiece.length === 0) {
      const piece = getRandomPiece()
      const next = getRandomPiece()
      setCurrentPiece(piece)
      setNextPiece(next)
      setCurrentPosition({
        x: Math.floor(GRID_WIDTH / 2) - Math.floor(piece[0].length / 2),
        y: 0,
      })
    }
  }, [gameOver, currentPiece.length, getRandomPiece, GRID_WIDTH])

  const checkCollision = useCallback(
    (piece: number[][], position: { x: number; y: number }, grid: number[][]) => {
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

  const clearLines = useCallback(
    (currentGrid: number[][]) => {
      let linesCleared = 0
      const newGrid = currentGrid.filter((row) => !row.every((cell) => cell !== 0))
      linesCleared = GRID_HEIGHT - newGrid.length

      while (newGrid.length < GRID_HEIGHT) {
        newGrid.unshift(Array(GRID_WIDTH).fill(0))
      }

      if (linesCleared > 0) {
        setScore((prev) => prev + linesCleared * 100)
        setLevel(Math.floor(score / 1000) + 1)
        setSpeed((prevSpeed) => Math.max(MIN_SPEED, INITIAL_SPEED - level * SPEED_INCREMENT))
      }

      return newGrid
    },
    [GRID_HEIGHT, GRID_WIDTH, INITIAL_SPEED, level, MIN_SPEED, SPEED_INCREMENT, score],
  )

  const placePiece = useCallback(
    (currentPiece: number[][], currentPosition: { x: number; y: number }, currentGrid: number[][]) => {
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

  const rotatePiece = useCallback((piece: number[][]) => {
    const rows = piece.length
    const cols = piece[0].length
    const rotated: number[][] = Array(cols)
      .fill(null)
      .map(() => Array(rows).fill(0))
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        rotated[col][rows - 1 - row] = piece[row][col]
      }
    }
    return rotated
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || isPaused) return
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
            const newGrid = placePiece(currentPiece, currentPosition, grid)
            const cleared = clearLines(newGrid)
            setGrid(cleared)
            const nextToUse = nextPiece
            const nextNext = getRandomPiece()
            setCurrentPiece(nextToUse)
            setNextPiece(nextNext)
            setCurrentPosition({
              x: Math.floor(GRID_WIDTH / 2) - Math.floor(nextToUse[0].length / 2),
              y: 0,
            })
            if (
              checkCollision(
                nextToUse,
                { x: Math.floor(GRID_WIDTH / 2) - Math.floor(nextToUse[0].length / 2), y: 0 },
                cleared,
              )
            ) {
              setGameOver(true)
              if (score > highScore) {
                setHighScore(score)
              }
            }
          }
          break
        case " ":
          setIsPaused((prev) => !prev)
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
  }, [checkCollision, clearLines, currentPiece, currentPosition, grid, isPaused, nextPiece, placePiece, rotatePiece, getRandomPiece, score, highScore, GRID_WIDTH])

  useEffect(() => {
    if (gameOver || isPaused) return
    const drop = () => {
      const newPos = { ...currentPosition, y: currentPosition.y + 1 }
      if (!checkCollision(currentPiece, newPos, grid)) {
        setCurrentPosition(newPos)
      } else {
        const newGrid = placePiece(currentPiece, currentPosition, grid)
        const cleared = clearLines(newGrid)
        setGrid(cleared)
        const nextToUse = nextPiece
        const nextNext = getRandomPiece()
        setCurrentPiece(nextToUse)
        setNextPiece(nextNext)
        setCurrentPosition({
          x: Math.floor(GRID_WIDTH / 2) - Math.floor(nextToUse[0].length / 2),
          y: 0,
        })
        if (
          checkCollision(
            nextToUse,
            { x: Math.floor(GRID_WIDTH / 2) - Math.floor(nextToUse[0].length / 2), y: 0 },
            cleared,
          )
        ) {
          setGameOver(true)
          if (score > highScore) {
            setHighScore(score)
          }
        }
      }
    }
    const interval = setInterval(drop, speed)
    return () => clearInterval(interval)
  }, [checkCollision, clearLines, currentPiece, currentPosition, grid, isPaused, nextPiece, placePiece, speed, getRandomPiece, score, highScore, GRID_WIDTH])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    grid.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          ctx.fillStyle = colors[value]
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
          ctx.strokeStyle = "#000"
          ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }
      })
    })
    currentPiece.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          ctx.fillStyle = colors[value]
          ctx.fillRect((currentPosition.x + x) * CELL_SIZE, (currentPosition.y + y) * CELL_SIZE, CELL_SIZE, CELL_SIZE)
          ctx.strokeStyle = "#000"
          ctx.strokeRect((currentPosition.x + x) * CELL_SIZE, (currentPosition.y + y) * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }
      })
    })
  }, [colors, currentPiece, currentPosition, grid])

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

  const handleMove = (direction: string) => {
    if (gameOver || isPaused) return
    const CAR_SPEED = 20
    const newPos = { ...currentPosition }
    switch (direction) {
      case "left":
        newPos.x -= 1
        if (!checkCollision(currentPiece, newPos, grid)) setCurrentPosition(newPos)
        break
      case "right":
        newPos.x += 1
        if (!checkCollision(currentPiece, newPos, grid)) setCurrentPosition(newPos)
        break
      case "down":
        newPos.y += 1
        if (!checkCollision(currentPiece, newPos, grid)) setCurrentPosition(newPos)
        break
      case "rotate":
        const rotated = rotatePiece(currentPiece)
        if (!checkCollision(rotated, currentPosition, grid)) setCurrentPiece(rotated)
        break
      default:
        break
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тетрис</CardTitle>
        <CardDescription>Вращайте фигуры и заполняйте линии</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center gap-4">
            <Badge variant="outline" className="text-sm">Счет: {score}</Badge>
            <Badge variant="outline" className="text-sm">Уровень: {level}</Badge>
            <Badge variant="outline" className="text-sm">Рекорд: {highScore}</Badge>
            {gameOver && <Badge variant="destructive">Игра окончена!</Badge>}
            {isPaused && !gameOver && <Badge variant="secondary">Пауза</Badge>}
          </div>
          <div className="relative mb-4">
            <canvas
              ref={canvasRef}
              width={GRID_WIDTH * CELL_SIZE}
              height={GRID_HEIGHT * CELL_SIZE}
              className="border border-border"
            />
            {(gameOver || isPaused) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center">
                  <h3 className="text-xl font-bold">{gameOver ? "Игра окончена!" : "Пауза"}</h3>
                  {gameOver && <p className="mt-2">Ваш счет: {score}</p>}
                  <Button onClick={gameOver ? resetGame : () => setIsPaused(false)} className="mt-4" variant="default" style={{ touchAction: "manipulation" }}>
                    {gameOver ? "Начать заново" : "Продолжить"}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-4 justify-center">
            <Button variant="outline" className="h-12 w-24" onClick={() => handleMove("left")} disabled={gameOver || isPaused} style={{ touchAction: "manipulation" }}>
              <ArrowLeft className="h-6 w-6" /> Влево
            </Button>
            <Button variant="default" className="h-12 w-24" onClick={() => handleMove("rotate")} style={{ touchAction: "manipulation" }}>
              <RotateCw className="h-6 w-6" /> Вращать
            </Button>
            <Button variant="outline" className="h-12 w-24" onClick={() => handleMove("right")} disabled={gameOver || isPaused} style={{ touchAction: "manipulation" }}>
              <ArrowRight className="h-6 w-6" /> Вправо
            </Button>
            <Button variant="outline" className="h-12 w-24" onClick={() => handleMove("down")} disabled={gameOver || isPaused} style={{ touchAction: "manipulation" }}>
              <ArrowDown className="h-6 w-6" /> Вниз
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={resetGame} style={{ touchAction: "manipulation" }}>
          Начать заново
        </Button>
      </CardFooter>
    </Card>
  )
}

/* =============================== */
/*           Гонки               */
/* =============================== */
function RacingGame() {
  const CANVAS_WIDTH = 400
  const CANVAS_HEIGHT = 600
  const ROAD_WIDTH = 300
  const CAR_WIDTH = 40
  const CAR_HEIGHT = 70
  const OBSTACLE_WIDTH = 40
  const OBSTACLE_HEIGHT = 70
  const OBSTACLE_SPEED_MIN = 5
  const OBSTACLE_SPEED_MAX = 10
  const OBSTACLE_FREQUENCY = 1500
  const SPEED_INCREMENT = 0.1

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [carPosition, setCarPosition] = useState(CANVAS_WIDTH / 2 - CAR_WIDTH / 2)
  const [obstacles, setObstacles] = useState<{ x: number; y: number; speed: number }[]>([])
  const [roadSpeed, setRoadSpeed] = useState(5)
  const [roadOffset, setRoadOffset] = useState(0)

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return
    const handleKeyDown = (e: KeyboardEvent) => {
      const CAR_SPEED = 10
      switch (e.key) {
        case "ArrowLeft":
          setCarPosition((prev) =>
            Math.max(CANVAS_WIDTH / 2 - ROAD_WIDTH / 2 + 10, prev - CAR_SPEED),
          )
          break
        case "ArrowRight":
          setCarPosition((prev) =>
            Math.min(CANVAS_WIDTH / 2 + ROAD_WIDTH / 2 - CAR_WIDTH - 10, prev + CAR_SPEED),
          )
          break
        case " ":
          setIsPaused((prev) => !prev)
          break
        default:
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameStarted, gameOver, isPaused])

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return

    const obstacleInterval = setInterval(() => {
      const randomX =
        Math.random() * (ROAD_WIDTH - OBSTACLE_WIDTH) + (CANVAS_WIDTH / 2 - ROAD_WIDTH / 2)
      const randomSpeed =
        Math.random() * (OBSTACLE_SPEED_MAX - OBSTACLE_SPEED_MIN) + OBSTACLE_SPEED_MIN + score * SPEED_INCREMENT
      setObstacles((prev) => [...prev, { x: randomX, y: -OBSTACLE_HEIGHT, speed: randomSpeed }])
    }, OBSTACLE_FREQUENCY)

    const gameLoop = setInterval(() => {
      setObstacles((prev) => {
        const updated = prev
          .map((obs) => ({ ...obs, y: obs.y + obs.speed }))
          .filter((obs) => obs.y < CANVAS_HEIGHT)
        const playerCar = {
          x: carPosition,
          y: CANVAS_HEIGHT - CAR_HEIGHT - 20,
          width: CAR_WIDTH,
          height: CAR_HEIGHT,
        }
        for (const obs of updated) {
          const obstacleCar = {
            x: obs.x,
            y: obs.y,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT,
          }
          if (
            playerCar.x < obstacleCar.x + obstacleCar.width &&
            playerCar.x + playerCar.width > obstacleCar.x &&
            playerCar.y < obstacleCar.y + obstacleCar.height &&
            playerCar.y + playerCar.height > obstacleCar.y
          ) {
            setGameOver(true)
            if (score > highScore) setHighScore(score)
            clearInterval(gameLoop)
            clearInterval(obstacleInterval)
          }
        }
        const passed = prev.filter((o) => o.y < CANVAS_HEIGHT && o.y + OBSTACLE_HEIGHT >= CANVAS_HEIGHT)
        if (passed.length > 0) {
          setScore((s) => s + passed.length)
          setRoadSpeed((s) => s + SPEED_INCREMENT)
        }
        return updated
      })
      setRoadOffset((prev) => (prev + roadSpeed) % 40)
    }, 1000 / 60)
    return () => {
      clearInterval(gameLoop)
      clearInterval(obstacleInterval)
    }
  }, [gameStarted, gameOver, isPaused, carPosition, score, highScore, roadSpeed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.fillStyle = "#4CAF50"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.fillStyle = "#333"
    ctx.fillRect(CANVAS_WIDTH / 2 - ROAD_WIDTH / 2, 0, ROAD_WIDTH, CANVAS_HEIGHT)
    ctx.fillStyle = "#FFF"
    for (let i = -1; i < CANVAS_HEIGHT / 40 + 1; i++) {
      ctx.fillRect(CANVAS_WIDTH / 2 - 5, i * 40 - roadOffset, 10, 20)
    }
    ctx.fillRect(CANVAS_WIDTH / 2 - ROAD_WIDTH / 2, 0, 5, CANVAS_HEIGHT)
    ctx.fillRect(CANVAS_WIDTH / 2 + ROAD_WIDTH / 2 - 5, 0, 5, CANVAS_HEIGHT)
    if (gameStarted) {
      ctx.fillStyle = "#FF0000"
      ctx.fillRect(carPosition, CANVAS_HEIGHT - CAR_HEIGHT - 20, CAR_WIDTH, CAR_HEIGHT)
      ctx.fillStyle = "#000"
      ctx.fillRect(carPosition + 5, CANVAS_HEIGHT - CAR_HEIGHT - 15, CAR_WIDTH - 10, 5)
      ctx.fillRect(carPosition + 5, CANVAS_HEIGHT - 40, CAR_WIDTH - 10, 5)
      ctx.fillStyle = "#000"
      ctx.fillRect(carPosition - 3, CANVAS_HEIGHT - CAR_HEIGHT - 10, 6, 15)
      ctx.fillRect(carPosition + CAR_WIDTH - 3, CANVAS_HEIGHT - CAR_HEIGHT - 10, 6, 15)
      ctx.fillRect(carPosition - 3, CANVAS_HEIGHT - 40, 6, 15)
      ctx.fillRect(carPosition + CAR_WIDTH - 3, CANVAS_HEIGHT - 40, 6, 15)
      obstacles.forEach((obs) => {
        ctx.fillStyle = "#0000FF"
        ctx.fillRect(obs.x, obs.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT)
        ctx.fillStyle = "#000"
        ctx.fillRect(obs.x + 5, obs.y + 5, OBSTACLE_WIDTH - 10, 5)
        ctx.fillRect(obs.x + 5, obs.y + OBSTACLE_HEIGHT - 10, OBSTACLE_WIDTH - 10, 5)
        ctx.fillStyle = "#000"
        ctx.fillRect(obs.x - 3, obs.y + 10, 6, 15)
        ctx.fillRect(obs.x + OBSTACLE_WIDTH - 3, obs.y + 10, 6, 15)
        ctx.fillRect(obs.x - 3, obs.y + OBSTACLE_HEIGHT - 25, 6, 15)
        ctx.fillRect(obs.x + OBSTACLE_WIDTH - 3, obs.y + OBSTACLE_HEIGHT - 25, 6, 15)
      })
    }
    ctx.fillStyle = "#FFF"
    ctx.font = "20px Arial"
    ctx.fillText(`Счет: ${score}`, 20, 30)
    ctx.fillText(`Рекорд: ${highScore}`, 20, 60)
    if (!gameStarted || gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = "#FFF"
      ctx.font = "30px Arial"
      ctx.textAlign = "center"
      if (gameOver) {
        ctx.fillText("Игра окончена!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30)
        ctx.fillText(`Ваш счет: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10)
        ctx.font = "20px Arial"
        ctx.fillText("Нажмите кнопку, чтобы начать заново", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
      } else {
        ctx.fillText("Гонки", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30)
        ctx.font = "20px Arial"
        ctx.fillText("Нажмите кнопку, чтобы начать", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10)
        ctx.fillText("Используйте стрелки для управления", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
      }
    }
    if (isPaused && gameStarted && !gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = "#FFF"
      ctx.font = "30px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Пауза", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.font = "20px Arial"
      ctx.fillText("Нажмите пробел, чтобы продолжить", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
    }
  }, [gameStarted, gameOver, isPaused, carPosition, obstacles, score, highScore, roadOffset])

  const resetGame = () => {
    setScore(0)
    setObstacles([])
    setCarPosition(CANVAS_WIDTH / 2 - CAR_WIDTH / 2)
    setGameOver(false)
    setIsPaused(false)
    setRoadSpeed(5)
    setRoadOffset(0)
    setGameStarted(true)
  }

  const handleMoveButton = (direction: string) => {
    if (!gameStarted || gameOver || isPaused) return
    const CAR_SPEED = 20
    switch (direction) {
      case "left":
        setCarPosition((prev) => Math.max(CANVAS_WIDTH / 2 - ROAD_WIDTH / 2 + 10, prev - CAR_SPEED))
        break
      case "right":
        setCarPosition((prev) => Math.min(CANVAS_WIDTH / 2 + ROAD_WIDTH / 2 - CAR_WIDTH - 10, prev + CAR_SPEED))
        break
      default:
        break
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Гонки</CardTitle>
        <CardDescription>
          Управляйте машиной с помощью стрелок или кнопок ниже. Избегайте столкновений с препятствиями.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center gap-4">
            <Badge variant="outline" className="text-sm">Счет: {score}</Badge>
            <Badge variant="outline" className="text-sm">Рекорд: {highScore}</Badge>
            {gameOver && <Badge variant="destructive">Игра окончена!</Badge>}
            {isPaused && !gameOver && <Badge variant="secondary">Пауза</Badge>}
          </div>
          <div className="relative mb-4">
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border border-border" />
          </div>
          <div className="flex gap-4 mt-4 justify-center">
            <Button variant="outline" className="h-12 w-24" onClick={() => handleMoveButton("left")} disabled={!gameStarted || gameOver || isPaused} style={{ touchAction: "manipulation" }}>
              <ArrowLeft className="h-6 w-6" /> Влево
            </Button>
            <Button variant="default" className="h-12 w-24" onClick={gameOver || !gameStarted ? resetGame : () => setIsPaused(!isPaused)} style={{ touchAction: "manipulation" }}>
              {gameOver || !gameStarted ? "Старт" : isPaused ? "Продолжить" : "Пауза"}
            </Button>
            <Button variant="outline" className="h-12 w-24" onClick={() => handleMoveButton("right")} disabled={!gameStarted || gameOver || isPaused} style={{ touchAction: "manipulation" }}>
              <ArrowRight className="h-6 w-6" /> Вправо
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-center text-sm text-muted-foreground">
          <p>Используйте стрелки влево и вправо для управления машиной.</p>
          <p>Пробел для паузы.</p>
        </div>
      </CardFooter>
    </Card>
  )
}
  
// Вспомогательная функция для перемешивания массива (используется во всех играх)
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}
