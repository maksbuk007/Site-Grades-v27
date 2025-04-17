"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, RotateCw, Pause, Play, Zap } from "lucide-react"
import { Slider } from "@/components/ui/slider"

export function RacingGame3D() {
  const CANVAS_WIDTH = 400
  const CANVAS_HEIGHT = 600
  const ROAD_WIDTH = 2000
  const LANE_WIDTH = 250
  const SEGMENT_LENGTH = 200
  const RUMBLE_LENGTH = 3
  const CAMERA_HEIGHT = 1000
  const CAMERA_DEPTH = 0.84
  const DRAW_DISTANCE = 300
  const FOG_DENSITY = 5
  const PLAYER_Z = 0.5 // Позиция игрока (0 = начало сегмента, 1 = конец сегмента)
  const PLAYER_X = 0 // Позиция игрока по горизонтали (0 = центр)
  const PLAYER_WIDTH = 80
  const PLAYER_HEIGHT = 40
  const CENTRIFUGAL_FORCE = 0.3
  const OBSTACLE_FREQUENCY_MIN = 0.05 // Вероятность появления препятствия на сегменте (мин)
  const OBSTACLE_FREQUENCY_MAX = 0.2 // Вероятность появления препятствия на сегменте (макс)
  const NITRO_DURATION = 3000 // Длительность нитро в миллисекундах
  const NITRO_COOLDOWN = 10000 // Перезарядка нитро в миллисекундах
  const NITRO_SPEED_BOOST = 1.5 // Множитель скорости при нитро
  const ROAD_BOUNDARY = 0.9 // Ограничение выхода за пределы дороги (0.9 = 90% от ширины дороги)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [difficulty, setDifficulty] = useState(50) // 0-100 для слайдера
  const [obstacleFrequency, setObstacleFrequency] = useState(OBSTACLE_FREQUENCY_MIN)
  const [playerPosition, setPlayerPosition] = useState(0) // Позиция игрока по горизонтали (-1 до 1)
  const [speed, setSpeed] = useState(0) // Текущая скорость
  const [maxSpeed, setMaxSpeed] = useState(300) // Максимальная скорость
  const [acceleration, setAcceleration] = useState(0.1) // Ускорение
  const [deceleration, setDeceleration] = useState(0.3) // Замедление
  const [roadSegments, setRoadSegments] = useState<any[]>([])
  const [position, setPosition] = useState(0) // Текущая позиция на дороге
  const [cars, setCars] = useState<any[]>([])
  const [carTypes, setCarTypes] = useState([
    { width: 80, height: 40, color: "#FF0000" }, // красный
    { width: 80, height: 40, color: "#0000FF" }, // синий
    { width: 80, height: 40, color: "#FFFF00" }, // желтый
    { width: 80, height: 40, color: "#00FF00" }, // зеленый
    { width: 80, height: 40, color: "#FF00FF" }, // фиолетовый
  ])
  const [nitroActive, setNitroActive] = useState(false)
  const [nitroAvailable, setNitroAvailable] = useState(true)
  const [nitroTimeLeft, setNitroTimeLeft] = useState(0)
  const [nitroCooldown, setNitroCooldown] = useState(0)
  const [powerups, setPowerups] = useState<any[]>([])
  const [barriers, setBarriers] = useState<any[]>([])
  const [offRoadWarning, setOffRoadWarning] = useState(false)

  const gameLoopRef = useRef<number | null>(null)
  const lastRenderTimeRef = useRef<number>(0)
  const lastTouchTimeRef = useRef<number>(0)
  const touchThrottleTime = 100 // миллисекунды между разрешенными нажатиями
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const nitroTimerRef = useRef<NodeJS.Timeout | null>(null)
  const nitroCooldownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const offRoadWarningTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Обновление сложности игры на основе настроек слайдера
  useEffect(() => {
    const calculatedFrequency =
      OBSTACLE_FREQUENCY_MIN + (difficulty / 100) * (OBSTACLE_FREQUENCY_MAX - OBSTACLE_FREQUENCY_MIN)
    setObstacleFrequency(calculatedFrequency)
    setMaxSpeed(200 + difficulty * 2)
  }, [difficulty])

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

  // Игровой цикл
  const gameLoop = (currentTime: number) => {
    gameLoopRef.current = requestAnimationFrame(gameLoop)

    // Ограничиваем частоту обновления
    if (currentTime - lastRenderTimeRef.current < 16) return // примерно 60 FPS
    lastRenderTimeRef.current = currentTime

    // Обновляем позицию игрока
    updateGame()

    // Отрисовываем игру
    renderGame()
  }

  // Инициализация дороги
  useEffect(() => {
    if (gameStarted && !roadSegments.length) {
      initRoad()
    }
  }, [gameStarted, roadSegments.length])

  // Управление нитро
  useEffect(() => {
    if (nitroActive) {
      // Запускаем таймер для отключения нитро
      nitroTimerRef.current = setTimeout(() => {
        setNitroActive(false)
        setNitroAvailable(false)
        setNitroCooldown(NITRO_COOLDOWN)

        // Запускаем таймер перезарядки
        nitroCooldownTimerRef.current = setInterval(() => {
          setNitroCooldown((prev) => {
            const newCooldown = prev - 100
            if (newCooldown <= 0) {
              if (nitroCooldownTimerRef.current) {
                clearInterval(nitroCooldownTimerRef.current)
              }
              setNitroAvailable(true)
              return 0
            }
            return newCooldown
          })
        }, 100)
      }, NITRO_DURATION)

      // Обновляем оставшееся время нитро
      const nitroInterval = setInterval(() => {
        setNitroTimeLeft((prev) => Math.max(0, prev - 100))
      }, 100)

      return () => {
        if (nitroTimerRef.current) {
          clearTimeout(nitroTimerRef.current)
        }
        clearInterval(nitroInterval)
      }
    }
  }, [nitroActive, NITRO_DURATION, NITRO_COOLDOWN])

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (nitroTimerRef.current) {
        clearTimeout(nitroTimerRef.current)
      }
      if (nitroCooldownTimerRef.current) {
        clearInterval(nitroCooldownTimerRef.current)
      }
      if (offRoadWarningTimerRef.current) {
        clearTimeout(offRoadWarningTimerRef.current)
      }
    }
  }, [])

  // Инициализация дороги
  const initRoad = () => {
    const segments = []

    // Создаем прямую дорогу
    for (let i = 0; i < 500; i++) {
      segments.push({
        index: i,
        p1: { world: { z: i * SEGMENT_LENGTH }, camera: {}, screen: {} },
        p2: { world: { z: (i + 1) * SEGMENT_LENGTH }, camera: {}, screen: {} },
        color: Math.floor(i / RUMBLE_LENGTH) % 2 ? "#BBB" : "#999",
        rumble: Math.floor(i / RUMBLE_LENGTH) % 2 ? "#700" : "#F00",
        lane: Math.floor(i / RUMBLE_LENGTH) % 2 ? "#CCC" : "#FFF",
        curve: 0,
        obstacles: [],
      })
    }

    // Добавляем повороты
    addRoadCurves(segments)

    // Добавляем препятствия
    addRoadObstacles(segments)

    // Добавляем бонусы и барьеры
    addPowerupsAndBarriers(segments)

    // Запускаем игровой цикл
    gameLoopRef.current = requestAnimationFrame((timestamp) => gameLoop(timestamp))

    setRoadSegments(segments)
  }

  // Добавление поворотов на дороге
  const addRoadCurves = (segments: any[]) => {
    // Добавляем несколько поворотов
    addRoadCurve(segments, 50, 100, 3)
    addRoadCurve(segments, 200, 50, -5)
    addRoadCurve(segments, 300, 80, 4)
    addRoadCurve(segments, 400, 60, -3)
  }

  // Добавление одного поворота
  const addRoadCurve = (segments: any[], start: number, length: number, curve: number) => {
    for (let i = start; i < start + length; i++) {
      if (i < segments.length) {
        segments[i].curve = curve
      }
    }
  }

  // Добавление препятствий на дороге
  const addRoadObstacles = (segments: any[]) => {
    // Начинаем добавлять препятствия после некоторого расстояния
    for (let i = 50; i < segments.length; i += 10) {
      if (Math.random() < obstacleFrequency) {
        const lane = Math.floor(Math.random() * 3) - 1 // -1, 0, 1
        const carType = carTypes[Math.floor(Math.random() * carTypes.length)]

        segments[i].obstacles.push({
          x: lane * LANE_WIDTH,
          z: segments[i].p1.world.z,
          width: carType.width,
          height: carType.height,
          color: carType.color,
          speed: maxSpeed * 0.5 + Math.random() * maxSpeed * 0.2, // Скорость препятствия
        })
      }
    }
  }

  // Добавление бонусов и барьеров
  const addPowerupsAndBarriers = (segments: any[]) => {
    const newPowerups = []
    const newBarriers = []

    // Добавляем бонусы (нитро и замедлители)
    for (let i = 100; i < segments.length; i += 50) {
      if (Math.random() < 0.3) {
        const lane = Math.floor(Math.random() * 3) - 1 // -1, 0, 1
        const type = Math.random() < 0.7 ? "nitro" : "slowdown"

        newPowerups.push({
          x: lane * LANE_WIDTH,
          z: segments[i].p1.world.z,
          width: 30,
          height: 30,
          type: type,
          collected: false,
        })
      }
    }

    // Добавляем барьеры
    for (let i = 150; i < segments.length; i += 70) {
      if (Math.random() < 0.2) {
        const width = 100 + Math.random() * 200
        const offset = (Math.random() * 2 - 1) * (ROAD_WIDTH / 2 - width / 2)

        newBarriers.push({
          x: offset,
          z: segments[i].p1.world.z,
          width: width,
          height: 40,
          color: "#FF4500",
        })
      }
    }

    setPowerups(newPowerups)
    setBarriers(newBarriers)
  }

  // Проекция 3D точки на 2D экран
  const project = (p: any, cameraX: number, cameraY: number, cameraZ: number, cameraDepth: number) => {
    // Переводим мировые координаты в координаты относительно камеры
    p.camera.x = (p.world.x || 0) - cameraX
    p.camera.y = (p.world.y || 0) - cameraY
    p.camera.z = (p.world.z || 0) - cameraZ

    // Проецируем на экран
    p.screen.scale = cameraDepth / p.camera.z
    p.screen.x = Math.round(CANVAS_WIDTH / 2 + (p.screen.scale * p.camera.x * CANVAS_WIDTH) / 2)
    p.screen.y = Math.round(CANVAS_HEIGHT / 2 - (p.screen.scale * p.camera.y * CANVAS_HEIGHT) / 2)
    p.screen.w = Math.round((p.screen.scale * ROAD_WIDTH * CANVAS_WIDTH) / 2)
  }

  // Отрисовка сегмента дороги
  const renderSegment = (ctx: CanvasRenderingContext2D, segment: any, playerX: number) => {
    const p1 = segment.p1
    const p2 = segment.p2

    // Рисуем дорогу
    ctx.fillStyle = segment.color
    ctx.beginPath()
    ctx.moveTo(p1.screen.x - p1.screen.w, p1.screen.y)
    ctx.lineTo(p2.screen.x - p2.screen.w, p2.screen.y)
    ctx.lineTo(p2.screen.x + p2.screen.w, p2.screen.y)
    ctx.lineTo(p1.screen.x + p1.screen.w, p1.screen.y)
    ctx.closePath()
    ctx.fill()

    // Рисуем обочину
    ctx.fillStyle = segment.rumble
    ctx.beginPath()
    ctx.moveTo(p1.screen.x - p1.screen.w - 15, p1.screen.y)
    ctx.lineTo(p2.screen.x - p2.screen.w - 15, p2.screen.y)
    ctx.lineTo(p2.screen.x - p2.screen.w, p2.screen.y)
    ctx.lineTo(p1.screen.x - p1.screen.w, p1.screen.y)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(p1.screen.x + p1.screen.w, p1.screen.y)
    ctx.lineTo(p2.screen.x + p2.screen.w, p2.screen.y)
    ctx.lineTo(p2.screen.x + p2.screen.w + 15, p2.screen.y)
    ctx.lineTo(p1.screen.x + p1.screen.w + 15, p1.screen.y)
    ctx.closePath()
    ctx.fill()

    // Рисуем разметку
    if (segment.index % 4 === 0) {
      ctx.fillStyle = segment.lane
      ctx.beginPath()
      ctx.moveTo(p1.screen.x - p1.screen.w / 3, p1.screen.y)
      ctx.lineTo(p2.screen.x - p2.screen.w / 3, p2.screen.y)
      ctx.lineTo(p2.screen.x - p2.screen.w / 3 + 5, p2.screen.y)
      ctx.lineTo(p1.screen.x - p1.screen.w / 3 + 5, p1.screen.y)
      ctx.closePath()
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(p1.screen.x + p1.screen.w / 3, p1.screen.y)
      ctx.lineTo(p2.screen.x + p2.screen.w / 3, p2.screen.y)
      ctx.lineTo(p2.screen.x + p2.screen.w / 3 + 5, p2.screen.y)
      ctx.lineTo(p1.screen.x + p1.screen.w / 3 + 5, p1.screen.y)
      ctx.closePath()
      ctx.fill()
    }

    // Рисуем препятствия
    if (segment.obstacles && Array.isArray(segment.obstacles)) {
      segment.obstacles.forEach((obstacle: any) => {
        // Проецируем препятствие на экран
        const scale = p1.screen.scale
        const destX = p1.screen.x + (scale * (obstacle.x - playerX) * CANVAS_WIDTH) / 2
        const destY = p1.screen.y
        const destW = obstacle.width * scale
        const destH = obstacle.height * scale

        // Рисуем препятствие (машину)
        ctx.fillStyle = obstacle.color
        ctx.beginPath()
        ctx.roundRect(destX - destW / 2, destY - destH, destW, destH, 5)
        ctx.fill()

        // Добавляем детали машины
        ctx.fillStyle = "#333"
        ctx.fillRect(destX - destW / 3, destY - destH + destH / 5, (destW * 2) / 3, destH / 5) // лобовое стекло

        // Колеса
        ctx.fillStyle = "#000"
        ctx.fillRect(destX - destW / 2 - 5, destY - destH / 2, 5, destH / 4) // левое
        ctx.fillRect(destX + destW / 2, destY - destH / 2, 5, destH / 4) // правое
      })
    }
  }

  // Отрисовка бонусов и барьеров
  const renderPowerupsAndBarriers = (ctx: CanvasRenderingContext2D, playerX: number, playerZ: number) => {
    if (!roadSegments.length) return

    // Находим текущий сегмент
    const baseSegmentIndex = Math.floor(playerZ / SEGMENT_LENGTH) % roadSegments.length
    const baseSegment = roadSegments[baseSegmentIndex]
    if (!baseSegment) return

    // Позиция камеры
    const cameraX = playerX
    const cameraY = CAMERA_HEIGHT
    const cameraZ = playerZ - PLAYER_Z * SEGMENT_LENGTH

    // Отрисовка бонусов
    powerups.forEach((powerup) => {
      if (powerup.collected) return

      // Находим сегмент, на котором находится бонус
      const segmentIndex = Math.floor(powerup.z / SEGMENT_LENGTH) % roadSegments.length
      const segment = roadSegments[segmentIndex]
      if (!segment) return

      // Проецируем точки сегмента
      project(segment.p1, cameraX, cameraY, cameraZ, CAMERA_DEPTH)
      project(segment.p2, cameraX, cameraY, cameraZ, CAMERA_DEPTH)

      // Проверяем, видим ли бонус
      if (segment.p1.camera.z <= 0 || segment.p2.screen.y >= CANVAS_HEIGHT) return

      // Проецируем бонус на экран
      const scale = segment.p1.screen.scale
      const destX = segment.p1.screen.x + (scale * (powerup.x - playerX) * CANVAS_WIDTH) / 2
      const destY = segment.p1.screen.y
      const destW = powerup.width * scale
      const destH = powerup.height * scale

      // Рисуем бонус
      if (powerup.type === "nitro") {
        // Нитро (синий)
        ctx.fillStyle = "#00BFFF"
        ctx.beginPath()
        ctx.arc(destX, destY - destH / 2, destW / 2, 0, Math.PI * 2)
        ctx.fill()

        // Молния внутри
        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 2 * scale
        ctx.beginPath()
        ctx.moveTo(destX - destW / 4, destY - destH / 2 - destH / 4)
        ctx.lineTo(destX, destY - destH / 2)
        ctx.lineTo(destX - destW / 4, destY - destH / 2 + destH / 4)
        ctx.stroke()
      } else {
        // Замедлитель (красный)
        ctx.fillStyle = "#FF0000"
        ctx.beginPath()
        ctx.arc(destX, destY - destH / 2, destW / 2, 0, Math.PI * 2)
        ctx.fill()

        // Часы внутри
        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 2 * scale
        ctx.beginPath()
        ctx.arc(destX, destY - destH / 2, destW / 4, 0, Math.PI * 2)
        ctx.moveTo(destX, destY - destH / 2)
        ctx.lineTo(destX, destY - destH / 2 - destW / 6)
        ctx.moveTo(destX, destY - destH / 2)
        ctx.lineTo(destX + destW / 6, destY - destH / 2)
        ctx.stroke()
      }

      // Проверка столкновения с бонусом
      const playerSegmentZ = playerZ % (roadSegments.length * SEGMENT_LENGTH)
      const powerupSegmentZ = powerup.z % (roadSegments.length * SEGMENT_LENGTH)

      if (
        Math.abs(playerSegmentZ - powerupSegmentZ) < SEGMENT_LENGTH &&
        Math.abs(playerX - powerup.x) < PLAYER_WIDTH / 2 + powerup.width / 2
      ) {
        // Собрали бонус
        powerup.collected = true

        if (powerup.type === "nitro") {
          // Активируем нитро
          setNitroActive(true)
          setNitroTimeLeft(NITRO_DURATION)

          // Очищаем предыдущие таймеры
          if (nitroTimerRef.current) {
            clearTimeout(nitroTimerRef.current)
          }
          if (nitroCooldownTimerRef.current) {
            clearInterval(nitroCooldownTimerRef.current)
          }
        } else {
          // Замедляем все препятствия
          const newObstacles = roadSegments.map((segment) => {
            return {
              ...segment,
              obstacles: Array.isArray(segment.obstacles)
                ? segment.obstacles.map((obs: any) => ({
                    ...obs,
                    speed: obs.speed * 0.5,
                  }))
                : [],
            }
          })
          setRoadSegments(newObstacles)
        }
      }
    })

    // Отрисовка барьеров
    barriers.forEach((barrier) => {
      // Находим сегмент, на котором находится барьер
      const segmentIndex = Math.floor(barrier.z / SEGMENT_LENGTH) % roadSegments.length
      const segment = roadSegments[segmentIndex]
      if (!segment) return

      // Проецируем точки сегмента
      project(segment.p1, cameraX, cameraY, cameraZ, CAMERA_DEPTH)
      project(segment.p2, cameraX, cameraY, cameraZ, CAMERA_DEPTH)

      // Проверяем, видим ли барьер
      if (segment.p1.camera.z <= 0 || segment.p2.screen.y >= CANVAS_HEIGHT) return

      // Проецируем барьер на экран
      const scale = segment.p1.screen.scale
      const destX = segment.p1.screen.x + (scale * (barrier.x - playerX) * CANVAS_WIDTH) / 2
      const destY = segment.p1.screen.y
      const destW = barrier.width * scale
      const destH = barrier.height * scale

      // Рисуем барьер
      ctx.fillStyle = barrier.color
      ctx.beginPath()
      ctx.roundRect(destX - destW / 2, destY - destH, destW, destH, 5)
      ctx.fill()

      // Полосы на барьере
      ctx.fillStyle = "#FFFF00"
      ctx.fillRect(destX - destW / 2, destY - destH, destW, destH / 5)
      ctx.fillRect(destX - destW / 2, destY - destH + destH / 2, destW, destH / 5)

      // Проверка столкновения с барьером
      const playerSegmentZ = playerZ % (roadSegments.length * SEGMENT_LENGTH)
      const barrierSegmentZ = barrier.z % (roadSegments.length * SEGMENT_LENGTH)

      if (
        Math.abs(playerSegmentZ - barrierSegmentZ) < SEGMENT_LENGTH &&
        Math.abs(playerX - barrier.x) < PLAYER_WIDTH / 2 + barrier.width / 2
      ) {
        // Столкновение с барьером
        setGameOver(true)
        if (score > highScore) {
          setHighScore(score)
        }
      }
    })
  }

  // Отрисовка игрока
  const renderPlayer = (ctx: CanvasRenderingContext2D, playerX: number, speed: number) => {
    // Позиция игрока на экране
    const destX = CANVAS_WIDTH / 2
    const destY = CANVAS_HEIGHT - PLAYER_HEIGHT - 20
    const destW = PLAYER_WIDTH
    const destH = PLAYER_HEIGHT

    // Добавляем небольшой наклон при повороте
    const tilt = playerX * 2

    // Рисуем машину игрока
    ctx.save()
    ctx.translate(destX, destY)
    ctx.rotate((tilt * Math.PI) / 180)

    // Основной корпус машины с градиентом
    const carGradient = ctx.createLinearGradient(-destW / 2, -destH, destW / 2, 0)
    carGradient.addColorStop(0, "#D32F2F")
    carGradient.addColorStop(0.5, "#F44336")
    carGradient.addColorStop(1, "#D32F2F")

    ctx.fillStyle = carGradient
    ctx.beginPath()
    ctx.roundRect(-destW / 2, -destH, destW, destH, 5)
    ctx.fill()

    // Детали машины
    ctx.fillStyle = "#333"
    ctx.fillRect(-destW / 3, -destH + destH / 5, (destW * 2) / 3, destH / 5) // лобовое стекло

    // Колеса
    ctx.fillStyle = "#000"
    ctx.fillRect(-destW / 2 - 5, -destH / 2, 5, destH / 4) // левое
    ctx.fillRect(destW / 2, -destH / 2, 5, destH / 4) // правое

    // Эффект скорости (выхлоп)
    if (speed > 100) {
      ctx.fillStyle = "rgba(255, 100, 0, 0.7)"
      ctx.beginPath()
      ctx.moveTo(-destW / 4, 0)
      ctx.lineTo(destW / 4, 0)
      ctx.lineTo(0, 10 + speed / 20)
      ctx.closePath()
      ctx.fill()
    }

    // Эффект нитро
    if (nitroActive) {
      // Пламя нитро
      const flameGradient = ctx.createLinearGradient(0, 0, 0, 20 + speed / 10)
      flameGradient.addColorStop(0, "#00BFFF")
      flameGradient.addColorStop(0.5, "#1E90FF")
      flameGradient.addColorStop(1, "#0000FF")

      ctx.fillStyle = flameGradient
      ctx.beginPath()
      ctx.moveTo(-destW / 3, 0)
      ctx.lineTo(destW / 3, 0)
      ctx.lineTo(destW / 6, 20 + speed / 10)
      ctx.lineTo(-destW / 6, 20 + speed / 10)
      ctx.closePath()
      ctx.fill()

      // Искры
      ctx.fillStyle = "#FFFFFF"
      for (let i = 0; i < 5; i++) {
        const sparkX = ((Math.random() - 0.5) * destW) / 2
        const sparkY = 5 + Math.random() * 15
        const sparkSize = 1 + Math.random() * 3

        ctx.beginPath()
        ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }

  // Игровой цикл с использованием requestAnimationFrame
  useEffect(() => {
    if (gameOver || isPaused) return

    const gameLoop = (currentTime: number) => {
      gameLoopRef.current = requestAnimationFrame(gameLoop)

      // Ограничиваем частоту обновления
      if (currentTime - lastRenderTimeRef.current < 16) return // примерно 60 FPS
      lastRenderTimeRef.current = currentTime

      // Обновляем позицию игрока
      updateGame()

      // Отрисовываем игру
      renderGame()
    }

    if (!gameLoopRef.current && gameStarted) {
      lastRenderTimeRef.current = performance.now()
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }
  }, [gameStarted, gameOver, isPaused])

  // Обработка нажатий клавиш
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          movePlayer(-0.1)
          break
        case "ArrowRight":
          movePlayer(0.1)
          break
        case "ArrowUp":
          setSpeed((prev) => Math.min(maxSpeed, prev + 10))
          break
        case "ArrowDown":
          setSpeed((prev) => Math.max(0, prev - 10))
          break
        case " ":
          if (nitroAvailable && !nitroActive) {
            setNitroActive(true)
            setNitroTimeLeft(NITRO_DURATION)
          } else {
            setIsPaused(!isPaused)
          }
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameStarted, gameOver, isPaused, maxSpeed, nitroAvailable, nitroActive])

  // Перемещение игрока с ограничением выхода за пределы дороги
  const movePlayer = (amount: number) => {
    setPlayerPosition((prev) => {
      const newPosition = prev + amount

      // Проверяем, не выходит ли игрок за пределы дороги
      if (Math.abs(newPosition) > ROAD_BOUNDARY) {
        // Если игрок пытается выйти за пределы дороги, показываем предупреждение
        if (!offRoadWarning) {
          setOffRoadWarning(true)

          // Сбрасываем предупреждение через 1 секунду
          if (offRoadWarningTimerRef.current) {
            clearTimeout(offRoadWarningTimerRef.current)
          }

          offRoadWarningTimerRef.current = setTimeout(() => {
            setOffRoadWarning(false)
          }, 1000)

          // Замедляем игрока при выходе на обочину
          setSpeed((prev) => prev * 0.8)
        }

        // Ограничиваем позицию игрока
        return Math.sign(newPosition) * ROAD_BOUNDARY
      }

      return newPosition
    })
  }

  // Обновление состояния игры
  const updateGame = () => {
    // Обновляем скорость (автоматическое ускорение)
    if (speed < maxSpeed) {
      setSpeed((prev) => prev + acceleration)
    }

    // Применяем нитро
    const currentSpeed = nitroActive ? speed * NITRO_SPEED_BOOST : speed

    // Обновляем позицию на дороге
    const newPosition = position + currentSpeed
    setPosition(newPosition)
    setScore(Math.floor(newPosition / 100))

    // Находим текущий сегмент дороги
    if (roadSegments.length > 0) {
      const currentSegmentIndex = Math.floor(newPosition / SEGMENT_LENGTH) % roadSegments.length
      const currentSegment = roadSegments[currentSegmentIndex]

      // Применяем центробежную силу на поворотах
      if (currentSegment && currentSegment.curve) {
        movePlayer(-(currentSegment.curve * currentSpeed * CENTRIFUGAL_FORCE) / 10000)
      }

      // Проверяем столкновения с препятствиями
      checkCollisions(currentSegmentIndex)
    }
  }

  // Проверка столкновений с препятствиями
  const checkCollisions = (currentSegmentIndex: number) => {
    if (!roadSegments || roadSegments.length === 0) return

    // Проверяем несколько сегментов впереди
    for (let i = 0; i < 5; i++) {
      const segmentIndex = (currentSegmentIndex + i) % roadSegments.length
      if (segmentIndex < 0 || segmentIndex >= roadSegments.length) continue

      const segment = roadSegments[segmentIndex]
      if (!segment || !segment.obstacles) continue

      // Проверяем все препятствия на сегменте
      if (Array.isArray(segment.obstacles)) {
        segment.obstacles.forEach((obstacle: any) => {
          if (!obstacle) return

          // Расстояние от игрока до препятствия по Z
          const obstacleZ = obstacle.z
          const playerZ = position + PLAYER_Z * SEGMENT_LENGTH

          // Если препятствие находится в пределах сегмента
          if (Math.abs(obstacleZ - playerZ) < SEGMENT_LENGTH) {
            // Проверяем столкновение по X
            const playerX = (playerPosition * ROAD_WIDTH) / 2
            const obstacleX = obstacle.x

            if (Math.abs(playerX - obstacleX) < PLAYER_WIDTH / 2 + obstacle.width / 2) {
              // Столкновение!
              setGameOver(true)
              if (score > highScore) {
                setHighScore(score)
              }
            }
          }
        })
      }
    }
  }

  // Отрисовка игры
  const renderGame = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Очистка холста
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Отрисовка неба
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT / 2)
    skyGradient.addColorStop(0, "#72D7EE")
    skyGradient.addColorStop(1, "#B9EFFF")
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT / 2)

    // Отрисовка земли
    const groundGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT / 2, 0, CANVAS_HEIGHT)
    groundGradient.addColorStop(0, "#8FC378")
    groundGradient.addColorStop(1, "#5DA94E")
    ctx.fillStyle = groundGradient
    ctx.fillRect(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2)

    if (roadSegments.length === 0) return

    // Находим базовый сегмент
    const baseSegmentIndex = Math.floor(position / SEGMENT_LENGTH) % roadSegments.length
    const playerX = (playerPosition * ROAD_WIDTH) / 2

    // Позиция камеры
    const cameraX = playerX
    const cameraY = CAMERA_HEIGHT
    const cameraZ = position - PLAYER_Z * SEGMENT_LENGTH

    // Проецируем сегменты дороги
    let maxy = CANVAS_HEIGHT

    // Отрисовываем сегменты от дальних к ближним
    for (let i = 0; i < DRAW_DISTANCE; i++) {
      const segmentIndex = (baseSegmentIndex + i) % roadSegments.length
      if (segmentIndex < 0 || segmentIndex >= roadSegments.length) continue

      const segment = roadSegments[segmentIndex]
      if (!segment) continue

      // Проецируем точки сегмента
      project(segment.p1, cameraX, cameraY, cameraZ, CAMERA_DEPTH)
      project(segment.p2, cameraX, cameraY, cameraZ, CAMERA_DEPTH)

      // Пропускаем сегменты за камерой или за горизонтом
      if (segment.p1.camera.z <= 0 || segment.p2.screen.y >= maxy) continue

      // Отрисовываем сегмент
      renderSegment(ctx, segment, playerX)

      // Обновляем максимальную Y-координату
      maxy = segment.p2.screen.y
    }

    // Отрисовка бонусов и барьеров
    renderPowerupsAndBarriers(ctx, playerX, position)

    // Отрисовка игрока
    renderPlayer(ctx, playerPosition, speed)

    // Отрисовка счета и скорости
    ctx.fillStyle = "#FFF"
    ctx.font = "bold 20px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`Счет: ${score}`, 20, 30)
    ctx.fillText(`Скорость: ${Math.floor(speed)}`, 20, 60)

    // Отрисовка предупреждения о выходе за пределы дороги
    if (offRoadWarning) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
      ctx.fillRect(0, 100, CANVAS_WIDTH, 40)
      ctx.fillStyle = "#FFF"
      ctx.font = "bold 20px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Внимание! Выход за пределы дороги!", CANVAS_WIDTH / 2, 125)
    }

    // Отрисовка индикатора нитро
    if (nitroAvailable || nitroActive) {
      ctx.fillStyle = nitroActive ? "#00BFFF" : "#FFFFFF"
      ctx.textAlign = "right"
      ctx.fillText("NITRO", CANVAS_WIDTH - 20, 30)

      // Индикатор заряда
      const nitroBarWidth = 100
      const nitroBarHeight = 10
      const nitroBarX = CANVAS_WIDTH - 20 - nitroBarWidth
      const nitroBarY = 40

      // Фон индикатора
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(nitroBarX, nitroBarY, nitroBarWidth, nitroBarHeight)

      // Заполнение индикатора
      if (nitroActive) {
        const fillWidth = (nitroTimeLeft / NITRO_DURATION) * nitroBarWidth
        ctx.fillStyle = "#00BFFF"
        ctx.fillRect(nitroBarX, nitroBarY, fillWidth, nitroBarHeight)
      } else if (!nitroAvailable) {
        const fillWidth = ((NITRO_COOLDOWN - nitroCooldown) / NITRO_COOLDOWN) * nitroBarWidth
        ctx.fillStyle = "#FF6347"
        ctx.fillRect(nitroBarX, nitroBarY, fillWidth, nitroBarHeight)
      } else {
        ctx.fillStyle = "#00FF00"
        ctx.fillRect(nitroBarX, nitroBarY, nitroBarWidth, nitroBarHeight)
      }
    }

    // Отрисовка экрана паузы
    if (isPaused) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = "#FFF"
      ctx.font = "bold 30px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Пауза", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.font = "20px Arial"
      ctx.fillText("Нажмите кнопку, чтобы продолжить", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
    }

    // Отрисовка экрана окончания игры
    if (gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = "#FFF"
      ctx.font = "bold 30px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Игра окончена!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30)
      ctx.fillText(`Ваш счет: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10)
      ctx.font = "20px Arial"
      ctx.fillText("Нажмите кнопку, чтобы начать заново", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
    }
  }

  // Сброс игры
  const resetGame = () => {
    setScore(0)
    setPlayerPosition(0)
    setSpeed(0)
    setPosition(0)
    setGameOver(false)
    setIsPaused(false)
    setRoadSegments([])
    setNitroActive(false)
    setNitroAvailable(true)
    setNitroTimeLeft(0)
    setNitroCooldown(0)
    setPowerups([])
    setBarriers([])
    setOffRoadWarning(false)
    setGameStarted(true)
  }

  // Активация нитро
  const activateNitro = () => {
    if (nitroAvailable && !nitroActive && gameStarted && !gameOver && !isPaused) {
      setNitroActive(true)
      setNitroTimeLeft(NITRO_DURATION)

      // Очищаем предыдущие таймеры
      if (nitroTimerRef.current) {
        clearTimeout(nitroTimerRef.current)
      }
      if (nitroCooldownTimerRef.current) {
        clearInterval(nitroCooldownTimerRef.current)
      }
    }
  }

  // Управление с помощью кнопок (для мобильных устройств)
  const handleMoveButton = (direction: string) => {
    // Предотвращение частых нажатий
    const now = Date.now()
    if (now - lastTouchTimeRef.current < touchThrottleTime) {
      return
    }
    lastTouchTimeRef.current = now

    if (!gameStarted || gameOver || isPaused) return

    switch (direction) {
      case "left":
        movePlayer(-0.2)
        break
      case "right":
        movePlayer(0.2)
        break
      default:
        break
    }
  }

  // Запуск игры
  const startGame = () => {
    setGameStarted(true)
    setSpeed(50) // Устанавливаем начальную скорость

    // Запускаем игровой цикл, если он еще не запущен
    if (!gameLoopRef.current) {
      lastRenderTimeRef.current = performance.now()
      gameLoopRef.current = requestAnimationFrame((timestamp) => gameLoop(timestamp))
    }
  }

  return (
    <div className="flex flex-col items-center" ref={gameContainerRef}>
      {!gameStarted ? (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold">3D Гонки</h3>
            <p className="text-sm text-muted-foreground">Управляйте машиной и избегайте столкновений</p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm">Сложность:</span>
            <Slider
              className="w-48"
              value={[difficulty]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setDifficulty(value[0])}
            />
            <span className="text-sm">{difficulty < 33 ? "Легко" : difficulty < 66 ? "Средне" : "Сложно"}</span>
          </div>

          <Button onClick={() => startGame()} style={{ touchAction: "manipulation" }}>
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
              Рекорд: {highScore}
            </Badge>
            {gameOver && <Badge variant="destructive">Игра окончена!</Badge>}
            {isPaused && !gameOver && <Badge variant="secondary">Пауза</Badge>}
            {nitroActive && (
              <Badge variant="secondary" className="bg-blue-500 text-white">
                NITRO!
              </Badge>
            )}
            {offRoadWarning && <Badge variant="destructive">Выход за пределы дороги!</Badge>}
          </div>

          <div className="relative mb-4">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border border-border rounded-lg shadow-lg dark:border-gray-600"
              style={{ touchAction: "none" }}
            />
          </div>

          {/* Кнопки управления для мобильных устройств */}
          <div className="flex gap-4 mt-4 justify-center">
            <Button
              variant="outline"
              className="h-12 w-24"
              onClick={() => handleMoveButton("left")}
              disabled={!gameStarted || gameOver || isPaused}
              style={{ touchAction: "manipulation" }}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="default"
              className="h-12 w-24"
              onClick={gameOver ? resetGame : () => setIsPaused(!isPaused)}
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
              className="h-12 w-24"
              onClick={() => handleMoveButton("right")}
              disabled={!gameStarted || gameOver || isPaused}
              style={{ touchAction: "manipulation" }}
            >
              <ArrowRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Кнопка нитро */}
          {gameStarted && !gameOver && !isPaused && (
            <Button
              variant="outline"
              className={`h-12 w-48 mt-4 ${nitroAvailable ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}
              onClick={activateNitro}
              disabled={!nitroAvailable || nitroActive}
              style={{ touchAction: "manipulation" }}
            >
              <Zap className="h-6 w-6 mr-2" />
              {nitroActive
                ? "NITRO АКТИВНО"
                : nitroAvailable
                  ? "АКТИВИРОВАТЬ NITRO"
                  : `ПЕРЕЗАРЯДКА ${Math.ceil(nitroCooldown / 1000)}с`}
            </Button>
          )}
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground mt-4">
        <p>Используйте стрелки влево и вправо для управления машиной.</p>
        <p>Собирайте синие бонусы для ускорения и красные для замедления препятствий.</p>
        <p>Избегайте столкновений с другими машинами и барьерами.</p>
        <p>Не выезжайте за пределы дороги - это замедлит вашу машину!</p>
      </div>
    </div>
  )
}
