"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react"
import { TouchControl } from "./touch-control" // Исправлен импорт

type Cell = {
  value: number
  id: string
  mergedFrom?: string[]
  isNew?: boolean
}

type Grid = Cell[][]

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>([])
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [size, setSize] = useState(4)
  const [keepPlaying, setKeepPlaying] = useState(false)
  const [touchControlsEnabled, setTouchControlsEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // Initialize the game
  const initializeGame = useCallback(() => {
    const newGrid = Array(size)
      .fill(null)
      .map(() =>
        Array(size)
          .fill(null)
          .map(() => ({ value: 0, id: Math.random().toString(36).substr(2, 9) })),
      )

    // Add two initial tiles
    const gridWithTiles = addRandomTile(addRandomTile(newGrid))

    setGrid(gridWithTiles)
    setScore(0)
    setGameOver(false)
    setGameWon(false)
    setKeepPlaying(false)
  }, [size])

  // Load best score from localStorage
  useEffect(() => {
    const savedBestScore = localStorage.getItem("2048-best-score")
    if (savedBestScore) {
      setBestScore(Number.parseInt(savedBestScore, 10))
    }

    const savedDarkMode = localStorage.getItem("game-dark-mode")
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === "true")
    }
  }, [])

  // Initialize game on mount and when size changes
  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  // Add a random tile to the grid
  const addRandomTile = (grid: Grid): Grid => {
    const emptyCells: { row: number; col: number }[] = []

    // Find all empty cells
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col].value === 0) {
          emptyCells.push({ row, col })
        }
      }
    }

    if (emptyCells.length === 0) return grid

    // Choose a random empty cell
    const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)]

    // Create a new grid with the random tile
    const newGrid = [...grid]
    newGrid[row][col] = {
      value: Math.random() < 0.9 ? 2 : 4, // 90% chance for 2, 10% chance for 4
      id: Math.random().toString(36).substr(2, 9),
      isNew: true,
    }

    return newGrid
  }

  // Check if the game is over
  const checkGameOver = (grid: Grid): boolean => {
    // Check for empty cells
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col].value === 0) {
          return false
        }
      }
    }

    // Check for possible merges
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const value = grid[row][col].value

        // Check right
        if (col < size - 1 && grid[row][col + 1].value === value) {
          return false
        }

        // Check down
        if (row < size - 1 && grid[row + 1][col].value === value) {
          return false
        }
      }
    }

    return true
  }

  // Check if the game is won
  const checkGameWon = (grid: Grid): boolean => {
    if (gameWon && keepPlaying) return false

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col].value === 2048) {
          return true
        }
      }
    }

    return false
  }

  // Move tiles in a direction
  const moveTiles = (direction: "up" | "right" | "down" | "left") => {
    if (gameOver && !keepPlaying) return

    let newGrid = JSON.parse(JSON.stringify(grid)) as Grid
    let moved = false
    let newScore = score

    // Clear previous merge flags and new flags
    newGrid = newGrid.map((row) => row.map((cell) => ({ ...cell, mergedFrom: undefined, isNew: false })))

    // Helper function to move a row or column
    const move = (cells: Cell[]): { cells: Cell[]; moved: boolean; scoreIncrease: number } => {
      const nonEmptyCells = cells.filter((cell) => cell.value !== 0)
      const newCells = Array(cells.length)
        .fill(null)
        .map(() => ({ value: 0, id: Math.random().toString(36).substr(2, 9) }))
      let scoreIncrease = 0
      let movedInThisLine = false

      let position = 0
      for (let i = 0; i < nonEmptyCells.length; i++) {
        const current = nonEmptyCells[i]

        // If we can merge with the previous cell
        if (i < nonEmptyCells.length - 1 && nonEmptyCells[i].value === nonEmptyCells[i + 1].value) {
          const mergedValue = current.value * 2
          newCells[position] = {
            value: mergedValue,
            id: Math.random().toString(36).substr(2, 9),
            mergedFrom: [current.id, nonEmptyCells[i + 1].id],
          }
          scoreIncrease += mergedValue
          i++ // Skip the next cell since we merged it
        } else {
          newCells[position] = { ...current }
        }

        if (cells[position].value !== newCells[position].value) {
          movedInThisLine = true
        }

        position++
      }

      return { cells: newCells, moved: movedInThisLine, scoreIncrease }
    }

    // Process each row or column based on direction
    if (direction === "left") {
      for (let row = 0; row < size; row++) {
        const { cells, moved: movedInThisLine, scoreIncrease } = move(newGrid[row])
        if (movedInThisLine) {
          moved = true
          newGrid[row] = cells
          newScore += scoreIncrease
        }
      }
    } else if (direction === "right") {
      for (let row = 0; row < size; row++) {
        const reversed = [...newGrid[row]].reverse()
        const { cells, moved: movedInThisLine, scoreIncrease } = move(reversed)
        if (movedInThisLine) {
          moved = true
          newGrid[row] = cells.reverse()
          newScore += scoreIncrease
        }
      }
    } else if (direction === "up") {
      for (let col = 0; col < size; col++) {
        const column = newGrid.map((row) => row[col])
        const { cells, moved: movedInThisLine, scoreIncrease } = move(column)
        if (movedInThisLine) {
          moved = true
          for (let row = 0; row < size; row++) {
            newGrid[row][col] = cells[row]
          }
          newScore += scoreIncrease
        }
      }
    } else if (direction === "down") {
      for (let col = 0; col < size; col++) {
        const column = newGrid.map((row) => row[col]).reverse()
        const { cells, moved: movedInThisLine, scoreIncrease } = move(column)
        if (movedInThisLine) {
          moved = true
          const reversedCells = cells.reverse()
          for (let row = 0; row < size; row++) {
            newGrid[row][col] = reversedCells[row]
          }
          newScore += scoreIncrease
        }
      }
    }

    // If tiles moved, add a new random tile
    if (moved) {
      newGrid = addRandomTile(newGrid)
      setScore(newScore)

      // Update best score if needed
      if (newScore > bestScore) {
        setBestScore(newScore)
        localStorage.setItem("2048-best-score", newScore.toString())
      }
    }

    // Check if game is won or over
    const won = checkGameWon(newGrid)
    if (won && !gameWon) {
      setGameWon(true)
    }

    const over = checkGameOver(newGrid)
    if (over) {
      setGameOver(true)
    }

    setGrid(newGrid)
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver && !keepPlaying) return

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          moveTiles("up")
          break
        case "ArrowRight":
          e.preventDefault()
          moveTiles("right")
          break
        case "ArrowDown":
          e.preventDefault()
          moveTiles("down")
          break
        case "ArrowLeft":
          e.preventDefault()
          moveTiles("left")
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [grid, gameOver, keepPlaying])

  // Handle touch controls
  const handleTouchControl = (direction: string) => {
    if (!touchControlsEnabled) return

    switch (direction) {
      case "up":
        moveTiles("up")
        break
      case "right":
        moveTiles("right")
        break
      case "down":
        moveTiles("down")
        break
      case "left":
        moveTiles("left")
        break
    }
  }

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem("game-dark-mode", newDarkMode.toString())
  }

  // Get cell background color based on value
  const getCellBackgroundColor = (value: number): string => {
    const colors: Record<number, string> = {
      0: darkMode ? "bg-gray-800" : "bg-gray-200",
      2: darkMode ? "bg-blue-900" : "bg-blue-100",
      4: darkMode ? "bg-green-900" : "bg-green-100",
      8: darkMode ? "bg-yellow-900" : "bg-yellow-200",
      16: darkMode ? "bg-orange-900" : "bg-orange-200",
      32: darkMode ? "bg-red-900" : "bg-red-300",
      64: darkMode ? "bg-pink-900" : "bg-pink-300",
      128: darkMode ? "bg-purple-900" : "bg-purple-300",
      256: darkMode ? "bg-indigo-900" : "bg-indigo-300",
      512: darkMode ? "bg-blue-800" : "bg-blue-400",
      1024: darkMode ? "bg-green-800" : "bg-green-400",
      2048: darkMode ? "bg-yellow-800" : "bg-yellow-400",
    }

    return colors[value] || (darkMode ? "bg-gray-700" : "bg-gray-400")
  }

  // Get cell text color based on value
  const getCellTextColor = (value: number): string => {
    if (darkMode) {
      return value <= 4 ? "text-gray-300" : "text-white"
    }
    return value <= 4 ? "text-gray-800" : "text-white"
  }

  // Get cell size based on grid size
  const getCellSize = (): string => {
    const sizes: Record<number, string> = {
      3: "w-20 h-20 text-3xl",
      4: "w-16 h-16 text-2xl",
      5: "w-12 h-12 text-xl",
      6: "w-10 h-10 text-lg",
    }

    return sizes[size] || "w-16 h-16 text-2xl"
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${darkMode ? "bg-gray-900 text-white" : "bg-white"}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold">2048</h2>
          </div>
          <div className="flex space-x-2">
            <div className={`p-2 rounded ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}>
              <div className="text-xs">SCORE</div>
              <div className="font-bold">{score}</div>
            </div>
            <div className={`p-2 rounded ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}>
              <div className="text-xs">BEST</div>
              <div className="font-bold">{bestScore}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={initializeGame}
            className={darkMode ? "border-gray-700 hover:bg-gray-800" : ""}
          >
            <RotateCcw className="mr-1 h-4 w-4" /> New Game
          </Button>

          <div className="flex items-center space-x-2">
            <Label htmlFor="dark-mode" className="text-sm">
              Dark
            </Label>
            <Switch id="dark-mode" checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </div>

        {gameWon && !keepPlaying && (
          <div className={`mb-4 p-3 rounded text-center ${darkMode ? "bg-green-900" : "bg-green-100"}`}>
            <p className="font-bold">You won! 🎉</p>
            <Button variant="outline" size="sm" onClick={() => setKeepPlaying(true)} className="mt-2">
              Keep Playing
            </Button>
          </div>
        )}

        {gameOver && (
          <div className={`mb-4 p-3 rounded text-center ${darkMode ? "bg-red-900" : "bg-red-100"}`}>
            <p className="font-bold">Game Over!</p>
            <Button variant="outline" size="sm" onClick={initializeGame} className="mt-2">
              Try Again
            </Button>
          </div>
        )}

        <div className={`grid gap-2 p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}>
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-2">
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    ${getCellSize()}
                    ${getCellBackgroundColor(cell.value)}
                    ${getCellTextColor(cell.value)}
                    flex items-center justify-center
                    font-bold rounded
                    transition-all duration-100
                    ${cell.isNew ? "animate-pop-in" : ""}
                    ${cell.mergedFrom ? "animate-merge" : ""}
                  `}
                >
                  {cell.value !== 0 ? cell.value : ""}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="grid-size" className="text-sm">
              Grid Size: {size}x{size}
            </Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="touch-controls" className="text-sm">
                Touch
              </Label>
              <Switch id="touch-controls" checked={touchControlsEnabled} onCheckedChange={setTouchControlsEnabled} />
            </div>
          </div>

          <Slider
            id="grid-size"
            min={3}
            max={6}
            step={1}
            value={[size]}
            onValueChange={(value) => setSize(value[0])}
            className="mb-4"
          />

          {touchControlsEnabled ? (
            <TouchControl onDirectionChange={handleTouchControl} />
          ) : (
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div></div>
              <Button variant="outline" onClick={() => moveTiles("up")}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <div></div>
              <Button variant="outline" onClick={() => moveTiles("left")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => moveTiles("down")}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => moveTiles("right")}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <style jsx global>{`
          @keyframes pop-in {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          
          @keyframes merge {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          
          .animate-pop-in {
            animation: pop-in 0.2s ease-in-out;
          }
          
          .animate-merge {
            animation: merge 0.2s ease-in-out;
          }
        `}</style>
      </CardContent>
    </Card>
  )
}
