"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChessBoard } from "./chess-board"
import { RacingGame3D } from "./racing-game-3d"
import { SnakeGame } from "./snake-game"
import { TetrisGame } from "./tetris-game"
import { QuizGame } from "./quiz-game"
import Game2048 from "./game-2048"
import FlappyBird from "./flappy-bird"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function GamesClient() {
  const [activeTab, setActiveTab] = useState("chess")

  const games = [
    { id: "chess", name: "Шахматы" },
    { id: "tetris", name: "Тетрис" },
    { id: "snake", name: "Змейка" },
    { id: "racing", name: "Гонки" },
    { id: "quiz", name: "Викторина" },
    { id: "2048", name: "2048" },
    { id: "flappy", name: "Flappy Bird" },
  ]

  return (
    <div className="container py-6 px-2 sm:px-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Игры</h1>

      {/* Мобильный селектор игр (отображается только на маленьких экранах) */}
      <div className="block md:hidden mb-4">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите игру" />
          </SelectTrigger>
          <SelectContent>
            {games.map((game) => (
              <SelectItem key={game.id} value={game.id}>
                {game.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="chess" value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Вкладки для средних и больших экранов */}
        <TabsList className="hidden md:grid grid-cols-4 lg:grid-cols-7 gap-1 mb-4 overflow-x-auto">
          {games.map((game) => (
            <TabsTrigger key={game.id} value={game.id} className="whitespace-normal h-full py-2 text-xs sm:text-sm">
              {game.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="chess" className="mt-0">
          <ChessBoard />
        </TabsContent>
        <TabsContent value="tetris" className="mt-0">
          <TetrisGame />
        </TabsContent>
        <TabsContent value="snake" className="mt-0">
          <SnakeGame />
        </TabsContent>
        <TabsContent value="racing" className="mt-0">
          <RacingGame3D />
        </TabsContent>
        <TabsContent value="quiz" className="mt-0">
          <QuizGame />
        </TabsContent>
        <TabsContent value="2048" className="mt-0">
          <Game2048 />
        </TabsContent>
        <TabsContent value="flappy" className="mt-0">
          <FlappyBird />
        </TabsContent>
      </Tabs>
    </div>
  )
}
