"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { getStudentData, subjects, quarters } from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ArchivePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [gradesData, setGradesData] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Получаем только прошлые четверти (без текущей)
  const pastQuarters = quarters.filter((q) => q.id !== "current")

  // Обновим группировку четвертей по учебным годам
  const academicYears = {
    "2023-2024": quarters,
  }

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
          setError("Не удалось загрузить данные оценок.")
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

  // Получение оценки за четверть из архивных данных
  const getQuarterGrade = (subjectId: string, quarterIndex: number) => {
    if (!gradesData || !gradesData.subjects[subjectId] || !gradesData.subjects[subjectId].archiveGrades) {
      return 0
    }

    const archiveGrades = gradesData.subjects[subjectId].archiveGrades
    if (!archiveGrades || archiveGrades.length <= quarterIndex) {
      return 0
    }

    return archiveGrades[quarterIndex] || 0
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
        <h2 className="text-3xl font-bold tracking-tight">Архив оценок</h2>
        <div className="flex flex-col items-end">
          <p className="text-muted-foreground">Учебный год 2023-2024</p>
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
          <CardTitle>Архив оценок по учебным годам</CardTitle>
          <CardDescription>Просмотр оценок за все прошедшие учебные периоды</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue="2023-2024">
            {Object.entries(academicYears).map(([year, yearQuarters]) => (
              <AccordionItem key={year} value={year}>
                <AccordionTrigger className="text-lg font-semibold">Учебный год {year}</AccordionTrigger>
                <AccordionContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Предмет</TableHead>
                          <TableHead className="text-center">I четверть</TableHead>
                          <TableHead className="text-center">II четверть</TableHead>
                          <TableHead className="text-center">III четверть</TableHead>
                          <TableHead className="text-center">IV четверть</TableHead>
                          <TableHead className="text-right">Годовая</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjects.map((subject) => {
                          return (
                            <TableRow key={subject.id}>
                              <TableCell className="font-medium">{subject.name}</TableCell>

                              {/* I четверть */}
                              <TableCell className="text-center">
                                {getQuarterGrade(subject.id, 0) > 0 ? (
                                  <Badge variant="outline" className={getAverageColor(getQuarterGrade(subject.id, 0))}>
                                    {getQuarterGrade(subject.id, 0)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>

                              {/* II четверть */}
                              <TableCell className="text-center">
                                {getQuarterGrade(subject.id, 1) > 0 ? (
                                  <Badge variant="outline" className={getAverageColor(getQuarterGrade(subject.id, 1))}>
                                    {getQuarterGrade(subject.id, 1)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>

                              {/* III четверть */}
                              <TableCell className="text-center">
                                {getQuarterGrade(subject.id, 2) > 0 ? (
                                  <Badge variant="outline" className={getAverageColor(getQuarterGrade(subject.id, 2))}>
                                    {getQuarterGrade(subject.id, 2)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>

                              {/* IV четверть */}
                              <TableCell className="text-center">
                                {getQuarterGrade(subject.id, 3) > 0 ? (
                                  <Badge variant="outline" className={getAverageColor(getQuarterGrade(subject.id, 3))}>
                                    {getQuarterGrade(subject.id, 3)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>

                              {/* Годовая оценка */}
                              <TableCell
                                className={`text-right font-bold ${getAverageColor(getQuarterGrade(subject.id, 4))}`}
                              >
                                {getQuarterGrade(subject.id, 4) > 0 ? getQuarterGrade(subject.id, 4) : "—"}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
