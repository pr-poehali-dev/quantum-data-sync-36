import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import Icon from "@/components/ui/icon"
import { apiGetStudents, Student } from "@/lib/api"

export function StatsCards() {
  const [students, setStudents] = useState<Student[]>([])

  useEffect(() => {
    apiGetStudents().then(setStudents)
  }, [])

  const total = students.length
  const avgScore = students.length
    ? students.reduce((s, st) => s + st.average, 0) / students.length
    : 0
  const passing = students.filter(s => s.average >= 70).length
  const failing = students.filter(s => s.average < 70).length

  const stats = [
    {
      label: "Всего студентов",
      value: total || "—",
      change: `${passing} успевают, ${failing} отстают`,
      icon: "Users",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Средний балл (год)",
      value: total ? `${avgScore.toFixed(1)}%` : "—",
      change: avgScore >= 70 ? "Выше порога 70%" : "Ниже порога 70%",
      icon: "TrendingUp",
      color: avgScore >= 70 ? "text-green-400" : "text-red-400",
      bg: avgScore >= 70 ? "bg-green-400/10" : "bg-red-400/10",
    },
    {
      label: "Успевают (≥70%)",
      value: passing || "—",
      change: total ? `${Math.round((passing / total) * 100)}% от всех` : "",
      icon: "CheckCircle",
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Отстают (<70%)",
      value: failing || "—",
      change: total ? `${Math.round((failing / total) * 100)}% от всех` : "",
      icon: "AlertCircle",
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <Icon name={stat.icon} size={20} className={stat.color} />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-foreground mb-1">{stat.label}</div>
            <div className="text-xs text-muted-foreground">{stat.change}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
