import { Card, CardContent } from "@/components/ui/card"
import Icon from "@/components/ui/icon"

const stats = [
  {
    label: "Всего студентов",
    value: "124",
    change: "+6 за месяц",
    icon: "Users",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    label: "Средний балл (год)",
    value: "4.2",
    change: "+0.3 к прошлому году",
    icon: "TrendingUp",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    label: "Контрольных в апреле",
    value: "8",
    change: "Следующая: 28 апр",
    icon: "ClipboardList",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    label: "Отличников",
    value: "31",
    change: "25% от всех студентов",
    icon: "Star",
    color: "text-primary",
    bg: "bg-primary/10",
  },
]

export function StatsCards() {
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
