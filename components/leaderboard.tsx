"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getLeaderboard } from "@/lib/google-sheets"
import { Skeleton } from "@/components/ui/skeleton"

interface LeaderboardEntry {
  name: string
  score: number
  date: string
  game: string
}

interface LeaderboardProps {
  defaultGame?: string
  limit?: number
  className?: string
}

export function Leaderboard({ defaultGame, limit = 5, className = "" }: LeaderboardProps) {
  const [selectedGame, setSelectedGame] = useState<string>(defaultGame || "")
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [games, setGames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await getLeaderboard()
        const uniqueGames = Array.from(new Set(data.map((entry) => entry.game))).sort()
        setGames(uniqueGames)

        if (uniqueGames.length > 0 && !selectedGame) {
          setSelectedGame(defaultGame || uniqueGames[0])
        }
      } catch (err) {
        console.error("Error fetching games:", err)
        setError("Не удалось загрузить список игр")
      }
    }

    fetchGames()
  }, [defaultGame])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedGame) return

      setLoading(true)
      setError(null)

      try {
        const data = await getLeaderboard()
        const filteredData = data
          .filter((entry) => entry.game === selectedGame)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)

        setEntries(filteredData)
      } catch (err) {
        console.error("Error fetching leaderboard:", err)
        setError("Не удалось загрузить таблицу лидеров")
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [selectedGame, limit])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
    } catch (e) {
      return dateString
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Таблица лидеров</span>
          {games.length > 0 && (
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Выберите игру" />
              </SelectTrigger>
              <SelectContent>
                {games.map((game) => (
                  <SelectItem key={game} value={game}>
                    {game}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead className="text-right">Счет</TableHead>
                <TableHead className="text-right">Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: limit }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-6 w-6" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : entries.length > 0 ? (
                entries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell className="text-right">{entry.score}</TableCell>
                    <TableCell className="text-right">{formatDate(entry.date)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Нет данных для отображения
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
