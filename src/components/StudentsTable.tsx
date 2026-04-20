import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

interface Student {
  id: number
  name: string
  group: string
  grades: number[]
  average: number
}

const MONTHS = ["Сен", "Окт", "Ноя", "Дек", "Янв", "Фев", "Мар", "Апр"]

const students: Student[] = [
  { id: 1, name: "Алина Смирнова", group: "11А", grades: [5, 5, 4, 5, 5, 5, 4, 5], average: 4.75 },
  { id: 2, name: "Дмитрий Козлов", group: "11А", grades: [4, 3, 4, 4, 5, 4, 3, 4], average: 3.88 },
  { id: 3, name: "Мария Петрова", group: "11Б", grades: [5, 5, 5, 5, 5, 5, 5, 5], average: 5.0 },
  { id: 4, name: "Артём Новиков", group: "11Б", grades: [3, 4, 3, 3, 4, 3, 4, 3], average: 3.38 },
  { id: 5, name: "Екатерина Фёдорова", group: "10А", grades: [4, 4, 5, 4, 4, 5, 4, 4], average: 4.25 },
  { id: 6, name: "Иван Морозов", group: "10А", grades: [3, 3, 4, 3, 3, 4, 3, 3], average: 3.25 },
  { id: 7, name: "Ольга Волкова", group: "10Б", grades: [5, 4, 5, 5, 4, 5, 5, 4], average: 4.63 },
  { id: 8, name: "Сергей Лебедев", group: "10Б", grades: [4, 5, 4, 4, 5, 4, 5, 4], average: 4.38 },
]

function getGradeColor(grade: number) {
  if (grade === 5) return "text-green-400"
  if (grade === 4) return "text-blue-400"
  if (grade === 3) return "text-yellow-400"
  return "text-red-400"
}

function getAverageBadge(avg: number) {
  if (avg >= 4.5) return <Badge className="bg-green-400/15 text-green-400 border-green-400/30">Отлично</Badge>
  if (avg >= 3.5) return <Badge className="bg-blue-400/15 text-blue-400 border-blue-400/30">Хорошо</Badge>
  if (avg >= 2.5) return <Badge className="bg-yellow-400/15 text-yellow-400 border-yellow-400/30">Удовл.</Badge>
  return <Badge className="bg-red-400/15 text-red-400 border-red-400/30">Неуд.</Badge>
}

interface Props {
  showAll?: boolean
}

export function StudentsTable({ showAll }: Props) {
  const [search, setSearch] = useState("")

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.group.toLowerCase().includes(search.toLowerCase())
  )

  const displayed = showAll ? filtered : filtered.slice(0, 5)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Icon name="Users" size={18} className="text-primary" />
            {showAll ? "Все студенты" : "Последние студенты"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени или группе..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 w-56 text-sm bg-background"
              />
            </div>
            <Button size="sm" className="h-8 gap-1">
              <Icon name="UserPlus" size={14} />
              <span className="hidden sm:inline">Добавить</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Студент</th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Группа</th>
                {MONTHS.map((m) => (
                  <th key={m} className="text-center py-3 px-2 text-muted-foreground font-medium min-w-[40px]">
                    {m}
                  </th>
                ))}
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">Ср. год</th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((student, idx) => (
                <tr
                  key={student.id}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                    idx % 2 === 0 ? "" : "bg-muted/10"
                  }`}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {student.name[0]}
                      </div>
                      <span className="font-medium text-foreground whitespace-nowrap">{student.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">{student.group}</td>
                  {student.grades.map((g, i) => (
                    <td key={i} className={`py-3 px-2 text-center font-semibold ${getGradeColor(g)}`}>
                      {g}
                    </td>
                  ))}
                  <td className="py-3 px-2 text-center font-bold text-foreground">
                    {student.average.toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-center">{getAverageBadge(student.average)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!showAll && filtered.length > 5 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Показано 5 из {filtered.length} студентов
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
