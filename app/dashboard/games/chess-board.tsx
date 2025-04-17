"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCw, Clock, ClockIcon as ClockOff } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Типы фигур и цветов
type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king" | null
type PieceColor = "white" | "black" | null
type Piece = { type: PieceType; color: PieceColor; hasMoved?: boolean }
type Board = Piece[][]
type Position = { row: number; col: number }
type CastlingRights = {
  whiteKingSide: boolean
  whiteQueenSide: boolean
  blackKingSide: boolean
  blackQueenSide: boolean
}

// Обновляем символы шахматных фигур на более современные и возвращаем черно-белые цвета
const PIECES = {
  white: {
    king: "♔",
    queen: "♕",
    rook: "♖",
    bishop: "♗",
    knight: "♘",
    pawn: "♙",
  },
  black: {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟",
  },
}

// Варианты времени для игры
const TIME_OPTIONS = [
  { value: "1", label: "1 минута" },
  { value: "3", label: "3 минуты" },
  { value: "5", label: "5 минут" },
  { value: "10", label: "10 минут" },
  { value: "15", label: "15 минут" },
  { value: "30", label: "30 минут" },
]

export function ChessBoard() {
  const [board, setBoard] = useState<Board>([])
  const [selectedCell, setSelectedCell] = useState<Position | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>("white")
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<PieceColor>(null)
  const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[]; black: Piece[] }>({
    white: [],
    black: [],
  })
  const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(null)
  const [castlingRights, setCastlingRights] = useState<CastlingRights>({
    whiteKingSide: true,
    whiteQueenSide: true,
    blackKingSide: true,
    blackQueenSide: true,
  })
  const [timedGame, setTimedGame] = useState(false)
  const [timeOption, setTimeOption] = useState("5") // По умолчанию 5 минут
  const [timeLeft, setTimeLeft] = useState({ white: 300, black: 300 }) // 5 минут на игрока
  const [timerActive, setTimerActive] = useState(false)
  const [inCheck, setInCheck] = useState<PieceColor | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [halfMoveClock, setHalfMoveClock] = useState(0) // Счетчик полуходов для правила 50 ходов
  const [fullMoveNumber, setFullMoveNumber] = useState(1) // Номер хода (начинается с 1 и увеличивается после хода черных)
  const [drawOffer, setDrawOffer] = useState<PieceColor | null>(null)
  const [gameResult, setGameResult] = useState<string | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTouchTimeRef = useRef<number>(0)
  const touchThrottleTime = 300 // миллисекунды между разрешенными нажатиями
  const gameContainerRef = useRef<HTMLDivElement>(null)

  // Инициализация доски
  useEffect(() => {
    resetGame()
  }, [])

  // Обработка нажатий клавиш для предотвращения прокрутки страницы
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Проверяем, активна ли игра и нажата ли стрелка
      if (gameContainerRef.current && !gameOver) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
          e.preventDefault() // Предотвращаем прокрутку страницы
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameOver])

  // Обновление времени при изменении опции времени
  useEffect(() => {
    const minutes = Number.parseInt(timeOption)
    const seconds = minutes * 60
    setTimeLeft({ white: seconds, black: seconds })
  }, [timeOption])

  // Управление таймером
  useEffect(() => {
    if (timedGame && timerActive && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = { ...prev }
          newTime[currentPlayer as keyof typeof newTime] -= 1

          // Проверка на окончание времени
          if (newTime[currentPlayer as keyof typeof newTime] <= 0) {
            setGameOver(true)
            setWinner(currentPlayer === "white" ? "black" : "white")
            setGameResult(currentPlayer === "white" ? "0-1 (время)" : "1-0 (время)")
            clearInterval(timerRef.current as NodeJS.Timeout)
            return prev
          }

          return newTime
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timedGame, timerActive, currentPlayer, gameOver])

  // Проверка правила 50 ходов
  useEffect(() => {
    if (halfMoveClock >= 100) {
      // 50 ходов = 100 полуходов
      setGameOver(true)
      setGameResult("½-½ (правило 50 ходов)")
    }
  }, [halfMoveClock])

  // Проверка на недостаточный материал для мата
  const checkInsufficientMaterial = () => {
    const whitePieces = []
    const blackPieces = []

    // Собираем все оставшиеся фигуры
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece.type) {
          if (piece.color === "white") {
            whitePieces.push(piece.type)
          } else {
            blackPieces.push(piece.type)
          }
        }
      }
    }

    // Король против короля
    if (whitePieces.length === 1 && blackPieces.length === 1) {
      return true
    }

    // Король против короля и коня/слона
    if (
      (whitePieces.length === 1 &&
        blackPieces.length === 2 &&
        (blackPieces.includes("knight") || blackPieces.includes("bishop"))) ||
      (blackPieces.length === 1 &&
        whitePieces.length === 2 &&
        (whitePieces.includes("knight") || whitePieces.includes("bishop")))
    ) {
      return true
    }

    // Король и слон против короля и слона одного цвета
    if (
      whitePieces.length === 2 &&
      blackPieces.length === 2 &&
      whitePieces.includes("bishop") &&
      blackPieces.includes("bishop")
    ) {
      // Проверяем, что слоны на полях одного цвета
      let whiteBishopSquareColor = null
      let blackBishopSquareColor = null

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col]
          if (piece.type === "bishop") {
            const squareColor = (row + col) % 2 === 0 ? "light" : "dark"
            if (piece.color === "white") {
              whiteBishopSquareColor = squareColor
            } else {
              blackBishopSquareColor = squareColor
            }
          }
        }
      }

      if (whiteBishopSquareColor === blackBishopSquareColor) {
        return true
      }
    }

    return false
  }

  const resetGame = () => {
    // Создаем пустую доску
    const newBoard: Board = Array(8)
      .fill(null)
      .map(() => Array(8).fill({ type: null, color: null }))

    // Расставляем пешки
    for (let col = 0; col < 8; col++) {
      newBoard[1][col] = { type: "pawn", color: "black", hasMoved: false }
      newBoard[6][col] = { type: "pawn", color: "white", hasMoved: false }
    }

    // Расставляем остальные фигуры
    const setupRow = (row: number, color: PieceColor) => {
      newBoard[row][0] = { type: "rook", color, hasMoved: false }
      newBoard[row][1] = { type: "knight", color }
      newBoard[row][2] = { type: "bishop", color }
      newBoard[row][3] = { type: "queen", color }
      newBoard[row][4] = { type: "king", color, hasMoved: false }
      newBoard[row][5] = { type: "bishop", color }
      newBoard[row][6] = { type: "knight", color }
      newBoard[row][7] = { type: "rook", color, hasMoved: false }
    }

    setupRow(0, "black")
    setupRow(7, "white")

    setBoard(newBoard)
    setSelectedCell(null)
    setCurrentPlayer("white")
    setGameOver(false)
    setWinner(null)
    setCapturedPieces({ white: [], black: [] })
    setEnPassantTarget(null)
    setInCheck(null)
    setValidMoves([])
    setCastlingRights({
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    })
    setMoveHistory([])
    setHalfMoveClock(0)
    setFullMoveNumber(1)
    setDrawOffer(null)
    setGameResult(null)

    // Сбрасываем таймер
    const minutes = Number.parseInt(timeOption)
    const seconds = minutes * 60
    setTimeLeft({ white: seconds, black: seconds })
    setTimerActive(false)
  }

  // Проверка валидности хода
  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const piece = board[fromRow][fromCol]
    const targetCell = board[toRow][toCol]

    // Нельзя ходить на клетку с собственной фигурой
    if (targetCell.color === piece.color) return false

    // Проверка рокировки
    if (piece.type === "king" && Math.abs(toCol - fromCol) === 2 && fromRow === toRow) {
      return isValidCastling(fromRow, fromCol, toRow, toCol)
    }

    // Проверка взятия на проходе
    if (piece.type === "pawn" && enPassantTarget && toRow === enPassantTarget.row && toCol === enPassantTarget.col) {
      return true
    }

    // Правила движения для каждого типа фигур
    switch (piece.type) {
      case "pawn": {
        // Направление зависит от цвета
        const direction = piece.color === "white" ? -1 : 1

        // Движение вперед (без взятия)
        if (fromCol === toCol && targetCell.type === null) {
          // Ход на одну клетку вперед
          if (toRow === fromRow + direction) return true

          // Ход на две клетки с начальной позиции
          const startRow = piece.color === "white" ? 6 : 1
          if (
            fromRow === startRow &&
            toRow === fromRow + 2 * direction &&
            board[fromRow + direction][fromCol].type === null
          ) {
            return true
          }
        }

        // Диагональное взятие
        if (
          (toCol === fromCol - 1 || toCol === fromCol + 1) &&
          toRow === fromRow + direction &&
          (targetCell.color !== null ||
            (enPassantTarget && toRow === enPassantTarget.row && toCol === enPassantTarget.col))
        ) {
          return true
        }

        return false
      }

      case "rook": {
        // Ладьи ходят по горизонтали или вертикали
        if (fromRow !== toRow && fromCol !== toCol) return false

        // Проверяем, свободен ли путь
        if (fromRow === toRow) {
          // Горизонтальное движение
          const start = Math.min(fromCol, toCol) + 1
          const end = Math.max(fromCol, toCol)
          for (let col = start; col < end; col++) {
            if (board[fromRow][col].type !== null) return false
          }
        } else {
          // Вертикальное движение
          const start = Math.min(fromRow, toRow) + 1
          const end = Math.max(fromRow, toRow)
          for (let row = start; row < end; row++) {
            if (board[row][fromCol].type !== null) return false
          }
        }

        return true
      }

      case "knight": {
        // Кони ходят буквой "Г": 2 клетки в одном направлении и 1 клетка перпендикулярно
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
      }

      case "bishop": {
        // Слоны ходят по диагонали
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)
        if (rowDiff !== colDiff) return false

        // Проверяем, свободен ли путь
        const rowDirection = toRow > fromRow ? 1 : -1
        const colDirection = toCol > fromCol ? 1 : -1

        for (let i = 1; i < rowDiff; i++) {
          if (board[fromRow + i * rowDirection][fromCol + i * colDirection].type !== null) {
            return false
          }
        }

        return true
      }

      case "queen": {
        // Ферзи ходят как ладьи или слоны
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)

        // Диагональное движение (как слон)
        if (rowDiff === colDiff) {
          const rowDirection = toRow > fromRow ? 1 : -1
          const colDirection = toCol > fromCol ? 1 : -1

          for (let i = 1; i < rowDiff; i++) {
            if (board[fromRow + i * rowDirection][fromCol + i * colDirection].type !== null) {
              return false
            }
          }

          return true
        }

        // Горизонтальное/вертикальное движение (как ладья)
        if (fromRow === toRow || fromCol === toCol) {
          if (fromRow === toRow) {
            // Горизонтальное движение
            const start = Math.min(fromCol, toCol) + 1
            const end = Math.max(fromCol, toCol)
            for (let col = start; col < end; col++) {
              if (board[fromRow][col].type !== null) return false
            }
          } else {
            // Вертикальное движение
            const start = Math.min(fromRow, toRow) + 1
            const end = Math.max(fromRow, toRow)
            for (let row = start; row < end; row++) {
              if (board[row][fromCol].type !== null) return false
            }
          }

          return true
        }

        return false
      }

      case "king": {
        // Короли ходят на одну клетку в любом направлении
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)
        return rowDiff <= 1 && colDiff <= 1
      }

      default:
        return false
    }
  }

  // Проверка возможности рокировки
  const isValidCastling = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const king = board[fromRow][fromCol]

    // Король не должен быть под шахом
    if (isKingInCheck(board, king.color)) return false

    // Определяем, какая это рокировка (короткая или длинная)
    const isKingSideCastling = toCol > fromCol

    // Проверяем права на рокировку
    if (king.color === "white") {
      if (isKingSideCastling && !castlingRights.whiteKingSide) return false
      if (!isKingSideCastling && !castlingRights.whiteQueenSide) return false
    } else {
      if (isKingSideCastling && !castlingRights.blackKingSide) return false
      if (!isKingSideCastling && !castlingRights.blackQueenSide) return false
    }

    const rookCol = isKingSideCastling ? 7 : 0
    const rook = board[fromRow][rookCol]

    // Ладья должна быть на своей начальной позиции
    if (rook.type !== "rook" || rook.color !== king.color) return false

    // Проверяем, что между королем и ладьей нет фигур
    const startCol = Math.min(fromCol, rookCol) + 1
    const endCol = Math.max(fromCol, rookCol)
    for (let col = startCol; col < endCol; col++) {
      if (board[fromRow][col].type !== null) return false
    }

    // Проверяем, что король не проходит через клетки под шахом
    const direction = isKingSideCastling ? 1 : -1
    const tempBoard = board.map((row) => [...row])

    // Проверяем клетку, через которую проходит король
    tempBoard[fromRow][fromCol] = { type: null, color: null }
    tempBoard[fromRow][fromCol + direction] = { ...king }
    if (isKingInCheck(tempBoard, king.color)) return false

    return true
  }

  // Проверка, находится ли король под шахом
  const isKingInCheck = (currentBoard: Board, kingColor: PieceColor): boolean => {
    // Находим позицию короля
    let kingRow = -1
    let kingCol = -1

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = currentBoard[row][col]
        if (piece.type === "king" && piece.color === kingColor) {
          kingRow = row
          kingCol = col
          break
        }
      }
      if (kingRow !== -1) break
    }

    // Если король не найден, возвращаем false
    if (kingRow === -1) return false

    // Проверяем, может ли какая-либо фигура противника атаковать короля
    const opponentColor = kingColor === "white" ? "black" : "white"

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = currentBoard[row][col]
        if (piece.color === opponentColor) {
          // Проверяем, может ли фигура атаковать короля
          if (canPieceAttackSquare(currentBoard, row, col, kingRow, kingCol)) {
            return true
          }
        }
      }
    }

    return false
  }

  // Проверка, может ли фигура атаковать указанную клетку
  const canPieceAttackSquare = (
    currentBoard: Board,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): boolean => {
    const piece = currentBoard[fromRow][fromCol]
    if (!piece.type) return false

    // Правила движения для каждого типа фигур (упрощенная версия isValidMove)
    switch (piece.type) {
      case "pawn": {
        // Направление зависит от цвета
        const direction = piece.color === "white" ? -1 : 1

        // Пешки атакуют только по диагонали
        return (toCol === fromCol - 1 || toCol === fromCol + 1) && toRow === fromRow + direction
      }

      case "rook": {
        // Ладьи ходят по горизонтали или вертикали
        if (fromRow !== toRow && fromCol !== toCol) return false

        // Проверяем, свободен ли путь
        if (fromRow === toRow) {
          // Горизонтальное движение
          const start = Math.min(fromCol, toCol) + 1
          const end = Math.max(fromCol, toCol)
          for (let col = start; col < end; col++) {
            if (currentBoard[fromRow][col].type !== null) return false
          }
        } else {
          // Вертикальное движение
          const start = Math.min(fromRow, toRow) + 1
          const end = Math.max(fromRow, toRow)
          for (let row = start; row < end; row++) {
            if (currentBoard[row][fromCol].type !== null) return false
          }
        }

        return true
      }

      case "knight": {
        // Кони ходят буквой "Г": 2 клетки в одном направлении и 1 клетка перпендикулярно
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
      }

      case "bishop": {
        // Слоны ходят по диагонали
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)
        if (rowDiff !== colDiff) return false

        // Проверяем, свободен ли путь
        const rowDirection = toRow > fromRow ? 1 : -1
        const colDirection = toCol > fromCol ? 1 : -1

        for (let i = 1; i < rowDiff; i++) {
          if (currentBoard[fromRow + i * rowDirection][fromCol + i * colDirection].type !== null) {
            return false
          }
        }

        return true
      }

      case "queen": {
        // Ферзи ходят как ладьи или слоны
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)

        // Диагональное движение (как слон)
        if (rowDiff === colDiff) {
          const rowDirection = toRow > fromRow ? 1 : -1
          const colDirection = toCol > fromCol ? 1 : -1

          for (let i = 1; i < rowDiff; i++) {
            if (currentBoard[fromRow + i * rowDirection][fromCol + i * colDirection].type !== null) {
              return false
            }
          }

          return true
        }

        // Горизонтальное/вертикальное движение (как ладья)
        if (fromRow === toRow || fromCol === toCol) {
          if (fromRow === toRow) {
            // Горизонтальное движение
            const start = Math.min(fromCol, toCol) + 1
            const end = Math.max(fromCol, toCol)
            for (let col = start; col < end; col++) {
              if (currentBoard[fromRow][col].type !== null) return false
            }
          } else {
            // Вертикальное движение
            const start = Math.min(fromRow, toRow) + 1
            const end = Math.max(fromRow, toRow)
            for (let row = start; row < end; row++) {
              if (currentBoard[row][fromCol].type !== null) return false
            }
          }

          return true
        }

        return false
      }

      case "king": {
        // Короли ходят на одну клетку в любом направлении
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)
        return rowDiff <= 1 && colDiff <= 1
      }

      default:
        return false
    }
  }

  // Проверка, приведет ли ход к шаху своему королю
  const willMoveResultInCheck = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const piece = board[fromRow][fromCol]
    const tempBoard = board.map((row) => [...row])

    // Выполняем ход на временной доске
    tempBoard[toRow][toCol] = { ...piece }
    tempBoard[fromRow][fromCol] = { type: null, color: null }

    // Обработка взятия на проходе
    if (piece.type === "pawn" && enPassantTarget && toRow === enPassantTarget.row && toCol === enPassantTarget.col) {
      const capturedPawnRow = piece.color === "white" ? toRow + 1 : toRow - 1
      tempBoard[capturedPawnRow][toCol] = { type: null, color: null }
    }

    // Проверяем, будет ли король под шахом после хода
    return isKingInCheck(tempBoard, piece.color)
  }

  // Получение всех возможных ходов для фигуры
  const getValidMovesForPiece = (row: number, col: number): Position[] => {
    const piece = board[row][col]
    if (!piece.type || piece.color !== currentPlayer) return []

    const moves: Position[] = []

    // Проверяем все возможные клетки на доске
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        // Проверяем, является ли ход допустимым по правилам шахмат
        if (isValidMove(row, col, toRow, toCol)) {
          // Проверяем, не приведет ли ход к шаху своему королю
          if (!willMoveResultInCheck(row, col, toRow, toCol)) {
            moves.push({ row: toRow, col: toCol })
          }
        }
      }
    }

    return moves
  }

  // Получение всех возможных ходов при шахе
  const getValidMovesInCheck = (kingColor: PieceColor): Position[] => {
    const allValidMoves: Position[] = []

    // Находим позицию короля
    let kingRow = -1
    let kingCol = -1

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece.type === "king" && piece.color === kingColor) {
          kingRow = row
          kingCol = col
          break
        }
      }
      if (kingRow !== -1) break
    }

    // Получаем все возможные ходы королем
    if (kingRow !== -1 && kingCol !== -1) {
      const kingMoves = getValidMovesForPiece(kingRow, kingCol)
      kingMoves.forEach((move) => {
        allValidMoves.push(move)
      })
    }

    // Проверяем, может ли какая-либо фигура защитить короля
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece.color === kingColor && piece.type !== "king") {
          const pieceMoves = getValidMovesForPiece(row, col)
          pieceMoves.forEach((move) => {
            // Проверяем, защищает ли этот ход короля от шаха
            const tempBoard = board.map((boardRow) => [...boardRow])
            tempBoard[move.row][move.col] = { ...tempBoard[row][col] }
            tempBoard[row][col] = { type: null, color: null }

            if (!isKingInCheck(tempBoard, kingColor)) {
              allValidMoves.push({ row, col }) // Добавляем позицию фигуры, которая может защитить
            }
          })
        }
      }
    }

    return allValidMoves
  }

  // Проверка, есть ли у игрока возможные ходы
  const hasValidMoves = (playerColor: PieceColor): boolean => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece.color === playerColor) {
          const moves = getValidMovesForPiece(row, col)
          if (moves.length > 0) {
            return true
          }
        }
      }
    }
    return false
  }

  // Обновление состояния шаха и проверка на мат или пат
  const updateGameStatus = () => {
    // Проверяем, находится ли король текущего игрока под шахом
    const isInCheck = isKingInCheck(board, currentPlayer)
    setInCheck(isInCheck ? currentPlayer : null)

    // Проверяем, есть ли у игрока возможные ходы
    const canMove = hasValidMoves(currentPlayer)

    if (!canMove) {
      setGameOver(true)
      if (isInCheck) {
        // Мат - игра окончена
        setWinner(currentPlayer === "white" ? "black" : "white")
        setGameResult(currentPlayer === "white" ? "0-1 (мат)" : "1-0 (мат)")
      } else {
        // Пат - ничья
        setGameResult("½-½ (пат)")
      }
    }

    // Проверка на недостаточный материал для мата
    if (checkInsufficientMaterial()) {
      setGameOver(true)
      setGameResult("½-½ (недостаточный материал)")
    }
  }

  // Преобразование координат в шахматную нотацию
  const toChessNotation = (row: number, col: number): string => {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"]
    return files[col] + ranks[row]
  }

  // Запись хода в алгебраической нотации
  const recordMove = (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    piece: Piece,
    capture: boolean,
    promotion: PieceType | null = null,
    check = false,
    checkmate = false,
    castling: "kingside" | "queenside" | null = null,
  ) => {
    let notation = ""

    if (castling) {
      notation = castling === "kingside" ? "O-O" : "O-O-O"
    } else {
      // Добавляем символ фигуры (кроме пешки)
      if (piece.type !== "pawn") {
        const pieceSymbols: Record<PieceType, string> = {
          king: "K",
          queen: "Q",
          rook: "R",
          bishop: "B",
          knight: "N",
          pawn: "",
          null: "",
        }
        notation += pieceSymbols[piece.type]
      }

      // Для пешек при взятии добавляем файл
      if (piece.type === "pawn" && capture) {
        notation += toChessNotation(fromRow, fromCol)[0]
      }

      // Добавляем символ взятия
      if (capture) {
        notation += "x"
      }

      // Добавляем координаты целевой клетки
      notation += toChessNotation(toRow, toCol)

      // Добавляем информацию о превращении пешки
      if (promotion) {
        const promotionSymbols: Record<PieceType, string> = {
          queen: "Q",
          rook: "R",
          bishop: "B",
          knight: "N",
          king: "",
          pawn: "",
          null: "",
        }
        notation += "=" + promotionSymbols[promotion]
      }
    }

    // Добавляем символы шаха и мата
    if (checkmate) {
      notation += "#"
    } else if (check) {
      notation += "+"
    }

    setMoveHistory((prev) => [...prev, notation])
  }

  // Обработка клика по клетке
  const handleCellClick = (row: number, col: number) => {
    // Предотвращение частых нажатий
    const now = Date.now()
    if (now - lastTouchTimeRef.current < touchThrottleTime) {
      return
    }
    lastTouchTimeRef.current = now

    if (gameOver) return

    // Запускаем таймер при первом ходе, если игра на время
    if (timedGame && !timerActive) {
      setTimerActive(true)
    }

    // Если ни одна клетка не выбрана, выбираем эту, если на ней есть фигура текущего игрока
    if (!selectedCell) {
      const piece = board[row][col]
      if (piece.color === currentPlayer) {
        // Если король под шахом, проверяем, может ли эта фигура защитить короля
        if (inCheck === currentPlayer) {
          const validMovesInCheck = getValidMovesInCheck(currentPlayer)
          const canDefend = validMovesInCheck.some((move) => move.row === row && move.col === col)

          if (canDefend || piece.type === "king") {
            setSelectedCell({ row, col })
            // Получаем все возможные ходы для выбранной фигуры
            const moves = getValidMovesForPiece(row, col)
            setValidMoves(moves)
          } else {
            // Фигура не может защитить короля от шаха
            return
          }
        } else {
          setSelectedCell({ row, col })
          // Получаем все возможные ходы для выбранной фигуры
          const moves = getValidMovesForPiece(row, col)
          setValidMoves(moves)
        }
      }
      return
    }

    // Если кликнули на ту же клетку, снимаем выделение
    if (selectedCell.row === row && selectedCell.col === col) {
      setSelectedCell(null)
      setValidMoves([])
      return
    }

    // Пытаемся сделать ход
    const fromRow = selectedCell.row
    const fromCol = selectedCell.col
    const piece = board[fromRow][fromCol]

    // Проверяем, является ли ход допустимым
    const isValidMoveTarget = validMoves.some((move) => move.row === row && move.col === col)

    if (piece.color === currentPlayer && isValidMoveTarget) {
      // Делаем ход
      const newBoard = [...board.map((row) => [...row])]
      const targetPiece = newBoard[row][col]
      const isCapture = targetPiece.type !== null
      let castlingType: "kingside" | "queenside" | null = null
      let newHalfMoveClock = halfMoveClock

      // Обработка рокировки
      if (piece.type === "king" && Math.abs(col - fromCol) === 2) {
        const isKingSideCastling = col > fromCol
        castlingType = isKingSideCastling ? "kingside" : "queenside"
        const rookCol = isKingSideCastling ? 7 : 0
        const newRookCol = isKingSideCastling ? col - 1 : col + 1

        // Перемещаем ладью
        newBoard[row][newRookCol] = { ...newBoard[row][rookCol], hasMoved: true }
        newBoard[row][rookCol] = { type: null, color: null }

        // Обновляем права на рокировку
        const newCastlingRights = { ...castlingRights }
        if (currentPlayer === "white") {
          newCastlingRights.whiteKingSide = false
          newCastlingRights.whiteQueenSide = false
        } else {
          newCastlingRights.blackKingSide = false
          newCastlingRights.blackQueenSide = false
        }
        setCastlingRights(newCastlingRights)
      }

      // Обработка взятия на проходе
      let enPassantCapture = false
      if (piece.type === "pawn" && enPassantTarget && row === enPassantTarget.row && col === enPassantTarget.col) {
        const capturedPawnRow = currentPlayer === "white" ? row + 1 : row - 1
        const capturedPiece = newBoard[capturedPawnRow][col]
        setCapturedPieces((prev) => ({
          ...prev,
          [currentPlayer]: [...prev[currentPlayer], capturedPiece],
        }))
        newBoard[capturedPawnRow][col] = { type: null, color: null }
        enPassantCapture = true
      }

      // Проверяем, взята ли фигура
      if (isCapture || enPassantCapture) {
        if (isCapture) {
          setCapturedPieces((prev) => ({
            ...prev,
            [currentPlayer]: [...prev[currentPlayer], targetPiece],
          }))
        }
        // Сбрасываем счетчик полуходов при взятии
        newHalfMoveClock = 0
      } else if (piece.type === "pawn") {
        // Сбрасываем счетчик полуходов при ходе пешкой
        newHalfMoveClock = 0
      } else {
        // Увеличиваем счетчик полуходов
        newHalfMoveClock += 1
      }

      // Обновляем счетчик полуходов
      setHalfMoveClock(newHalfMoveClock)

      // Обновляем номер хода
      if (currentPlayer === "black") {
        setFullMoveNumber(fullMoveNumber + 1)
      }

      // Обновляем права на рокировку при ходе королем или ладьей
      if (piece.type === "king") {
        const newCastlingRights = { ...castlingRights }
        if (currentPlayer === "white") {
          newCastlingRights.whiteKingSide = false
          newCastlingRights.whiteQueenSide = false
        } else {
          newCastlingRights.blackKingSide = false
          newCastlingRights.blackQueenSide = false
        }
        setCastlingRights(newCastlingRights)
      } else if (piece.type === "rook") {
        const newCastlingRights = { ...castlingRights }
        if (currentPlayer === "white") {
          if (fromCol === 0) newCastlingRights.whiteQueenSide = false
          if (fromCol === 7) newCastlingRights.whiteKingSide = false
        } else {
          if (fromCol === 0) newCastlingRights.blackQueenSide = false
          if (fromCol === 7) newCastlingRights.blackKingSide = false
        }
        setCastlingRights(newCastlingRights)
      }

      // Проверяем превращение пешки
      let promotion: PieceType | null = null
      if (piece.type === "pawn" && (row === 0 || row === 7)) {
        // Автоматически превращаем в ферзя (можно добавить выбор)
        promotion = "queen"
        newBoard[row][col] = { type: "queen", color: currentPlayer }
      } else {
        // Перемещаем фигуру
        newBoard[row][col] = { ...piece, hasMoved: true }
      }

      newBoard[fromRow][fromCol] = { type: null, color: null }

      // Проверяем, создает ли ход пешки возможность взятия на проходе
      let newEnPassantTarget = null
      if (piece.type === "pawn" && Math.abs(row - fromRow) === 2) {
        const enPassantRow = (fromRow + row) / 2
        newEnPassantTarget = { row: enPassantRow, col }
      }

      setEnPassantTarget(newEnPassantTarget)
      setBoard(newBoard)
      setSelectedCell(null)
      setValidMoves([])

      // Проверяем, будет ли следующий игрок под шахом
      const nextPlayer = currentPlayer === "white" ? "black" : "white"
      const willBeInCheck = isKingInCheck(newBoard, nextPlayer)
      const willBeCheckmate = willBeInCheck && !hasValidMovesAfterMove(newBoard, nextPlayer)

      // Записываем ход в историю
      recordMove(
        fromRow,
        fromCol,
        row,
        col,
        piece,
        isCapture || enPassantCapture,
        promotion,
        willBeInCheck,
        willBeCheckmate,
        castlingType,
      )

      // Меняем игрока
      setCurrentPlayer(nextPlayer)

      // Проверяем, находится ли следующий игрок под шахом
      setTimeout(() => {
        updateGameStatus()
      }, 0)
    } else {
      // Если на кликнутой клетке есть фигура текущего игрока, выбираем её вместо предыдущей
      const newPiece = board[row][col]
      if (newPiece.color === currentPlayer) {
        // Если король под шахом, проверяем, может ли эта фигура защитить короля
        if (inCheck === currentPlayer) {
          const validMovesInCheck = getValidMovesInCheck(currentPlayer)
          const canDefend = validMovesInCheck.some((move) => move.row === row && move.col === col)

          if (canDefend || newPiece.type === "king") {
            setSelectedCell({ row, col })
            // Получаем все возможные ходы для выбранной фигуры
            const moves = getValidMovesForPiece(row, col)
            setValidMoves(moves)
          }
        } else {
          setSelectedCell({ row, col })
          // Получаем все возможные ходы для выбранной фигуры
          const moves = getValidMovesForPiece(row, col)
          setValidMoves(moves)
        }
      }
    }
  }

  // Проверка, есть ли у игрока возможные ходы после хода
  const hasValidMovesAfterMove = (newBoard: Board, playerColor: PieceColor): boolean => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = newBoard[row][col]
        if (piece.color === playerColor) {
          // Проверяем все возможные ходы для этой фигуры
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              // Проверяем базовую валидность хода
              if (isValidMoveOnBoard(newBoard, row, col, toRow, toCol)) {
                // Проверяем, не приведет ли ход к шаху своему королю
                const tempBoard = newBoard.map((boardRow) => [...boardRow])
                tempBoard[toRow][toCol] = { ...tempBoard[row][col] }
                tempBoard[row][col] = { type: null, color: null }

                if (!isKingInCheckOnBoard(tempBoard, playerColor)) {
                  return true
                }
              }
            }
          }
        }
      }
    }
    return false
  }

  // Проверка валидности хода на заданной доске
  const isValidMoveOnBoard = (
    currentBoard: Board,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): boolean => {
    const piece = currentBoard[fromRow][fromCol]
    const targetCell = currentBoard[toRow][toCol]

    // Нельзя ходить на клетку с собственной фигурой
    if (targetCell.color === piece.color) return false

    // Правила движения для каждого типа фигур
    switch (piece.type) {
      case "pawn": {
        // Направление зависит от цвета
        const direction = piece.color === "white" ? -1 : 1

        // Движение вперед (без взятия)
        if (fromCol === toCol && targetCell.type === null) {
          // Ход на одну клетку вперед
          if (toRow === fromRow + direction) return true

          // Ход на две клетки с начальной позиции
          const startRow = piece.color === "white" ? 6 : 1
          if (
            fromRow === startRow &&
            toRow === fromRow + 2 * direction &&
            currentBoard[fromRow + direction][fromCol].type === null
          ) {
            return true
          }
        }

        // Диагональное взятие
        if (
          (toCol === fromCol - 1 || toCol === fromCol + 1) &&
          toRow === fromRow + direction &&
          targetCell.color !== null &&
          targetCell.color !== piece.color
        ) {
          return true
        }

        return false
      }

      case "rook": {
        // Ладьи ходят по горизонтали или вертикали
        if (fromRow !== toRow && fromCol !== toCol) return false

        // Проверяем, свободен ли путь
        if (fromRow === toRow) {
          // Горизонтальное движение
          const start = Math.min(fromCol, toCol) + 1
          const end = Math.max(fromCol, toCol)
          for (let col = start; col < end; col++) {
            if (currentBoard[fromRow][col].type !== null) return false
          }
        } else {
          // Вертикальное движение
          const start = Math.min(fromRow, toRow) + 1
          const end = Math.max(fromRow, toRow)
          for (let row = start; row < end; row++) {
            if (currentBoard[row][fromCol].type !== null) return false
          }
        }

        return true
      }

      case "knight": {
        // Кони ходят буквой "Г": 2 клетки в одном направлении и 1 клетка перпендикулярно
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
      }

      case "bishop": {
        // Слоны ходят по диагонали
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)
        if (rowDiff !== colDiff) return false

        // Проверяем, свободен ли путь
        const rowDirection = toRow > fromRow ? 1 : -1
        const colDirection = toCol > fromCol ? 1 : -1

        for (let i = 1; i < rowDiff; i++) {
          if (currentBoard[fromRow + i * rowDirection][fromCol + i * colDirection].type !== null) {
            return false
          }
        }

        return true
      }

      case "queen": {
        // Ферзи ходят как ладьи или слоны
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)

        // Диагональное движение (как слон)
        if (rowDiff === colDiff) {
          const rowDirection = toRow > fromRow ? 1 : -1
          const colDirection = toCol > fromCol ? 1 : -1

          for (let i = 1; i < rowDiff; i++) {
            if (currentBoard[fromRow + i * rowDirection][fromCol + i * colDirection].type !== null) {
              return false
            }
          }

          return true
        }

        // Горизонтальное/вертикальное движение (как ладья)
        if (fromRow === toRow || fromCol === toCol) {
          if (fromRow === toRow) {
            // Горизонтальное движение
            const start = Math.min(fromCol, toCol) + 1
            const end = Math.max(fromCol, toCol)
            for (let col = start; col < end; col++) {
              if (currentBoard[fromRow][col].type !== null) return false
            }
          } else {
            // Вертикальное движение
            const start = Math.min(fromRow, toRow) + 1
            const end = Math.max(fromRow, toRow)
            for (let row = start; row < end; row++) {
              if (currentBoard[row][fromCol].type !== null) return false
            }
          }

          return true
        }

        return false
      }

      case "king": {
        // Короли ходят на одну клетку в любом направлении
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)
        return rowDiff <= 1 && colDiff <= 1
      }

      default:
        return false
    }
  }

  // Проверка, находится ли король под шахом на заданной доске
  const isKingInCheckOnBoard = (currentBoard: Board, kingColor: PieceColor): boolean => {
    // Находим позицию короля
    let kingRow = -1
    let kingCol = -1

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = currentBoard[row][col]
        if (piece.type === "king" && piece.color === kingColor) {
          kingRow = row
          kingCol = col
          break
        }
      }
      if (kingRow !== -1) break
    }

    // Если король не найден, возвращаем false
    if (kingRow === -1) return false

    // Проверяем, может ли какая-либо фигура противника атаковать короля
    const opponentColor = kingColor === "white" ? "black" : "white"

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = currentBoard[row][col]
        if (piece.color === opponentColor) {
          // Проверяем, может ли фигура атаковать короля
          if (canPieceAttackSquare(currentBoard, row, col, kingRow, kingCol)) {
            return true
          }
        }
      }
    }

    return false
  }

  // Получение цвета клетки (для шахматного узора)
  const getCellColor = (row: number, col: number) => {
    const isEven = (row + col) % 2 === 0
    return isEven ? "bg-amber-100 dark:bg-amber-950" : "bg-amber-800 dark:bg-amber-700"
  }

  // Получение класса подсветки клетки
  const getCellHighlight = (row: number, col: number) => {
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      return "ring-2 ring-blue-500 ring-inset"
    }

    if (validMoves.some((move) => move.row === row && move.col === col)) {
      return "ring-2 ring-green-500 ring-inset"
    }

    // Подсветка короля под шахом
    const piece = board[row][col]
    if (piece.type === "king" && piece.color === inCheck) {
      return "ring-2 ring-red-500 ring-inset"
    }

    return ""
  }

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Получение стиля для фигуры (улучшение видимости в светлом и темном режимах)
  const getPieceStyle = (color: PieceColor, row: number, col: number) => {
    const isLightSquare = (row + col) % 2 === 0
    if (color === "white") {
      return isLightSquare
        ? "text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)] dark:text-white dark:drop-shadow-[0_0_2px_rgba(0,0,0,1)]"
        : "text-white dark:text-white"
    }
    return "text-black dark:text-black"
  }

  // Предложение ничьей
  const offerDraw = () => {
    if (gameOver) return
    setDrawOffer(currentPlayer)
  }

  // Принятие ничьей
  const acceptDraw = () => {
    if (!drawOffer || drawOffer === currentPlayer) return
    setGameOver(true)
    setGameResult("½-½ (по соглашению)")
  }

  // Отклонение ничьей
  const declineDraw = () => {
    setDrawOffer(null)
  }

  // Сдача партии
  const resign = () => {
    if (gameOver) return
    setGameOver(true)
    setWinner(currentPlayer === "white" ? "black" : "white")
    setGameResult(currentPlayer === "white" ? "0-1 (сдача)" : "1-0 (сдача)")
  }

  return (
    <div className="flex flex-col items-center" ref={gameContainerRef}>
      <div className="mb-4 flex items-center gap-4 flex-wrap justify-center">
        <Badge variant="outline" className="text-sm">
          Ход: {currentPlayer === "white" ? "Белые" : "Черные"}
        </Badge>
        {inCheck && (
          <Badge variant="destructive" className="text-sm">
            Шах: {inCheck === "white" ? "Белым" : "Черным"}
          </Badge>
        )}
        {gameOver && gameResult && (
          <Badge variant="default" className="bg-green-500 dark:bg-green-600">
            {gameResult}
          </Badge>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="timed-game"
            checked={timedGame}
            onCheckedChange={(checked) => {
              setTimedGame(checked)
              if (!checked) {
                setTimerActive(false)
              }
            }}
            disabled={timerActive}
          />
          <Label htmlFor="timed-game" className="flex items-center gap-1">
            {timedGame ? <Clock className="h-4 w-4" /> : <ClockOff className="h-4 w-4" />}
            {timedGame ? "Игра на время" : "Без времени"}
          </Label>
        </div>

        {timedGame && !timerActive && (
          <div className="flex items-center gap-2">
            <Label htmlFor="time-option" className="text-sm">
              Время:
            </Label>
            <Select
              value={timeOption}
              onValueChange={(value) => {
                setTimeOption(value)
              }}
              disabled={timerActive}
            >
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Выберите время" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {timedGame && (
          <div className="flex gap-2">
            <Badge variant={currentPlayer === "white" ? "default" : "outline"} className="text-sm">
              Белые: {formatTime(timeLeft.white)}
            </Badge>
            <Badge variant={currentPlayer === "black" ? "default" : "outline"} className="text-sm">
              Черные: {formatTime(timeLeft.black)}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
        {/* Взятые фигуры */}
        <div className="flex flex-col gap-2 w-full md:w-24">
          <div className="text-center font-semibold">Взятые фигуры</div>
          <div className="flex flex-wrap justify-center p-2 min-h-10 bg-muted rounded">
            {capturedPieces.black.map((piece, i) => (
              <span key={`black-${i}`} className="text-xl">
                {piece.type && PIECES[piece.color as keyof typeof PIECES][piece.type as keyof (typeof PIECES)["white"]]}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center p-2 min-h-10 bg-muted rounded">
            {capturedPieces.white.map((piece, i) => (
              <span key={`white-${i}`} className="text-xl">
                {piece.type && PIECES[piece.color as keyof typeof PIECES][piece.type as keyof (typeof PIECES)["white"]]}
              </span>
            ))}
          </div>
        </div>

        {/* Шахматная доска */}
        <div className="relative">
          {/* Координаты столбцов (верх) */}
          <div className="flex">
            <div className="w-5"></div>
            {Array(8)
              .fill(0)
              .map((_, col) => (
                <div key={`top-${col}`} className="w-10 h-5 flex items-center justify-center text-xs">
                  {String.fromCharCode(97 + col)}
                </div>
              ))}
          </div>

          <div className="flex">
            {/* Координаты строк (слева) */}
            <div className="flex flex-col">
              {Array(8)
                .fill(0)
                .map((_, row) => (
                  <div key={`left-${row}`} className="w-5 h-10 flex items-center justify-center text-xs">
                    {8 - row}
                  </div>
                ))}
            </div>

            {/* Сама доска */}
            <div className="grid grid-cols-8 border border-gray-800 dark:border-gray-300">
              {board.map((row, rowIndex) =>
                row.map((piece, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-10 h-10 flex items-center justify-center text-2xl cursor-pointer ${getCellColor(
                      rowIndex,
                      colIndex,
                    )} ${getCellHighlight(rowIndex, colIndex)}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {piece.type && (
                      <span className={getPieceStyle(piece.color, rowIndex, colIndex)}>
                        {PIECES[piece.color as keyof typeof PIECES][piece.type as keyof (typeof PIECES)["white"]]}
                      </span>
                    )}
                  </div>
                )),
              )}
            </div>
          </div>
        </div>

        {/* История ходов и подсказка */}
        <div className="hidden md:flex flex-col justify-center items-center w-32">
          <div className="text-center font-semibold mb-2">История ходов</div>
          <div className="text-sm text-muted-foreground text-center h-40 overflow-y-auto w-full">
            {moveHistory.map((move, index) => (
              <div key={index} className="flex">
                <span className="w-6 text-right mr-1">{Math.floor(index / 2) + 1}.</span>
                <span className={index % 2 === 0 ? "font-medium" : ""}>{move}</span>
              </div>
            ))}
          </div>

          <div className="text-center font-semibold mt-4 mb-2">Подсказка</div>
          <div className="text-sm text-muted-foreground text-center">
            <p>Выберите фигуру, затем выберите куда ходить</p>
            <p className="mt-2">Доступна рокировка и взятие на проходе</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <Button onClick={resetGame} className="flex items-center gap-2" style={{ touchAction: "manipulation" }}>
          <RotateCw className="h-4 w-4" /> Начать заново
        </Button>

        {!gameOver && (
          <>
            <Button onClick={offerDraw} variant="outline" className="text-sm" disabled={drawOffer !== null}>
              Предложить ничью
            </Button>
            <Button onClick={resign} variant="outline" className="text-sm text-red-500 hover:text-red-700">
              Сдаться
            </Button>
          </>
        )}
      </div>

      {/* Диалог предложения ничьей */}
      {drawOffer && drawOffer !== currentPlayer && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-center mb-2">Соперник предлагает ничью</p>
          <div className="flex justify-center gap-2">
            <Button onClick={acceptDraw} variant="default" size="sm">
              Принять
            </Button>
            <Button onClick={declineDraw} variant="outline" size="sm">
              Отклонить
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}