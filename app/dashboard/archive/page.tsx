"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { getStudentData, subjects, calculateAverage, quarters } from "@/lib/data"
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

  // Группировка четвертей по учебным годам
  const academicYears = {
    "2024-2025": quarters,
  }

  useEffect(() => {
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

  // Определение цвета для среднего балла
  const getAverageColor = (value: number) => {
    if (value >= 9) return "text-green-600 dark:text-green-500"
    if (value >= 7) return "text-green-500 dark:text-green-400"
    if (value >= 5) return "text-blue-500 dark:text-blue-400"
    if (value >= 3) return "text-yellow-500 dark:text-yellow-400"
    if (value >= 2) return "text-orange-500 dark:text-orange-400"
    return "text-red-500 dark:text-red-400"
  }

  // Новая система округления годовых оценок (Пример 1)
  const roundAnnualGrade = (average: number) => {
    if (average >= 9.5) return 10
    if (average >= 8.5) return 9
    if (average >= 7.5) return 8
    if (average >= 6.5) return 7
    if (average >= 5.5) return 6
    if (average >= 4.5) return 5
    if (average >= 3.5) return 4
    if (average >= 2.5) return 3
    if (average >= 1.5) return 2
    return 1
  }

  // Расчет годовой оценки с новым округлением
  const calculateYearlyAverage = (subjectId: string, yearQuarters: typeof quarters) => {
    if (!gradesData) return 0

    const subjectData = gradesData.subjects[subjectId]
    if (!subjectData) return 0

    let allGrades: any[] = []

    yearQuarters.forEach((quarter) => {
      const quarterGrades = getQuarterGrades(subjectData, quarter.id)
      allGrades = [...allGrades, ...quarterGrades]
    })

    const rawAverage = calculateAverage(allGrades, false)
    return roundAnnualGrade(rawAverage)
  }

  // Получение оценок за четверть
  const getQuarterGrades = (subjectData: any, quarterId: string) => {
    if (quarterId === "current") {
      if (subjectData.quarters["2025-Q4"]?.length > 0) {
        return subjectData.quarters["2025-Q4"]
      }
      return subjectData.current || []
    }
    return subjectData.quarters[quarterId] || []
  }

  // Расчет среднего за четверть (для отображения в таблице)
  const calculateQuarterAverage = (grades: any[]) => {
    return calculateAverage(grades, false)
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Архив оценок</h2>
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
          <CardTitle>Архив оценок по учебным годам</CardTitle>
          <CardDescription>Просмотр оценок за все прошедшие учебные периоды</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue="2024-2025">
            {Object.entries(academicYears).map(([year, yearQuarters]) => (
              <AccordionItem key={year} value={year}>
                <AccordionTrigger className="text-lg font-semibold">
                  Учебный год {year}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Предмет</TableHead>
                          {yearQuarters.map((quarter) => (
                            <TableHead key={quarter.id} className="text-center">
                              {quarter.name.replace("2024-2025", "")}
                            </TableHead>
                          ))}
                          <TableHead className="text-right">Годовая</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjects.map((subject) => {
                          const subjectData = gradesData?.subjects[subject.id]
                          const yearlyAverage = calculateYearlyAverage(subject.id, yearQuarters)

                          return (
                            <TableRow key={subject.id}>
                              <TableCell className="font-medium">{subject.name}</TableCell>

                              {yearQuarters.map((quarter) => {
                                const quarterGrades = getQuarterGrades(subjectData, quarter.id)
                                const average = calculateQuarterAverage(quarterGrades)

                                return (
                                  <TableCell key={quarter.id} className="text-center">
                                    {average > 0 ? (
                                      <Badge variant="outline" className={getAverageColor(average)}>
                                        {average.toFixed(2)}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                )
                              })}

                              <TableCell className={`text-right font-bold ${getAverageColor(yearlyAverage)}`}>
                                {yearlyAverage > 0 ? yearlyAverage : "—"}
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
