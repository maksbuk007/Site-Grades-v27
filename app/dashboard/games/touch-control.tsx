"use client"

import { useEffect, useRef } from "react"

type TouchControlProps = {
  onDirectionChange: (direction: string) => void
}

export function TouchControl({ onDirectionChange }: TouchControlProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      e.preventDefault()
      const touch = e.touches[0]
      const startX = touchStartRef.current.x
      const startY = touchStartRef.current.y
      const currentX = touch.clientX
      const currentY = touch.clientY

      const diffX = startX - currentX
      const diffY = startY - currentY

      // Определяем направление свайпа
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Горизонтальный свайп
        if (diffX > 10) {
          onDirectionChange("left")
        } else if (diffX < -10) {
          onDirectionChange("right")
        }
      } else {
        // Вертикальный свайп
        if (diffY > 10) {
          onDirectionChange("up")
        } else if (diffY < -10) {
          onDirectionChange("down")
        }
      }

      // Сбрасываем начальную точку после определения направления
      touchStartRef.current = null
    }

    const handleTouchEnd = () => {
      touchStartRef.current = null
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: false })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [onDirectionChange])

  return (
    <div
      ref={containerRef}
      className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center touch-manipulation"
    >
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Свайпните для перемещения плиток</p>
        <div className="mt-2 grid grid-cols-3 gap-1 w-24 mx-auto">
          <div></div>
          <div className="text-center">↑</div>
          <div></div>
          <div className="text-center">←</div>
          <div></div>
          <div className="text-center">→</div>
          <div></div>
          <div className="text-center">↓</div>
          <div></div>
        </div>
      </div>
    </div>
  )
}
