"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Country = {
  country: string
  capital: string
  flag: string
}

export function QuizGame() {
  const countryQuizData: Country[] = [
    { country: "Франция", capital: "Париж", flag: "🇫🇷" },
    { country: "Германия", capital: "Берлин", flag: "🇩🇪" },
    { country: "Япония", capital: "Токио", flag: "🇯🇵" },
    { country: "Италия", capital: "Рим", flag: "🇮🇹" },
    { country: "Бразилия", capital: "Бразилиа", flag: "🇧🇷" },
    { country: "Канада", capital: "Оттава", flag: "🇨🇦" },
    { country: "Австралия", capital: "Канберра", flag: "🇦🇺" },
    { country: "Россия", capital: "Москва", flag: "🇷🇺" },
    { country: "США", capital: "Вашингтон", flag: "🇺🇸" },
    { country: "Китай", capital: "Пекин", flag: "🇨🇳" },
    { country: "Индия", capital: "Нью-Дели", flag: "🇮🇳" },
    { country: "Великобритания", capital: "Лондон", flag: "🇬🇧" },
    { country: "Испания", capital: "Мадрид", flag: "🇪🇸" },
    { country: "Мексика", capital: "Мехико", flag: "🇲🇽" },
    { country: "Южная Корея", capital: "Сеул", flag: "🇰🇷" },
    { country: "Аргентина", capital: "Буэнос-Айрес", flag: "🇦🇷" },
    { country: "Швеция", capital: "Стокгольм", flag: "🇸🇪" },
    { country: "Норвегия", capital: "Осло", flag: "🇳🇴" },
    { country: "Финляндия", capital: "Хельсинки", flag: "🇫🇮" },
    { country: "Дания", capital: "Копенгаген", flag: "🇩🇰" },
    { country: "Польша", capital: "Варшава", flag: "🇵🇱" },
    { country: "Австрия", capital: "Вена", flag: "🇦🇹" },
    { country: "Швейцария", capital: "Берн", flag: "🇨🇭" },
    { country: "Нидерланды", capital: "Амстердам", flag: "🇳🇱" },
    { country: "Бельгия", capital: "Брюссель", flag: "🇧🇪" },
    { country: "Португалия", capital: "Лиссабон", flag: "🇵🇹" },
    { country: "Греция", capital: "Афины", flag: "🇬🇷" },
    { country: "Турция", capital: "Анкара", flag: "🇹🇷" },
    { country: "Египет", capital: "Каир", flag: "🇪🇬" },
    { country: "Марокко", capital: "Рабат", flag: "🇲🇦" },
    { country: "Южная Африка", capital: "Претория", flag: "🇿🇦" },
    { country: "Нигерия", capital: "Абуджа", flag: "🇳🇬" },
    { country: "Кения", capital: "Найроби", flag: "🇰🇪" },
    { country: "Эфиопия", capital: "Аддис-Абеба", flag: "🇪🇹" },
    { country: "Саудовская Аравия", capital: "Эр-Рияд", flag: "🇸🇦" },
    { country: "ОАЭ", capital: "Абу-Даби", flag: "🇦🇪" },
    { country: "Иран", capital: "Тегеран", flag: "🇮🇷" },
    { country: "Ирак", capital: "Багдад", flag: "🇮🇶" },
    { country: "Израиль", capital: "Иерусалим", flag: "🇮🇱" },
    { country: "Таиланд", capital: "Бангкок", flag: "🇹🇭" },
    { country: "Вьетнам", capital: "Ханой", flag: "🇻🇳" },
    { country: "Индонезия", capital: "Джакарта", flag: "🇮🇩" },
    { country: "Малайзия", capital: "Куала-Лумпур", flag: "🇲🇾" },
    { country: "Филиппины", capital: "Манила", flag: "🇵🇭" },
    { country: "Сингапур", capital: "Сингапур", flag: "🇸🇬" },
    { country: "Новая Зеландия", capital: "Веллингтон", flag: "🇳🇿" },
    { country: "Чили", capital: "Сантьяго", flag: "🇨🇱" },
    { country: "Перу", capital: "Лима", flag: "🇵🇪" },
    { country: "Колумбия", capital: "Богота", flag: "🇨🇴" },
    { country: "Венесуэла", capital: "Каракас", flag: "🇻🇪" },
    { country: "Куба", capital: "Гавана", flag: "🇨🇺" },
    { country: "Ямайка", capital: "Кингстон", flag: "🇯🇲" },
    { country: "Исландия", capital: "Рейкьявик", flag: "🇮🇸" },
    { country: "Ирландия", capital: "Дублин", flag: "🇮🇪" },
    { country: "Чехия", capital: "Прага", flag: "🇨🇿" },
    { country: "Словакия", capital: "Братислава", flag: "🇸🇰" },
    { country: "Венгрия", capital: "Будапешт", flag: "🇭🇺" },
    { country: "Румыния", capital: "Бухарест", flag: "🇷🇴" },
    { country: "Болгария", capital: "София", flag: "🇧🇬" },
    { country: "Сербия", capital: "Белград", flag: "🇷🇸" },
    { country: "Хорватия", capital: "Загреб", flag: "🇭🇷" },
    { country: "Украина", capital: "Киев", flag: "🇺🇦" },
    { country: "Беларусь", capital: "Минск", flag: "🇧🇾" },
    { country: "Литва", capital: "Вильнюс", flag: "🇱🇹" },
    { country: "Латвия", capital: "Рига", flag: "🇱🇻" },
    { country: "Эстония", capital: "Таллин", flag: "🇪🇪" },
    { country: "Казахстан", capital: "Астана", flag: "🇰🇿" },
    { country: "Узбекистан", capital: "Ташкент", flag: "🇺🇿" },
    { country: "Туркменистан", capital: "Ашхабад", flag: "🇹🇲" },
    { country: "Киргизия", capital: "Бишкек", flag: "🇰🇬" },
    { country: "Таджикистан", capital: "Душанбе", flag: "🇹🇯" },
    { country: "Монголия", capital: "Улан-Батор", flag: "🇲🇳" },
    { country: "Непал", capital: "Катманду", flag: "🇳🇵" },
    { country: "Бангладеш", capital: "Дакка", flag: "🇧🇩" },
    { country: "Шри-Ланка", capital: "Коломбо", flag: "🇱🇰" },
    { country: "Мьянма", capital: "Нейпьидо", flag: "🇲🇲" },
    { country: "Камбоджа", capital: "Пномпень", flag: "🇰🇭" },
    { country: "Лаос", capital: "Вьентьян", flag: "🇱🇦" },
    { country: "Северная Корея", capital: "Пхеньян", flag: "🇰🇵" },
    { country: "Тайвань", capital: "Тайбэй", flag: "🇹🇼" },
    { country: "Папуа-Новая Гвинея", capital: "Порт-Морсби", flag: "🇵🇬" },
    { country: "Фиджи", capital: "Сува", flag: "🇫🇯" },
    { country: "Соломоновы Острова", capital: "Хониара", flag: "🇸🇧" },
    { country: "Вануату", capital: "Порт-Вила", flag: "🇻🇺" },
    { country: "Самоа", capital: "Апиа", flag: "🇼🇸" },
    { country: "Тонга", capital: "Нукуалофа", flag: "🇹🇴" },
    { country: "Кирибати", capital: "Южная Тарава", flag: "🇰🇮" },
    { country: "Маршалловы Острова", capital: "Маджуро", flag: "🇲🇭" },
    { country: "Микронезия", capital: "Паликир", flag: "🇫🇲" },
    { country: "Палау", capital: "Нгерулмуд", flag: "🇵🇼" },
    { country: "Науру", capital: "Ярен", flag: "🇳🇷" },
    { country: "Тувалу", capital: "Фунафути", flag: "🇹🇻" },
    { country: "Мальдивы", capital: "Мале", flag: "🇲🇻" },
    { country: "Сейшельские Острова", capital: "Виктория", flag: "🇸🇨" },
    { country: "Маврикий", capital: "Порт-Луи", flag: "🇲🇺" },
    { country: "Коморские Острова", capital: "Морони", flag: "🇰🇲" },
    { country: "Мадагаскар", capital: "Антананариву", flag: "🇲🇬" },
    { country: "Танзания", capital: "Додома", flag: "🇹🇿" },
    { country: "Уганда", capital: "Кампала", flag: "🇺🇬" },
    { country: "Руанда", capital: "Кигали", flag: "🇷🇼" },
    { country: "Бурунди", capital: "Гитега", flag: "🇧🇮" },
    { country: "Малави", capital: "Лилонгве", flag: "🇲🇼" },
    { country: "Замбия", capital: "Лусака", flag: "🇿🇲" },
    { country: "Зимбабве", capital: "Хараре", flag: "🇿🇼" },
    { country: "Ботсвана", capital: "Габороне", flag: "🇧🇼" },
    { country: "Намибия", capital: "Виндхук", flag: "🇳🇦" },
    { country: "Ангола", capital: "Луанда", flag: "🇦🇴" },
    { country: "Конго", capital: "Браззавиль", flag: "🇨🇬" },
    { country: "ДР Конго", capital: "Киншаса", flag: "🇨🇩" },
    { country: "Габон", capital: "Либревиль", flag: "🇬🇦" },
    { country: "Экваториальная Гвинея", capital: "Малабо", flag: "🇬🇶" },
    { country: "Камерун", capital: "Яунде", flag: "🇨🇲" },
    { country: "Нигер", capital: "Ниамей", flag: "🇳🇪" },
    { country: "Чад", capital: "Нджамена", flag: "🇹🇩" },
    { country: "Судан", capital: "Хартум", flag: "🇸🇩" },
    { country: "Южный Судан", capital: "Джуба", flag: "🇸🇸" },
    { country: "Эритрея", capital: "Асмэра", flag: "🇪🇷" },
    { country: "Джибути", capital: "Джибути", flag: "🇩🇯" },
    { country: "Сомали", capital: "Могадишо", flag: "🇸🇴" },
    { country: "Ливия", capital: "Триполи", flag: "🇱🇾" },
    { country: "Тунис", capital: "Тунис", flag: "🇹🇳" },
    { country: "Алжир", capital: "Алжир", flag: "🇩🇿" },
    { country: "Мавритания", capital: "Нуакшот", flag: "🇲🇷" },
    { country: "Мали", capital: "Бамако", flag: "🇲🇱" },
    { country: "Сенегал", capital: "Дакар", flag: "🇸🇳" },
    { country: "Гамбия", capital: "Банжул", flag: "🇬🇲" },
    { country: "Гвинея-Бисау", capital: "Бисау", flag: "🇬🇼" },
    { country: "Гвинея", capital: "Конакри", flag: "🇬🇳" },
    { country: "Сьерра-Леоне", capital: "Фритаун", flag: "🇸🇱" },
    { country: "Либерия", capital: "Монровия", flag: "🇱🇷" },
    { country: "Кот-д'Ивуар", capital: "Ямусукро", flag: "🇨🇮" },
    { country: "Гана", capital: "Аккра", flag: "🇬🇭" },
    { country: "Того", capital: "Ломе", flag: "🇹🇬" },
    { country: "Бенин", capital: "Порто-Ново", flag: "🇧🇯" },
    { country: "Буркина-Фасо", capital: "Уагадугу", flag: "🇧🇫" },
    { country: "Кабо-Верде", capital: "Прая", flag: "🇨🇻" },
    { country: "Сан-Томе и Принсипи", capital: "Сан-Томе", flag: "🇸🇹" },
    { country: "Доминиканская Республика", capital: "Санто-Доминго", flag: "🇩🇴" },
    { country: "Гаити", capital: "Порт-о-Пренс", flag: "🇭🇹" },
    { country: "Багамские Острова", capital: "Нассау", flag: "🇧🇸" },
    { country: "Тринидад и Тобаго", capital: "Порт-оф-Спейн", flag: "🇹🇹" },
    { country: "Барбадос", capital: "Бриджтаун", flag: "🇧🇧" },
    { country: "Сент-Люсия", capital: "Кастри", flag: "🇱🇨" },
    { country: "Гренада", capital: "Сент-Джорджес", flag: "🇬🇩" },
    { country: "Антигуа и Барбуда", capital: "Сент-Джонс", flag: "🇦🇬" },
    { country: "Сент-Винсент и Гренадины", capital: "Кингстаун", flag: "🇻🇨" },
    { country: "Сент-Китс и Невис", capital: "Бастер", flag: "🇰🇳" },
    { country: "Доминика", capital: "Розо", flag: "🇩🇲" },
    { country: "Белиз", capital: "Бельмопан", flag: "🇧🇿" },
    { country: "Гватемала", capital: "Гватемала", flag: "🇬🇹" },
    { country: "Сальвадор", capital: "Сан-Сальвадор", flag: "🇸🇻" },
    { country: "Гондурас", capital: "Тегусигальпа", flag: "🇭🇳" },
    { country: "Никарагуа", capital: "Манагуа", flag: "🇳🇮" },
    { country: "Коста-Рика", capital: "Сан-Хосе", flag: "🇨🇷" },
    { country: "Панама", capital: "Панама", flag: "🇵🇦" },
    { country: "Эквадор", capital: "Кито", flag: "🇪🇨" },
    { country: "Боливия", capital: "Сукре", flag: "🇧🇴" },
    { country: "Парагвай", capital: "Асунсьон", flag: "🇵🇾" },
    { country: "Уругвай", capital: "Монтевидео", flag: "🇺🇾" },
    { country: "Гайана", capital: "Джорджтаун", flag: "🇬🇾" },
    { country: "Суринам", capital: "Парамарибо", flag: "🇸🇷" },
    { country: "Мальта", capital: "Валлетта", flag: "🇲🇹" },
    { country: "Кипр", capital: "Никосия", flag: "🇨🇾" },
    { country: "Люксембург", capital: "Люксембург", flag: "🇱🇺" },
    { country: "Андорра", capital: "Андорра-ла-Велья", flag: "🇦🇩" },
    { country: "Монако", capital: "Монако", flag: "🇲🇨" },
    { country: "Лихтенштейн", capital: "Вадуц", flag: "🇱🇮" },
    { country: "Сан-Марино", capital: "Сан-Марино", flag: "🇸🇲" },
    { country: "Ватикан", capital: "Ватикан", flag: "🇻🇦" },
    { country: "Черногория", capital: "Подгорица", flag: "🇲🇪" },
    { country: "Северная Македония", capital: "Скопье", flag: "🇲🇰" },
    { country: "Албания", capital: "Тирана", flag: "🇦🇱" },
    { country: "Молдова", capital: "Кишинев", flag: "🇲🇩" },
    { country: "Словения", capital: "Любляна", flag: "🇸🇮" },
    { country: "Бахрейн", capital: "Манама", flag: "🇧🇭" },
    { country: "Катар", capital: "Доха", flag: "🇶🇦" },
    { country: "Кувейт", capital: "Эль-Кувейт", flag: "🇰🇼" },
    { country: "Оман", capital: "Маскат", flag: "🇴🇲" },
    { country: "Иордания", capital: "Амман", flag: "🇯🇴" },
    { country: "Ливан", capital: "Бейрут", flag: "🇱🇧" },
    { country: "Сирия", capital: "Дамаск", flag: "🇸🇾" },
    { country: "Йемен", capital: "Сана", flag: "🇾🇪" },
    { country: "Афганистан", capital: "Кабул", flag: "🇦🇫" },
    { country: "Пакистан", capital: "Исламабад", flag: "🇵🇰" },
    { country: "Бутан", capital: "Тхимпху", flag: "🇧🇹" },
    { country: "Бруней", capital: "Бандар-Сери-Бегаван", flag: "🇧🇳" },
    { country: "Восточный Тимор", capital: "Дили", flag: "🇹🇱" },
  ]

  const lastTouchTimeRef = useRef<number>(0)
  const touchThrottleTime = 300 // миллисекунды между разрешенными нажатиями
  const gameContainerRef = useRef<HTMLDivElement>(null)

  const [quizType, setQuizType] = useState<"capitals" | "flags">("capitals")
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  // Обработка нажатий клавиш для предотвращения прокрутки страницы
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Проверяем, активна ли игра и нажата ли стрелка
      if (gameContainerRef.current) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
          e.preventDefault() // Предотвращаем прокрутку страницы
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Инициализация викторины при изменении типа
  useEffect(() => {
    resetQuiz()
  }, [quizType])

  // Генерация вопросов для викторины
  const generateQuestions = () => {
    // Перемешиваем массив стран
    const shuffledCountries = [...countryQuizData].sort(() => Math.random() - 0.5)

    // Берем первые 10 стран для вопросов
    const selectedCountries = shuffledCountries.slice(0, 10)

    // Создаем вопросы в зависимости от типа викторины
    return selectedCountries.map((item) => {
      // Определяем правильный ответ
      const correctAnswer = quizType === "capitals" ? item.capital : item.flag

      // Создаем массив неправильных ответов
      const incorrectAnswers = countryQuizData
        .filter((country) => country !== item)
        .sort(() => Math.random() - 0.5)
        .slice(0, 6)
        .map((country) => (quizType === "capitals" ? country.capital : country.flag))

      // Объединяем правильный ответ и неправильные ответы
      const options = shuffle([correctAnswer, ...incorrectAnswers])

      return {
        question:
          quizType === "capitals" ? `Столица ${item.country}? ${item.flag}` : `Какой флаг у страны ${item.country}?`,
        options,
        correctAnswer,
        country: item.country,
      }
    })
  }

  // Сброс викторины
  const resetQuiz = () => {
    const newQuestions = generateQuestions()
    setQuestions(newQuestions)
    setCurrentQuestion(0)
    setScore(0)
    setShowResult(false)
    setSelectedOption(null)
    setAnswered(false)
  }

  // Обработка ответа
  const handleAnswer = (optionIndex: number) => {
    // Предотвращение частых нажатий
    const now = Date.now()
    if (now - lastTouchTimeRef.current < touchThrottleTime) {
      return
    }
    lastTouchTimeRef.current = now

    if (answered) return
    setSelectedOption(optionIndex)
    setAnswered(true)

    const current = questions[currentQuestion]
    // Находим индекс правильного ответа
    const correctIndex = current.options.findIndex((opt: string) => opt === current.correctAnswer)

    if (optionIndex === correctIndex) {
      setScore((prev) => prev + 1)
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
        setSelectedOption(null)
        setAnswered(false)
      } else {
        setShowResult(true)
      }
    }, 800)
  }

  // Функция для перемешивания массива
  function shuffle<T>(array: T[]): T[] {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  return (
    <div className="flex flex-col items-center" ref={gameContainerRef}>
      <div className="mb-4 w-full max-w-md">
        <Tabs
          defaultValue={quizType}
          onValueChange={(value) => setQuizType(value as "capitals" | "flags")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="capitals">Угадай столицу</TabsTrigger>
            <TabsTrigger value="flags">Угадай флаг</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {questions.length > 0 ? (
        showResult ? (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-xl font-bold">Результат</h3>
            <p className="text-lg">
              Вы ответили правильно на {score} из {questions.length} вопросов
            </p>
            <div className="text-2xl">
              {score === questions.length
                ? "🎉 Отлично!"
                : score >= questions.length / 2
                  ? "👍 Хорошо!"
                  : "😕 Попробуйте еще раз!"}
            </div>
            <Button onClick={resetQuiz} style={{ touchAction: "manipulation" }}>
              Начать заново
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-md">
            <div className="flex justify-between">
              <div className="px-2 py-1 rounded-full bg-muted text-sm font-medium">
                Вопрос {currentQuestion + 1} из {questions.length}
              </div>
              <div className="px-2 py-1 rounded-full bg-muted text-sm font-medium">Счет: {score}</div>
            </div>
            <h3 className="text-lg font-medium">{questions[currentQuestion].question}</h3>
            <div className="flex flex-col gap-2">
              {questions[currentQuestion].options.map((option: string, index: number) => {
                const correctIndex = questions[currentQuestion].options.findIndex(
                  (opt: string) => opt === questions[currentQuestion].correctAnswer,
                )

                let buttonClass = "justify-start text-left px-4 py-2 rounded-md border border-border"

                if (answered) {
                  if (index === correctIndex) {
                    buttonClass += " bg-green-500 text-white dark:bg-green-600"
                  } else if (index === selectedOption) {
                    buttonClass += " bg-red-500 text-white dark:bg-red-600"
                  } else {
                    buttonClass += " bg-muted dark:bg-secondary-foreground"
                  }
                }

                return (
                  <Button
                    key={index}
                    className={buttonClass}
                    onClick={() => handleAnswer(index)}
                    disabled={answered}
                    style={{ touchAction: "manipulation" }}
                  >
                    {option}
                  </Button>
                )
              })}
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-xl font-bold">Загрузка викторины...</h3>
        </div>
      )}
    </div>
  )
}
