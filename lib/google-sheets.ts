// Интерфейс для записи результата
interface ScoreEntry {
  name: string
  game: string
  score: number
  date: string
}

// Функция для сохранения результата в Google Sheets
export async function saveScore(entry: ScoreEntry): Promise<void> {
  try {
    const response = await fetch("/api/scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    })

    if (!response.ok) {
      throw new Error("Failed to save score")
    }
  } catch (error) {
    console.error("Error saving score:", error)
    throw error
  }
}

// Функция для получения таблицы лидеров из Google Sheets
export async function getLeaderboard(): Promise<ScoreEntry[]> {
  try {
    const response = await fetch("/api/scores")

    if (!response.ok) {
      throw new Error("Failed to fetch leaderboard")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    throw error
  }
}
