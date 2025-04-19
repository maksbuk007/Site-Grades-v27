"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveScore } from "@/lib/google-sheets"
import { useToast } from "@/components/ui/use-toast"

interface ScoreModalProps {
  isOpen: boolean
  onClose: () => void
  score: number
  game: string
  onSaved?: () => void
}

export function ScoreModal({ isOpen, onClose, score, game, onSaved }: ScoreModalProps) {
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите ваше имя",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await saveScore({
        name: name.trim(),
        game,
        score,
        date: new Date().toISOString(),
      })

      toast({
        title: "Успех!",
        description: "Ваш результат сохранен в таблице лидеров",
      })

      if (onSaved) {
        onSaved()
      }

      onClose()
    } catch (error) {
      console.error("Error saving score:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить результат. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Сохранить результат</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="game">Игра</Label>
            <Input id="game" value={game} disabled />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="score">Счет</Label>
            <Input id="score" value={score.toString()} disabled />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="name">Ваше имя</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
