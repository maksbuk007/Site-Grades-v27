"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { getStudentData, subjects, calculateAverage, type Grade } from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UpcomingTests } from "@/components/upcoming-tests"
import { GradesLineChart } from "@/components/charts/grades-line-chart"
import { GradesPieChart } from "@/components/charts/grades-pie-chart"
import { SubjectsComparisonChart } from "@/components/charts/subjects-comparison-chart"
import { ExtendedStatistics } from "@/components/statistics/extended-statistics"
import { useNotifications } from "@/components/notifications/notification-provider"
import { DiscussionEmbed } from 'disqus-react'

export default function Dashboard() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [gradesData, setGradesData] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("grades")

  useEffect(() => {
    // Флаг для отслеживания, были ли уже показаны уведомления
    const notificationsShown = localStorage.getItem("notificationsShown")

    // Обновим функцию loadData
    const loadData = async () => {
      if (user) {
        try {
          setLoading(true)
          setError(null)
          setDebug(null)

          console.log("Загрузка данных для пользователя:", user.id, user.name)
          const result = await getStudentData(user.id)

          // Проверяем, есть ли данные
          let hasAnyGrades = false
          const debugInfo = []

          for (const subjectId in result.data.subjects) {
            const current = result.data.subjects[subjectId].current || []
            if (current.length > 0) {
              hasAnyGrades = true
              debugInfo.push(`${subjectId}: ${current.length} оценок`)
            }
          }

          if (!hasAnyGrades) {
            setDebug(`Данные загружены, но оценок не найдено. Проверьте структуру данных: ${JSON.stringify(debugInfo)}`)
          }

          setGradesData(result.data)
          setLastUpdate(result.lastUpdate || "")

          // Показываем уведомления только один раз при первой загрузке
          if (!notificationsShown) {
            // Добавляем тестовое уведомление при загрузке данных
           /* addNotification({
              title: "Данные обновлены",
              message: `Данные успеваемости обновлены: ${result.lastUpdate || new Date().toLocaleString()}`,
              type: "info",
            })

            // Добавляем тестовое уведомление о предстоящей контрольной
            addNotification({
              title: "Предстоящая контрольная",
              message: "Контрольная работа по математике через 3 дня",
              type: "warning",
            }) */

            // Устанавливаем флаг, что уведомления были показаны
            localStorage.setItem("notificationsShown", "true")
          }
        } catch (err) {
          console.error("Ошибка при загрузке данных:", err)
          setError("Не удалось загрузить данные оценок. Пожалуйста, попробуйте позже.")
        } finally {
          setLoading(false)
        }
      }
    }

    loadData()
  }, [user, addNotification])

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    }).format(date)
  }

  // Определение цвета для оценки (10-балльная система)
  const getGradeColor = (value: number) => {
    if (value >= 9) return "bg-green-600 text-white"
    if (value >= 7) return "bg-green-500 text-white"
    if (value >= 5) return "bg-blue-500 text-white"
    if (value >= 3) return "bg-yellow-500 text-white"
    if (value >= 2) return "bg-orange-500 text-white"
    return "bg-red-500 text-white"
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[250px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* В блоке return добавим отображение даты последнего обновления */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Текущие оценки</h2>
        <div className="flex flex-col items-end">
          <p className="text-muted-foreground">Учебный год 2024-2025, 4 четверть</p>
          {lastUpdate && <p className="text-xs text-muted-foreground">Обновлено: {lastUpdate}</p>}
          {user?.role === "student" && (
            <p className="text-sm font-medium">
              {user.name}, {user.class} класс
            </p>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {debug && (
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{debug}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="grades">Оценки</TabsTrigger>
          <TabsTrigger value="charts">Графики</TabsTrigger>
          <TabsTrigger value="statistics">Статистика</TabsTrigger>
        </TabsList>

        <TabsContent value="grades">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => {
                  const subjectData = gradesData?.subjects[subject.id]
                  const currentGrades = subjectData?.current || []
                  const average = calculateAverage(currentGrades)

                  return (
                    <Card key={subject.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle>{subject.name}</CardTitle>
                          {average > 0 && (
                            <Badge variant="outline" className="text-lg">
                              {average}
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          {currentGrades.length > 0 ? `${currentGrades.length} оценок` : "Нет оценок"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {currentGrades.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {currentGrades.map((grade: Grade, index: number) => (
                              <div
                                key={index}
                                className={`flex flex-col items-center rounded-md px-2 py-1 text-xs ${getGradeColor(grade.value)}`}
                                title={`Дата: ${new Date(grade.date).toLocaleDateString("ru-RU")}`}
                              >
                                <span className="font-bold">{grade.value}</span>
                                <span className="text-[10px]">{formatDate(grade.date)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm italic">В текущей четверти оценок пока нет</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            <div>
              <UpcomingTests />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid gap-6 md:grid-cols-2">
            <GradesLineChart gradesData={gradesData} />
            <GradesPieChart gradesData={gradesData} />
            <div className="md:col-span-2">
              <SubjectsComparisonChart gradesData={gradesData} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="statistics">
          <ExtendedStatistics
            gradesData={gradesData}
            classAverages={{
              math: 7.2,
              rus_lang: 7.8,
              bel_lang: 7.5,
              physics: 6.9,
              chemistry: 7.1,
              biology: 8.0,
              informatics: 8.2,
            }}
          />
        </TabsContent>
      </Tabs>
            <DiscussionEmbed
          shortname='site-grades'
          config={
              {
                  url: this.props.article.url,
                  identifier: this.props.article.id,
                  title: this.props.article.title,
                  language: 'zh_TW' //e.g. for Traditional Chinese (Taiwan)
              }
          }
      />
    </div>
  )
}

