// ! games-client.tsx — современная реализация всех игр

"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// --------- Утилита ---------
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

const countries = [
  { name: "Франция", capital: "Париж", flag: "🇫🇷" },
  { name: "Германия", capital: "Берлин", flag: "🇩🇪" },
  { name: "Италия", capital: "Рим", flag: "🇮🇹" },
  { name: "США", capital: "Вашингтон", flag: "🇺🇸" },
  { name: "Япония", capital: "Токио", flag: "🇯🇵" },
  { name: "Канада", capital: "Оттава", flag: "🇨🇦" },
  { name: "Китай", capital: "Пекин", flag: "🇨🇳" },
  { name: "Бразилия", capital: "Бразилиа", flag: "🇧🇷" },
  { name: "Аргентина", capital: "Буэнос-Айрес", flag: "🇦🇷" },
  { name: "Испания", capital: "Мадрид", flag: "🇪🇸" },
  { name: "Россия", capital: "Москва", flag: "🇷🇺" },
  { name: "Египет", capital: "Каир", flag: "🇪🇬" },
  { name: "Австралия", capital: "Канберра", flag: "🇦🇺" },
]

// --------- Викторина ---------
function CapitalQuiz() {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [shuffledCountries, setShuffledCountries] = useState(shuffleArray(countries))
  const [score, setScore] = useState(() => parseInt(localStorage.getItem("quizScore") || "0"))
  const [finished, setFinished] = useState(false)

  const current = shuffledCountries[questionIndex]
  const options = shuffleArray([
    current.capital,
    ...shuffleArray(countries.filter(c => c.capital !== current.capital)).slice(0, 3).map(c => c.capital),
  ])

  const handleAnswer = (answer: string) => {
    if (answer === current.capital) {
      const newScore = score + 1
      setScore(newScore)
      localStorage.setItem("quizScore", newScore.toString())
    }
    if (questionIndex < shuffledCountries.length - 1) {
      setQuestionIndex((q) => q + 1)
    } else {
      setFinished(true)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Столица какой страны: {current.name} {current.flag}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {finished ? (
          <div className="space-y-2">
            <p>Вы завершили викторину!</p>
            <Badge>Правильных ответов: {score} из {shuffledCountries.length}</Badge>
          </div>
        ) : (
          options.map((option, idx) => (
            <Button key={idx} onClick={() => handleAnswer(option)}>{option}</Button>
          ))
        )}
      </CardContent>
    </Card>
  )
}

// --------- Змейка ---------
function SnakeGame() {
  return (
    <Card>
      <CardHeader><CardTitle>Змейка (новая версия)</CardTitle></CardHeader>
      <CardContent>
        <iframe
          title="snake"
          src="https://snake.hcodes.io"
          className="w-full aspect-video rounded-md border"
          sandbox="allow-scripts"
        />
      </CardContent>
    </Card>
  )
}

// --------- Тетрис ---------
function TetrisGame() {
  return (
    <Card>
      <CardHeader><CardTitle>Тетрис (новая версия)</CardTitle></CardHeader>
      <CardContent>
        <iframe
          title="tetris"
          src="https://tetris.hcodes.io"
          className="w-full aspect-video rounded-md border"
          sandbox="allow-scripts"
        />
      </CardContent>
    </Card>
  )
}

// --------- Гонки ---------
function RacingGame() {
  return (
    <Card>
      <CardHeader><CardTitle>Гонки (новая версия)</CardTitle></CardHeader>
      <CardContent>
        <iframe
          title="racing"
          src="https://racing.hcodes.io"
          className="w-full aspect-video rounded-md border"
          sandbox="allow-scripts"
        />
      </CardContent>
    </Card>
  )
}

// --------- Главный компонент ---------
export default function GamesClient() {
  const [tab, setTab] = useState("quiz")

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList>
          <TabsTrigger value="quiz">🧠 Викторина</TabsTrigger>
          <TabsTrigger value="snake">🐍 Змейка</TabsTrigger>
          <TabsTrigger value="tetris">🧩 Тетрис</TabsTrigger>
          <TabsTrigger value="race">🏎️ Гонки</TabsTrigger>
        </TabsList>

        <TabsContent value="quiz">
          <CapitalQuiz />
        </TabsContent>
        <TabsContent value="snake">
          <SnakeGame />
        </TabsContent>
        <TabsContent value="tetris">
          <TetrisGame />
        </TabsContent>
        <TabsContent value="race">
          <RacingGame />
        </TabsContent>
      </Tabs>
    </div>
  )
}
