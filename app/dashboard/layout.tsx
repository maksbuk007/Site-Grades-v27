import type React from "react"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { DisqusCount } from "@/components/disqus-count" // Импортируем компонент

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6">
          {children}
          {/* Добавляем DisqusCount в конце основного контента */}
          <DisqusCount />
        </main>
      </div>
    </div>
  )
}
