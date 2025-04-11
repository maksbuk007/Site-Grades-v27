"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCw } from "lucide-react"

export function GamesClient() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Игры</h1>
          <p className="text-muted-foreground">Отдохните и развлекитесь с нашими простыми онлайн-играми</p>
        </div>

        <Tabs defaultValue="tictactoe" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="tictactoe">Крестики-нолики</TabsTrigger>
            <TabsTrigger value="memory">Игра на память</TabsTrigger>
            <TabsTrigger value="quiz">Викторина</TabsTrigger>
            <TabsTrigger value="snake">Змейка</TabsTrigger>
            <TabsTrigger value="blockblast">Тетрис</TabsTrigger>
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

          <TabsContent value="blockblast" className="mt-6">
            <BlockBlastGame />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Крестики-нолики
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
              <Button key={i} variant="outline" className="h-20 w-20 text-2xl" onClick={() => handleClick(i)}>
                {square}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={resetGame}>Начать заново</Button>
      </CardFooter>
    </Card>
  )
}

// Функция для определения победителя
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

// Игра на память
function MemoryGame() {
  const emojis = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"]
  const allEmojis = [...emojis, ...emojis]

  const [cards, setCards] = useState(() => {
    return shuffle(allEmojis).map((emoji, index) => ({
      id: index,
      content: emoji,
      flipped: false,
      matched: false,
    }))
  })

  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)

  const handleCardClick = (id: number) => {
    // Игнорировать клик, если карта уже перевернута или совпала
    if (cards[id].flipped || cards[id].matched) return

    // Игнорировать третий клик, пока не обработаны первые два
    if (flippedCards.length === 2) return

    // Обновить состояние карт
    const newCards = [...cards]
    newCards[id].flipped = true
    setCards(newCards)

    // Добавить карту к перевернутым
    const newFlippedCards = [...flippedCards, id]
    setFlippedCards(newFlippedCards)

    // Если перевернуты две карты
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1)

      // Проверить совпадение
      const [firstId, secondId] = newFlippedCards
      if (cards[firstId].content === cards[secondId].content) {
        // Совпадение найдено
        setTimeout(() => {
          const matchedCards = [...cards]
          matchedCards[firstId].matched = true
          matchedCards[secondId].matched = true
          setCards(matchedCards)
          setFlippedCards([])

          // Проверить завершение игры
          if (matchedCards.every((card) => card.matched)) {
            setGameCompleted(true)
          }
        }, 500)
      } else {
        // Нет совпадения, перевернуть карты обратно
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
            {gameCompleted && <Badge className="bg-green-500">Игра завершена!</Badge>}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {cards.map((card) => (
              <Button
                key={card.id}
                variant="outline"
                className="h-16 w-16 text-2xl transition-all"
                onClick={() => handleCardClick(card.id)}
                disabled={card.matched}
              >
                {card.flipped || card.matched ? card.content : "?"}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={resetGame}>Начать заново</Button>
      </CardFooter>
    </Card>
  )
}

// Функция для перемешивания массива
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// Викторина
function Quiz() {
  const questions = [
    {
      question: "Какая планета ближе всего к Солнцу?",
      options: ["Венера", "Меркурий", "Марс", "Земля"],
      answer: 1,
    },
    {
      question: "Сколько сторон у пятиугольника?",
      options: ["4", "5", "6", "7"],
      answer: 1,
    },
    {
      question: 'Какой элемент обозначается символом "O"?',
      options: ["Золото", "Кислород", "Осмий", "Олово"],
      answer: 1,
    },
    {
      question: "Какая страна самая большая по площади?",
      options: ["Китай", "США", "Канада", "Россия"],
      answer: 3,
    },
    {
      question: "Какой язык программирования используется в этом проекте?",
      options: ["JavaScript", "Python", "TypeScript", "Java"],
      answer: 2,
    },
  ]

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  const handleAnswer = (optionIndex: number) => {
    if (answered) return

    setSelectedOption(optionIndex)
    setAnswered(true)

    if (optionIndex === questions[currentQuestion].answer) {
      setScore(score + 1)
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedOption(null)
        setAnswered(false)
      } else {
        setShowResult(true)
      }
    }, 1000)
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setScore(0)
    setShowResult(false)
    setSelectedOption(null)
    setAnswered(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Викторина</CardTitle>
        <CardDescription>Проверьте свои знания</CardDescription>
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
            <h3 className="text-lg font-medium">{questions[currentQuestion].question}</h3>
            <div className="flex flex-col gap-2">
              {questions[currentQuestion].options.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    selectedOption === index
                      ? index === questions[currentQuestion].answer
                        ? "default"
                        : "destructive"
                      : answered && index === questions[currentQuestion].answer
                        ? "default"
                        : "outline"
                  }
                  className="justify-start text-left"
                  onClick={() => handleAnswer(index)}
                  disabled={answered}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        {showResult && <Button onClick={resetQuiz}>Начать заново</Button>}
      </CardFooter>
    </Card>
  )
}

// Змейка
function SnakeGame() {
  const [gameStarted, setGameStarted] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Змейка</CardTitle>
        <CardDescription>
          Управляйте змейкой с помощью стрелок на клавиатуре или кнопок. Собирайте еду и не врезайтесь в стены или в
          себя.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        {!gameStarted ? (
          <div className="text-center">
            <p className="mb-4">Нажмите кнопку, чтобы начать игру</p>
            <Button onClick={() => setGameStarted(true)}>Начать игру</Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4">Игра загружается...</p>
            <div className="h-[400px] w-[400px] border border-border flex items-center justify-center">
              <p>Используйте стрелки для управления змейкой</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div></div>
              <Button variant="outline" className="h-12 w-12">
                <ArrowUp className="h-6 w-6" />
              </Button>
              <div></div>
              <Button variant="outline" className="h-12 w-12">
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <Button variant="outline" className="h-12 w-12">
                <RotateCw className="h-6 w-6" />
              </Button>
              <Button variant="outline" className="h-12 w-12">
                <ArrowRight className="h-6 w-6" />
              </Button>
              <div></div>
              <Button variant="outline" className="h-12 w-12">
                <ArrowDown className="h-6 w-6" />
              </Button>
              <div></div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={() => setGameStarted(false)} disabled={!gameStarted}>
          Начать заново
        </Button>
      </CardFooter>
    </Card>
  )
}

// Тетрис
function BlockBlastGame() {
  const [gameStarted, setGameStarted] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тетрис</CardTitle>
        <CardDescription>Классическая игра-головоломка</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        {!gameStarted ? (
          <div className="text-center">
            <p className="mb-4">Нажмите кнопку, чтобы начать игру</p>
            <Button onClick={() => setGameStarted(true)}>Начать игру</Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4">Игра загружается...</p>
            <div className="h-[500px] w-[300px] border border-border flex items-center justify-center">
              <p>Используйте стрелки для управления фигурами</p>
            </div>
            <div className="flex gap-4 mt-4 justify-center">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Влево
              </Button>
              <Button variant="outline">
                <ArrowRight className="h-4 w-4 mr-2" /> Вправо
              </Button>
              <Button variant="outline">
                <ArrowDown className="h-4 w-4 mr-2" /> Вниз
              </Button>
              <Button variant="outline">
                <RotateCw className="h-4 w-4 mr-2" /> Вращать
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={() => setGameStarted(false)} disabled={!gameStarted}>
          Начать заново
        </Button>
      </CardFooter>
    </Card>
  )
}
