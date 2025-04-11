import type React from "react"
export default function GamesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="flex-1">{children}</div>
}
