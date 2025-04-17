"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCw } from "lucide-react"

// Chess piece types and colors
type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king" | null
type PieceColor = "white" | "black" | null
type Piece = { type: PieceType; color: PieceColor }
type Board = Piece[][]

// Chess piece Unicode symbols
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

export function ChessGame() {
  const [board, setBoard] = useState<Board>([])
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>("white")
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<PieceColor>(null)
  const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[]; black: Piece[] }>({
    white: [],
    black: [],
  })

  // Initialize the board
  useEffect(() => {
    resetGame()
  }, [])

  const resetGame = () => {
    // Create empty board
    const newBoard: Board = Array(8)
      .fill(null)
      .map(() => Array(8).fill({ type: null, color: null }))

    // Set up pawns
    for (let col = 0; col < 8; col++) {
      newBoard[1][col] = { type: "pawn", color: "black" }
      newBoard[6][col] = { type: "pawn", color: "white" }
    }

    // Set up other pieces
    const setupRow = (row: number, color: PieceColor) => {
      newBoard[row][0] = { type: "rook", color }
      newBoard[row][1] = { type: "knight", color }
      newBoard[row][2] = { type: "bishop", color }
      newBoard[row][3] = { type: "queen", color }
      newBoard[row][4] = { type: "king", color }
      newBoard[row][5] = { type: "bishop", color }
      newBoard[row][6] = { type: "knight", color }
      newBoard[row][7] = { type: "rook", color }
    }

    setupRow(0, "black")
    setupRow(7, "white")

    setBoard(newBoard)
    setSelectedCell(null)
    setCurrentPlayer("white")
    setGameOver(false)
    setWinner(null)
    setCapturedPieces({ white: [], black: [] })
  }

  // Check if a move is valid
  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const piece = board[fromRow][fromCol]
    const targetCell = board[toRow][toCol]

    // Can't move to a cell with your own piece
    if (targetCell.color === piece.color) return false

    // Basic movement rules for each piece type
    switch (piece.type) {
      case "pawn": {
        // Direction depends on color
        const direction = piece.color === "white" ? -1 : 1

        // Forward movement (no capture)
        if (fromCol === toCol && targetCell.type === null) {
          // Move one square forward
          if (toRow === fromRow + direction) return true

          // Move two squares from starting position
          const startRow = piece.color === "white" ? 6 : 1
          if (
            fromRow === startRow &&
            toRow === fromRow + 2 * direction &&
            board[fromRow + direction][fromCol].type === null
          ) {
            return true
          }
        }

        // Diagonal capture
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
        // Rooks move horizontally or vertically
        if (fromRow !== toRow && fromCol !== toCol) return false

        // Check if path is clear
        if (fromRow === toRow) {
          // Horizontal movement
          const start = Math.min(fromCol, toCol) + 1
          const end = Math.max(fromCol, toCol)
          for (let col = start; col < end; col++) {
            if (board[fromRow][col].type !== null) return false
          }
        } else {
          // Vertical movement
          const start = Math.min(fromRow, toRow) + 1
          const end = Math.max(fromRow, toRow)
          for (let row = start; row < end; row++) {
            if (board[row][fromCol].type !== null) return false
          }
        }

        return true
      }

      case "knight": {
        // Knights move in L-shape: 2 squares in one direction and 1 square perpendicular
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
      }

      case "bishop": {
        // Bishops move diagonally
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)
        if (rowDiff !== colDiff) return false

        // Check if path is clear
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
        // Queens move like rooks or bishops
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)

        // Diagonal movement (like bishop)
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

        // Horizontal/vertical movement (like rook)
        if (fromRow === toRow || fromCol === toCol) {
          if (fromRow === toRow) {
            // Horizontal movement
            const start = Math.min(fromCol, toCol) + 1
            const end = Math.max(fromCol, toCol)
            for (let col = start; col < end; col++) {
              if (board[fromRow][col].type !== null) return false
            }
          } else {
            // Vertical movement
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
        // Kings move one square in any direction
        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)
        return rowDiff <= 1 && colDiff <= 1
      }

      default:
        return false
    }
  }

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (gameOver) return

    // If no cell is selected, select this one if it has a piece of the current player
    if (!selectedCell) {
      const piece = board[row][col]
      if (piece.color === currentPlayer) {
        setSelectedCell({ row, col })
      }
      return
    }

    // If the same cell is clicked again, deselect it
    if (selectedCell.row === row && selectedCell.col === col) {
      setSelectedCell(null)
      return
    }

    // Try to move the piece
    const fromRow = selectedCell.row
    const fromCol = selectedCell.col
    const piece = board[fromRow][fromCol]

    if (piece.color === currentPlayer && isValidMove(fromRow, fromCol, row, col)) {
      // Make the move
      const newBoard = [...board.map((row) => [...row])]

      // Check if a piece is captured
      if (newBoard[row][col].type !== null) {
        const capturedPiece = newBoard[row][col]
        setCapturedPieces((prev) => ({
          ...prev,
          [currentPlayer]: [...prev[currentPlayer], capturedPiece],
        }))

        // Check if king is captured (game over)
        if (newBoard[row][col].type === "king") {
          setGameOver(true)
          setWinner(currentPlayer)
        }
      }

      // Move the piece
      newBoard[row][col] = piece
      newBoard[fromRow][fromCol] = { type: null, color: null }

      setBoard(newBoard)
      setSelectedCell(null)
      setCurrentPlayer(currentPlayer === "white" ? "black" : "white")
    } else {
      // If the clicked cell has a piece of the current player, select it instead
      const newPiece = board[row][col]
      if (newPiece.color === currentPlayer) {
        setSelectedCell({ row, col })
      }
    }
  }

  // Get cell color (for checkerboard pattern)
  const getCellColor = (row: number, col: number) => {
    const isEven = (row + col) % 2 === 0
    return isEven ? "bg-amber-100" : "bg-amber-800"
  }

  // Get cell highlight class
  const getCellHighlight = (row: number, col: number) => {
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      return "ring-2 ring-blue-500 ring-inset"
    }

    if (selectedCell && isValidMove(selectedCell.row, selectedCell.col, row, col)) {
      return "ring-2 ring-green-500 ring-inset"
    }

    return ""
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex items-center gap-4">
        <Badge variant="outline" className="text-sm">
          Ход: {currentPlayer === "white" ? "Белые" : "Черные"}
        </Badge>
        {gameOver && (
          <Badge variant="default" className="bg-green-500">
            Победитель: {winner === "white" ? "Белые" : "Черные"}
          </Badge>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
        {/* Captured pieces */}
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

        {/* Chess board */}
        <div className="grid grid-cols-8 border border-gray-800">
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
                  <span className={piece.color === "black" ? "text-black" : "text-white"}>
                    {PIECES[piece.color as keyof typeof PIECES][piece.type as keyof (typeof PIECES)["white"]]}
                  </span>
                )}
              </div>
            )),
          )}
        </div>

        {/* Column labels */}
        <div className="hidden md:flex flex-col justify-center items-center w-24">
          <div className="text-center font-semibold mb-2">Подсказка</div>
          <div className="text-sm text-muted-foreground text-center">
            <p>Выберите фигуру, затем выберите куда ходить</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <Button onClick={resetGame} className="flex items-center gap-2">
          <RotateCw className="h-4 w-4" /> Начать заново
        </Button>
      </div>
    </div>
  )
}
