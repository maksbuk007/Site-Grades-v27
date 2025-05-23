"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { getStudentData, subjects, calculateAverage, quarters } from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HistoryPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  // Обновим тип состояния
  const [gradesData, setGradesData] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Получаем только прошлые четверти (без текущей)
  const pastQuarters = quarters.filter((q) => q.id !== "current")

  useEffect(() => {
    // Обновим функцию loadData
    const loadData = async () => {
      if (user) {
        try {
          setLoading(true)
          setError(null)
          const result = await getStudentData(user.id)
          setGradesData(result.data)
          setLastUpdate(result.lastUpdate || "")
        } catch (error) {
          console.error("Ошибка при загрузке данных:", error)
          setError("Не удалось загрузить данные оценок. Используются локальные данные.")
        } finally {
          setLoading(false)
        }
      }
    }

    loadData()
  }, [user])

  // Определение цвета для среднего балла (10-балльная система)
  const getAverageColor = (value: number) => {
    if (value >= 9) return "text-green-600 dark:text-green-500"
    if (value >= 7) return "text-green-500 dark:text-green-400"
    if (value >= 5) return "text-blue-500 dark:text-blue-400"
    if (value >= 3) return "text-yellow-500 dark:text-yellow-400"
    if (value >= 2) return "text-orange-500 dark:text-orange-400"
    return "text-red-500 dark:text-red-400"
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* В блоке return добавим отображение даты последнего обновления */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">История оценок</h2>
        <div className="flex flex-col items-end">
          <p className="text-muted-foreground">Учебный год 2024-2025</p>
          {lastUpdate && <p className="text-xs text-muted-foreground">Обновлено: {lastUpdate}</p>}
          {user?.role === "student" && (
            <p className="text-sm font-medium">
              {user.name}, {user.class} класс
            </p>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Оценки за прошлые четверти</CardTitle>
          <CardDescription>Просмотр оценок за предыдущие учебные периоды</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={pastQuarters[pastQuarters.length - 1].id}>
            <TabsList className="mb-4">
              {pastQuarters.map((quarter) => (
                <TabsTrigger key={quarter.id} value={quarter.id}>
                  {quarter.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {pastQuarters.map((quarter) => (
              <TabsContent key={quarter.id} value={quarter.id}>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Предмет</TableHead>
                        <TableHead>Оценки</TableHead>
                        <TableHead className="text-right w-[100px]">Средний балл</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((subject) => {
                        const subjectData = gradesData?.subjects[subject.id]
                        const quarterGrades = subjectData?.quarters[quarter.id] || []
                        // Используем округление для четвертных оценок
                        const average = calculateAverage(quarterGrades, true)

                        return (
                          <TableRow key={subject.id}>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            <TableCell>
                              {quarterGrades.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {quarterGrades.map((grade: any, index: number) => (
                                    <span
                                      key={index}
                                      className="inline-block rounded-md bg-muted px-2 py-1 text-xs"
                                      title={`Дата: ${new Date(grade.date).toLocaleDateString("ru-RU")}`}
                                    >
                                      {grade.value}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm italic">Нет оценок</span>
                              )}
                            </TableCell>
                            <TableCell className={`text-right font-bold ${getAverageColor(average)}`}>
                              {average > 0 ? average : "—"}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

