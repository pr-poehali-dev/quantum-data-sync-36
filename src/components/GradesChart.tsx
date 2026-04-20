import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"
import { apiGetStudents, apiGetGroups, Student, GroupStat } from "@/lib/api"

const MONTHS = ["Сен", "Окт", "Ноя", "Дек", "Янв", "Фев", "Мар", "Апр", "Май", "Июн"]
const MONTH_YEARS: Record<string, number> = {
  Сен: 2025, Окт: 2025, Ноя: 2025, Дек: 2025,
  Янв: 2026, Фев: 2026, Мар: 2026, Апр: 2026, Май: 2026, Июн: 2026,
}

function normalize(value: number) {
  return (value / 100) * 100
}

interface Props {
  showDetailed?: boolean
}

export function GradesChart({ showDetailed }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<GroupStat[]>([])

  useEffect(() => {
    Promise.all([apiGetStudents(), apiGetGroups()]).then(([s, g]) => {
      setStudents(s)
      setGroups(g)
    })
  }, [])

  const avgByMonth = MONTHS.map(month => {
    const scores = students.flatMap(s =>
      s.grades.filter(g => g.month === month && g.year === MONTH_YEARS[month] && g.score > 0).map(g => g.score)
    )
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  })

  const groupKeys = [...new Set(students.map(s => s.group))].sort()
  const groupStats = groupKeys.map(group => {
    const gs = students.filter(s => s.group === group)
    const avg = gs.length ? gs.reduce((a, s) => a + s.average, 0) / gs.length : 0
    const top = gs.filter(s => s.average >= 70).length
    const stat = groups.find(g => g.group === group)
    const conv = stat && stat.enrolled > 0 ? Math.round((stat.remaining / stat.enrolled) * 100) : null
    return { group, average: avg, students: gs.length, top, conv, enrolled: stat?.enrolled, remaining: stat?.remaining }
  })

  const yearlyAverage = avgByMonth.filter(v => v > 0).length
    ? avgByMonth.filter(v => v > 0).reduce((a, b) => a + b, 0) / avgByMonth.filter(v => v > 0).length
    : 0

  const totalEnrolled = groups.reduce((a, g) => a + g.enrolled, 0)
  const totalRemaining = groups.reduce((a, g) => a + g.remaining, 0)
  const totalConv = totalEnrolled > 0 ? Math.round((totalRemaining / totalEnrolled) * 100) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Динамика по месяцам */}
      <Card className="border-border bg-card lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Icon name="TrendingUp" size={18} className="text-primary" />
            Динамика среднего балла по месяцам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-48 flex items-end gap-1 pt-6 pl-6">
            {[100, 70, 40, 0].map((grade) => (
              <div
                key={grade}
                className={`absolute left-0 right-0 border-t ${grade === 70 ? "border-yellow-500/50 border-dashed" : "border-border/40"}`}
                style={{ bottom: `${normalize(grade)}%` }}
              >
                <span className="absolute -left-1 -translate-y-1/2 text-xs text-muted-foreground">{grade}</span>
              </div>
            ))}
            {avgByMonth.map((avg, i) => {
              const height = normalize(avg)
              const color = avg >= 70 ? "bg-green-500" : avg > 0 ? "bg-red-500" : "bg-muted"
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded px-2 py-1 text-xs text-foreground whitespace-nowrap z-10 pointer-events-none">
                    {MONTHS[i]}: {avg > 0 ? avg.toFixed(1) + "%" : "нет данных"}
                  </div>
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${color}/70 group-hover:${color}`}
                    style={{ height: height > 0 ? `${height}%` : "2px" }}
                  />
                  <span className="text-[10px] text-muted-foreground">{MONTHS[i]}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Среднегодовой результат</p>
              <p className={`text-2xl font-bold ${yearlyAverage >= 70 ? "text-green-400" : "text-red-400"}`}>
                {yearlyAverage.toFixed(1)}%
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-500" /><span className="text-muted-foreground">≥70%</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-muted-foreground">&lt;70%</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* По группам + конверсия */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Icon name="BarChart2" size={18} className="text-primary" />
            По группам
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupStats.map((g) => (
            <div key={g.group} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{g.group}</span>
                <span className={`font-bold ${g.average >= 70 ? "text-green-400" : "text-red-400"}`}>
                  {g.average.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-700 ${g.average >= 70 ? "bg-green-500" : "bg-red-500"}`}
                  style={{ width: `${normalize(g.average)}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{g.students} студентов</span>
                {g.conv !== null
                  ? <span>конверсия <span className={g.conv >= 80 ? "text-green-400" : g.conv >= 60 ? "text-yellow-400" : "text-red-400"}>{g.conv}%</span></span>
                  : <span>{g.top} успевают</span>
                }
              </div>
            </div>
          ))}

          {showDetailed && (
            <div className="pt-4 border-t border-border space-y-3">
              {yearlyAverage > 0 && (
                <>
                  <p className="text-sm font-medium text-foreground">Среднегодовой расчёт</p>
                  <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Месяцев с оценками:</span>
                      <span className="text-foreground font-medium">{avgByMonth.filter(v => v > 0).length}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1 mt-1">
                      <span className="font-semibold text-foreground">Итог:</span>
                      <Badge className={`text-xs ${yearlyAverage >= 70 ? "bg-green-400/20 text-green-400 border-green-400/30" : "bg-red-400/20 text-red-400 border-red-400/30"}`}>
                        {yearlyAverage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </>
              )}
              {totalConv !== null && (
                <>
                  <p className="text-sm font-medium text-foreground">Конверсия (всего)</p>
                  <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Поступило:</span><span className="text-foreground font-medium">{totalEnrolled}</span></div>
                    <div className="flex justify-between"><span>Осталось:</span><span className="text-foreground font-medium">{totalRemaining}</span></div>
                    <div className="flex justify-between"><span>Отсев:</span><span className="text-red-400 font-medium">{totalEnrolled - totalRemaining}</span></div>
                    <div className="flex justify-between border-t border-border pt-1 mt-1">
                      <span className="font-semibold text-foreground">Конверсия:</span>
                      <Badge className={`text-xs ${totalConv >= 80 ? "bg-green-400/20 text-green-400 border-green-400/30" : totalConv >= 60 ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30" : "bg-red-400/20 text-red-400 border-red-400/30"}`}>
                        {totalConv}%
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
