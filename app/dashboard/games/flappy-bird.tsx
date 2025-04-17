"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCw } from "lucide-react"

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [paused, setPaused] = useState(false)
  const [difficulty, setDifficulty] = useState(2) // 1-easy, 2-medium, 3-hard
  const [darkMode, setDarkMode] = useState(false)
  const [touchControlsEnabled, setTouchControlsEnabled] = useState(true)

  const birdRef = useRef({
    x: 50,
    y: 150,
    velocity: 0,
    gravity: 0.5,
    jump: -8,
    size: 20,
  })

  const gameStateRef = useRef({
    pipes: [] as { x: number; topHeight: number; passed: boolean }[],
    pipeWidth: 50,
    pipeGap: 150,
    pipeSpeed: 2,
    pipeInterval: 1500,
    lastPipeTime: 0,
    score: 0,
    animationFrameId: 0,
    lastTimestamp: 0,
  })

  // Load best score from localStorage
  useEffect(() => {
    const savedBestScore = localStorage.getItem("flappy-bird-best-score")
    if (savedBestScore) {
      setBestScore(Number.parseInt(savedBestScore, 10))
    }

    const savedDarkMode = localStorage.getItem("game-dark-mode")
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === "true")
    }
  }, [])

  // Update difficulty settings
  useEffect(() => {
    const difficultySettings = {
      1: { gravity: 0.4, pipeSpeed: 1.5, pipeInterval: 2000 },
      2: { gravity: 0.5, pipeSpeed: 2, pipeInterval: 1500 },
      3: { gravity: 0.6, pipeSpeed: 2.5, pipeInterval: 1200 },
    }

    const settings = difficultySettings[difficulty as keyof typeof difficultySettings]
    birdRef.current.gravity = settings.gravity
    gameStateRef.current.pipeSpeed = settings.pipeSpeed
    gameStateRef.current.pipeInterval = settings.pipeInterval
  }, [difficulty])

  // Draw the game
  const draw = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const width = canvas.width
      const height = canvas.height
      const bird = birdRef.current
      const gameState = gameStateRef.current

      // Calculate delta time for smooth animation
      const deltaTime = timestamp - gameState.lastTimestamp
      gameState.lastTimestamp = timestamp

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw background
      ctx.fillStyle = darkMode ? "#1a1a1a" : "#87CEEB"
      ctx.fillRect(0, 0, width, height)

      // Draw ground
      ctx.fillStyle = darkMode ? "#333333" : "#8B4513"
      ctx.fillRect(0, height - 20, width, 20)

      // Draw grass
      ctx.fillStyle = darkMode ? "#4d4d4d" : "#7CFC00"
      ctx.fillRect(0, height - 20, width, 5)

      // Draw bird
      ctx.fillStyle = darkMode ? "#FFD700" : "#FF6347"
      ctx.beginPath()
      ctx.arc(bird.x, bird.y, bird.size, 0, Math.PI * 2)
      ctx.fill()

      // Draw eye
      ctx.fillStyle = darkMode ? "#000000" : "#FFFFFF"
      ctx.beginPath()
      ctx.arc(bird.x + 8, bird.y - 5, 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#000000"
      ctx.beginPath()
      ctx.arc(bird.x + 10, bird.y - 5, 2, 0, Math.PI * 2)
      ctx.fill()

      // Draw beak
      ctx.fillStyle = darkMode ? "#FFA500" : "#FFA500"
      ctx.beginPath()
      ctx.moveTo(bird.x + 15, bird.y)
      ctx.lineTo(bird.x + 25, bird.y)
      ctx.lineTo(bird.x + 15, bird.y + 5)
      ctx.fill()

      // Draw pipes
      ctx.fillStyle = darkMode ? "#006400" : "#32CD32"
      gameState.pipes.forEach((pipe) => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, gameState.pipeWidth, pipe.topHeight)

        // Bottom pipe
        ctx.fillRect(
          pipe.x,
          pipe.topHeight + gameState.pipeGap,
          gameState.pipeWidth,
          height - (pipe.topHeight + gameState.pipeGap),
        )

        // Pipe caps
        ctx.fillStyle = darkMode ? "#008800" : "#228B22"

        // Top pipe cap
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 10, gameState.pipeWidth + 10, 10)

        // Bottom pipe cap
        ctx.fillRect(pipe.x - 5, pipe.topHeight + gameState.pipeGap, gameState.pipeWidth + 10, 10)

        ctx.fillStyle = darkMode ? "#006400" : "#32CD32"
      })

      // Draw score
      ctx.fillStyle = darkMode ? "#FFFFFF" : "#000000"
      ctx.font = "bold 30px Arial"
      ctx.textAlign = "center"
      ctx.fillText(gameState.score.toString(), width / 2, 50)

      if (!gameStarted || gameOver || paused) {
        return
      }

      // Update bird position
      bird.velocity += bird.gravity
      bird.y += bird.velocity

      // Check if bird hits the ground or ceiling
      if (bird.y + bird.size > height - 20) {
        bird.y = height - 20 - bird.size
        endGame()
      } else if (bird.y - bird.size < 0) {
        bird.y = bird.size
        bird.velocity = 0
      }

      // Add new pipes
      if (timestamp - gameState.lastPipeTime > gameState.pipeInterval) {
        const topHeight = Math.random() * (height - gameState.pipeGap - 100) + 50
        gameState.pipes.push({
          x: width,
          topHeight,
          passed: false,
        })
        gameState.lastPipeTime = timestamp
      }

      // Update pipes and check collisions
      for (let i = 0; i < gameState.pipes.length; i++) {
        const pipe = gameState.pipes[i]
        pipe.x -= gameState.pipeSpeed

        // Check if bird passed the pipe
        if (!pipe.passed && pipe.x + gameState.pipeWidth < bird.x) {
          pipe.passed = true
          gameState.score++
          setScore(gameState.score)
        }

        // Check collision with pipes
        if (
          bird.x + bird.size > pipe.x &&
          bird.x - bird.size < pipe.x + gameState.pipeWidth &&
          (bird.y - bird.size < pipe.topHeight || bird.y + bird.size > pipe.topHeight + gameState.pipeGap)
        ) {
          endGame()
        }
      }

      // Remove pipes that are off screen
      gameState.pipes = gameState.pipes.filter((pipe) => pipe.x + gameState.pipeWidth > 0)

      // Continue animation
      gameState.animationFrameId = requestAnimationFrame(draw)
    },
    [darkMode, gameOver, gameStarted, paused],
  )

  // Start the game
  const startGame = useCallback(() => {
    if (gameOver) {
      resetGame()
    }

    setGameStarted(true)
    setPaused(false)
    gameStateRef.current.lastTimestamp = performance.now()
    gameStateRef.current.animationFrameId = requestAnimationFrame(draw)
  }, [draw, gameOver])

  // End the game
  const endGame = useCallback(() => {
    setGameOver(true)
    setPaused(false)
    cancelAnimationFrame(gameStateRef.current.animationFrameId)

    // Update best score
    if (gameStateRef.current.score > bestScore) {
      setBestScore(gameStateRef.current.score)
      localStorage.setItem("flappy-bird-best-score", gameStateRef.current.score.toString())
    }
  }, [bestScore])

  // Reset the game
  const resetGame = useCallback(() => {
    birdRef.current = {
      x: 50,
      y: 150,
      velocity: 0,
      gravity: 0.5,
      jump: -8,
      size: 20,
    }

    gameStateRef.current = {
      ...gameStateRef.current,
      pipes: [],
      score: 0,
      lastPipeTime: 0,
    }

    setScore(0)
    setGameOver(false)
    setGameStarted(false)
    setPaused(false)
  }, [])

  // Pause/resume the game
  const togglePause = useCallback(() => {
    if (!gameStarted || gameOver) return

    if (paused) {
      setPaused(false)
      gameStateRef.current.lastTimestamp = performance.now()
      gameStateRef.current.animationFrameId = requestAnimationFrame(draw)
    } else {
      setPaused(true)
      cancelAnimationFrame(gameStateRef.current.animationFrameId)
    }
  }, [draw, gameOver, gameStarted, paused])

  // Handle jump
  const handleJump = useCallback(() => {
    if (!gameStarted) {
      startGame()
      birdRef.current.velocity = birdRef.current.jump
      return
    }

    if (gameOver || paused) return

    birdRef.current.velocity = birdRef.current.jump
  }, [gameOver, gameStarted, paused, startGame])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " " || e.key === "ArrowUp") {
        e.preventDefault()
        handleJump()
      } else if (e.key === "p" || e.key === "P") {
        togglePause()
      } else if (e.key === "r" || e.key === "R") {
        resetGame()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleJump, resetGame, togglePause])

  // Handle canvas click/touch
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !touchControlsEnabled) return

    const handleCanvasClick = () => {
      handleJump()
    }

    canvas.addEventListener("click", handleCanvasClick)
    canvas.addEventListener("touchstart", handleCanvasClick)

    return () => {
      canvas.removeEventListener("click", handleCanvasClick)
      canvas.removeEventListener("touchstart", handleCanvasClick)
    }
  }, [handleJump, touchControlsEnabled])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas dimensions
    canvas.width = 400
    canvas.height = 500

    // Initial draw
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw background
    ctx.fillStyle = darkMode ? "#1a1a1a" : "#87CEEB"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw ground
    ctx.fillStyle = darkMode ? "#333333" : "#8B4513"
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20)

    // Draw grass
    ctx.fillStyle = darkMode ? "#4d4d4d" : "#7CFC00"
    ctx.fillRect(0, canvas.height - 20, canvas.width, 5)

    // Draw bird
    ctx.fillStyle = darkMode ? "#FFD700" : "#FF6347"
    ctx.beginPath()
    ctx.arc(birdRef.current.x, birdRef.current.y, birdRef.current.size, 0, Math.PI * 2)
    ctx.fill()

    // Draw eye
    ctx.fillStyle = darkMode ? "#000000" : "#FFFFFF"
    ctx.beginPath()
    ctx.arc(birdRef.current.x + 8, birdRef.current.y - 5, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#000000"
    ctx.beginPath()
    ctx.arc(birdRef.current.x + 10, birdRef.current.y - 5, 2, 0, Math.PI * 2)
    ctx.fill()

    // Draw beak
    ctx.fillStyle = "#FFA500"
    ctx.beginPath()
    ctx.moveTo(birdRef.current.x + 15, birdRef.current.y)
    ctx.lineTo(birdRef.current.x + 25, birdRef.current.y)
    ctx.lineTo(birdRef.current.x + 15, birdRef.current.y + 5)
    ctx.fill()

    // Draw instructions
    ctx.fillStyle = darkMode ? "#FFFFFF" : "#000000"
    ctx.font = "20px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Нажмите для прыжка", canvas.width / 2, canvas.height / 2 - 50)
    ctx.fillText("Пробел или клик для начала", canvas.width / 2, canvas.height / 2)
  }, [darkMode])

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem("game-dark-mode", newDarkMode.toString())
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex items-center gap-4 flex-wrap justify-center">
        <Badge variant="outline" className="text-sm">
          Счет: {score}
        </Badge>
        <Badge variant="outline" className="text-sm">
          Рекорд: {bestScore}
        </Badge>
        {gameOver && <Badge variant="destructive">Игра окончена!</Badge>}
        {paused && !gameOver && <Badge variant="secondary">Пауза</Badge>}
      </div>

      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          className="border border-border rounded-lg shadow-lg dark:border-gray-600"
          style={{ touchAction: touchControlsEnabled ? "none" : "auto" }}
        />

        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button onClick={startGame} className="px-8 py-6 text-lg">
              Начать игру
            </Button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="bg-background p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-xl font-bold mb-2">Игра окончена!</h3>
              <p className="mb-4">Ваш счет: {score}</p>
              <Button onClick={resetGame}>Играть снова</Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <Button
          variant={gameStarted && !gameOver && !paused ? "outline" : "default"}
          onClick={gameStarted && !gameOver ? togglePause : startGame}
          className="flex items-center gap-2"
        >
          {gameStarted && !gameOver && !paused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {gameStarted && !gameOver && !paused ? "Пауза" : "Играть"}
        </Button>

        <Button variant="outline" onClick={resetGame} className="flex items-center gap-2">
          <RotateCw className="h-4 w-4" />
          Сбросить
        </Button>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Label htmlFor="difficulty" className="text-sm">
              Сложность: {difficulty === 1 ? "Легко" : difficulty === 2 ? "Средне" : "Сложно"}
            </Label>
            <Slider
              id="difficulty"
              min={1}
              max={3}
              step={1}
              value={[difficulty]}
              onValueChange={(value) => setDifficulty(value[0])}
              className="w-32"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="touch-controls" className="text-sm">
              Сенсорное управление
            </Label>
            <Switch id="touch-controls" checked={touchControlsEnabled} onCheckedChange={setTouchControlsEnabled} />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="dark-mode" className="text-sm">
            Темный режим
          </Label>
          <Switch id="dark-mode" checked={darkMode} onCheckedChange={toggleDarkMode} />
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground mt-4">
        <p>Нажмите пробел или коснитесь экрана, чтобы птица подпрыгнула.</p>
        <p>Избегайте столкновений с трубами и землей.</p>
        <p>Нажмите 'P' для паузы, 'R' для сброса игры.</p>
      </div>
    </div>
  )
}
