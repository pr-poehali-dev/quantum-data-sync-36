import { useState } from "react"
import { DashboardHeader } from "@/components/DashboardHeader"
import { StatsCards } from "@/components/StatsCards"
import { StudentsTable } from "@/components/StudentsTable"
import { GradesChart } from "@/components/GradesChart"

export default function Index() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "students" | "grades">("dashboard")

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in-up">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Обзор успеваемости</h1>
              <p className="text-muted-foreground">Ежемесячные контрольные работы и среднегодовые результаты</p>
            </div>
            <StatsCards />
            <GradesChart />
            <StudentsTable />
          </div>
        )}
        {activeTab === "students" && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">База студентов</h1>
              <p className="text-muted-foreground">Все зарегистрированные студенты и их результаты</p>
            </div>
            <StudentsTable showAll />
          </div>
        )}
        {activeTab === "grades" && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Результаты контрольных</h1>
              <p className="text-muted-foreground">Ежемесячные результаты и среднегодовой расчёт</p>
            </div>
            <GradesChart showDetailed />
          </div>
        )}
      </main>
    </div>
  )
}
