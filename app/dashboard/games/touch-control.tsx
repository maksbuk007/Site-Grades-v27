
"use client"

export function TouchControl({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault()
    onClick()
  }

  return (
    <div 
      onClick={onClick}
      onTouchStart={handleTouch}
      onTouchEnd={(e) => e.preventDefault()}
      className="touch-manipulation select-none"
    >
      {children}
    </div>
  )
}

// Использование:
<TouchControl onClick={() => moveSnake('UP')}>
  <ArrowUp />
</TouchControl>
