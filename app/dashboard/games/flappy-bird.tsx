"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScoreModal } from "@/components/score-modal"
import { Leaderboard } from "@/components/leaderboard"

// Константы игры
const GRAVITY = 0.4
const JUMP_FORCE = -6
const PIPE_WIDTH = 80
const PIPE_GAP = 200
const PIPE_SPEED = 2
const BIRD_WIDTH = 40
const BIRD_HEIGHT = 30
const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 500
const INITIAL_PIPE_DISTANCE = 300
const MIN_PIPE_DISTANCE = 200

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [birdY, setBirdY] = useState(CANVAS_HEIGHT / 2)
  const [birdVelocity, setBirdVelocity] = useState(0)
  const [pipes, setPipes] = useState<{ x: number; topHeight: number }[]>([])
  const [pipeDistance, setPipeDistance] = useState(INITIAL_PIPE_DISTANCE)

  // Инициализация игры
  const startGame = () => {
    setScore(0)
    setGameOver(false)
    setIsPlaying(true)
    setBirdY(CANVAS_HEIGHT / 2)
    setBirdVelocity(0)
    setPipes([])
    setPipeDistance(INITIAL_PIPE_DISTANCE)
  }

  // Обработка прыжка
  const jump = () => {
    if (!isPlaying || gameOver) return
    setBirdVelocity(JUMP_FORCE)
  }

  // Обработка нажатий клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (!isPlaying && !gameOver) {
          startGame()
        } else {
          jump()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, gameOver])

  // Игровой цикл
  useEffect(() => {
    if (!isPlaying) return

    const gameLoop = setInterval(() => {
      if (gameOver) {
        clearInterval(gameLoop)
        return
      }

      // Обновление позиции птицы
      setBirdY((prev) => prev + birdVelocity)
      setBirdVelocity((prev) => prev + GRAVITY)

      // Создание новых труб
      setPipes((prev) => {
        const lastPipe = prev[prev.length - 1]
        const newPipes = [...prev]

        // Добавляем новую трубу, когда последняя труба достаточно далеко
        if (!lastPipe || lastPipe.x < CANVAS_WIDTH - pipeDistance) {
          const topHeight = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 100) + 50
          newPipes.push({ x: CANVAS_WIDTH, topHeight })

          // Уменьшаем расстояние между трубами по мере увеличения счета
          setPipeDistance((prev) => Math.max(MIN_PIPE_DISTANCE, INITIAL_PIPE_DISTANCE - score * 5))
        }

        // Перемещаем трубы
        return newPipes.map((pipe) => ({ ...pipe, x: pipe.x - PIPE_SPEED })).filter((pipe) => pipe.x > -PIPE_WIDTH)
      })

      // Проверка столкновений
      const birdLeft = 50
      const birdRight = birdLeft + BIRD_WIDTH
      const birdTop = birdY
      const birdBottom = birdY + BIRD_HEIGHT

      // Столкновение с землей или потолком
      if (birdTop < 0 || birdBottom > CANVAS_HEIGHT) {
        setGameOver(true)
        setIsPlaying(false)
        return
      }

      // Столкновение с трубами
      pipes.forEach((pipe) => {
        const pipeLeft = pipe.x
        const pipeRight = pipe.x + PIPE_WIDTH
        const topPipeBottom = pipe.topHeight
        const bottomPipeTop = pipe.topHeight + PIPE_GAP

        if (birdRight > pipeLeft && birdLeft < pipeRight && (birdTop < topPipeBottom || birdBottom > bottomPipeTop)) {
          setGameOver(true)
          setIsPlaying(false)
          return
        }

        // Увеличение счета при прохождении трубы
        if (pipe.x + PIPE_WIDTH / 2 === birdLeft) {
          setScore((prev) => prev + 1)
        }
      })
    }, 16) // ~60fps

    return () => clearInterval(gameLoop)
  }, [isPlaying, gameOver, birdY, birdVelocity, pipes, score, pipeDistance])

  // Отрисовка игры
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Очищаем холст
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Рисуем фон
    ctx.fillStyle = "#87CEEB"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Рисуем землю
    ctx.fillStyle = "#8B4513"
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20)

    // Рисуем траву
    ctx.fillStyle = "#228B22"
    ctx.fillRect(0, canvas.height - 30, canvas.width, 10)

    // Рисуем птицу
    ctx.fillStyle = "#FFFF00"
    ctx.beginPath()
    ctx.arc(50 + BIRD_WIDTH / 2, birdY + BIRD_HEIGHT / 2, BIRD_WIDTH / 2, 0, Math.PI * 2)
    ctx.fill()

    // Рисуем глаз птицы
    ctx.fillStyle = "#000"
    ctx.beginPath()
    ctx.arc(50 + BIRD_WIDTH / 2 + 5, birdY + BIRD_HEIGHT / 2 - 5, 5, 0, Math.PI * 2)
    ctx.fill()

    // Рисуем клюв
    ctx.fillStyle = "#FF6600"
    ctx.beginPath()
    ctx.moveTo(50 + BIRD_WIDTH, birdY + BIRD_HEIGHT / 2)
    ctx.lineTo(50 + BIRD_WIDTH + 10, birdY + BIRD_HEIGHT / 2 - 5)
    ctx.lineTo(50 + BIRD_WIDTH + 10, birdY + BIRD_HEIGHT / 2 + 5)
    ctx.fill()

    // Рисуем трубы
    ctx.fillStyle = "#00CC00"
    pipes.forEach((pipe) => {
      // Верхняя труба
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
      // Нижняя труба
      ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.topHeight - PIPE_GAP)

      // Декоративные элементы труб
      ctx.fillStyle = "#009900"
      // Верхняя труба - нижний край
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20)
      // Нижняя труба - верхний край
      ctx.fillRect(pipe.x - 5, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 10, 20)
      ctx.fillStyle = "#00CC00"
    })

    // Отображаем счет
    ctx.fillStyle = "#FFF"
    ctx.font = "30px Arial"
    ctx.textAlign = "center"
    ctx.fillText(score.toString(), canvas.width / 2, 50)

    // Отображаем сообщение о конце игры
    if (gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#FFF"
      ctx.font = "30px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Игра окончена!", canvas.width / 2, canvas.height / 2 - 20)
      ctx.fillText(`Счет: ${score}`, canvas.width / 2, canvas.height / 2 + 20)
    }

    // Отображаем инструкции
    if (!isPlaying && !gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#FFF"
      ctx.font = "24px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Нажмите пробел или", canvas.width / 2, canvas.height / 2 - 20)
      ctx.fillText("коснитесь экрана для начала", canvas.width / 2, canvas.height / 2 + 20)
    }
  }, [birdY, pipes, score, gameOver, isPlaying])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full max-w-[400px]">
        <h2 className="text-xl font-bold">Flappy Bird</h2>
        <Badge variant="outline" className="text-lg">
          Счет: {score}
        </Badge>
      </div>

      <Card className="p-2 w-full max-w-[400px]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full border border-gray-300 dark:border-gray-700"
          onClick={() => {
            if (!isPlaying && !gameOver) {
              startGame()
            } else {
              jump()
            }
          }}
        />
      </Card>

      <div className="flex gap-2">
        {gameOver && (
          <>
            <Button onClick={startGame}>Играть снова</Button>
            <Button variant="outline" onClick={() => setShowScoreModal(true)}>
              Сохранить рекорд
            </Button>
          </>
        )}
      </div>

      <div className="w-full max-w-[400px]">
        <Leaderboard gameName="flappy-bird" />
      </div>

      {showScoreModal && <ScoreModal score={score} gameName="flappy-bird" onClose={() => setShowScoreModal(false)} />}
    </div>
  )
}
