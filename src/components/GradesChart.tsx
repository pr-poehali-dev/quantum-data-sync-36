import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { apiGetStudents, apiGetGroups, apiGetHours, apiUpdateHours, Student, GroupStat, HoursPlan } from "@/lib/api"

const MONTHS = ["Сен", "Окт", "Ноя", "Дек", "Янв", "Фев", "Мар", "Апр", "Май", "Июн"]
const MONTH_YEARS: Record<string, number> = {
  Сен: 2025, Окт: 2025, Ноя: 2025, Дек: 2025,
  Янв: 2026, Фев: 2026, Мар: 2026, Апр: 2026, Май: 2026, Июн: 2026,
}

function normalize(value: number) { return (value / 100) * 100 }

interface Props { showDetailed?: boolean }

export function GradesChart({ showDetailed }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<GroupStat[]>([])
  const [hours, setHours] = useState<HoursPlan[]>([])
  const [editHours, setEditHours] = useState<HoursPlan | null>(null)
  const [editPlan, setEditPlan] = useState("")
  const [editFact, setEditFact] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const [s, g, h] = await Promise.all([apiGetStudents(), apiGetGroups(), apiGetHours(2025)])
    setStudents(s)
    setGroups(g)
    setHours(h)
  }, [])

  useEffect(() => { load() }, [load])

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
    const h = hours.find(h => h.group === group)
    return { group, average: avg, students: gs.length, top, conv, h }
  })

  const yearlyAverage = avgByMonth.filter(v => v > 0).length
    ? avgByMonth.filter(v => v > 0).reduce((a, b) => a + b, 0) / avgByMonth.filter(v => v > 0).length
    : 0

  const totalEnrolled = groups.reduce((a, g) => a + g.enrolled, 0)
  const totalRemaining = groups.reduce((a, g) => a + g.remaining, 0)
  const totalConv = totalEnrolled > 0 ? Math.round((totalRemaining / totalEnrolled) * 100) : null

  function openEdit(row: HoursPlan | undefined, group: string) {
    const h = row || { id: 0, group, year: 2025, plan_hours: 0, fact_hours: 0 }
    setEditHours(h)
    setEditPlan(String(h.plan_hours))
    setEditFact(String(h.fact_hours))
  }

  async function handleSaveHours() {
    if (!editHours) return
    setSaving(true)
    await apiUpdateHours(editHours.group, editHours.year, Number(editPlan) || 0, Number(editFact) || 0)
    setSaving(false)
    setEditHours(null)
    await load()
  }

  return (
    <div className="space-y-4">
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
                <div key={grade}
                  className={`absolute left-0 right-0 border-t ${grade === 70 ? "border-yellow-500/50 border-dashed" : "border-border/40"}`}
                  style={{ bottom: `${normalize(grade)}%` }}>
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
                    <div className={`w-full rounded-t-sm transition-all duration-500 ${color}/70 group-hover:${color}`}
                      style={{ height: height > 0 ? `${height}%` : "2px" }} />
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

        {/* По группам */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground flex items-center gap-2 text-base">
              <Icon name="BarChart2" size={18} className="text-primary" />По группам
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupStats.map((g) => (
              <div key={g.group} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">{g.group}</span>
                  <span className={`font-bold ${g.average >= 70 ? "text-green-400" : "text-red-400"}`}>{g.average.toFixed(1)}%</span>
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
                  <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Месяцев с оценками:</span><span className="text-foreground font-medium">{avgByMonth.filter(v => v > 0).length}</span></div>
                    <div className="flex justify-between border-t border-border pt-1 mt-1">
                      <span className="font-semibold text-foreground">Среднегодовой:</span>
                      <Badge className={`text-xs ${yearlyAverage >= 70 ? "bg-green-400/20 text-green-400 border-green-400/30" : "bg-red-400/20 text-red-400 border-red-400/30"}`}>
                        {yearlyAverage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                )}
                {totalConv !== null && (
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
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Таблица часов вычитки */}
      {showDetailed && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2 text-base">
                <Icon name="Clock" size={18} className="text-primary" />
                План и факт вычитки часов по группам
              </CardTitle>
              <span className="text-xs text-muted-foreground">2025–2026 уч. год</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Группа</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">План (ч)</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Факт (ч)</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Выполнение</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {groupStats.map(g => {
                    const h = g.h
                    const plan = h?.plan_hours ?? 0
                    const fact = h?.fact_hours ?? 0
                    const pct = plan > 0 ? Math.round((fact / plan) * 100) : 0
                    const pctColor = pct >= 100 ? "text-green-400" : pct >= 70 ? "text-yellow-400" : "text-red-400"
                    const barColor = pct >= 100 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500"
                    return (
                      <tr key={g.group} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-3 font-semibold text-foreground">{g.group}</td>
                        <td className="py-3 px-3 text-center text-foreground">{plan}</td>
                        <td className="py-3 px-3 text-center text-foreground">{fact}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5 min-w-[60px]">
                              <div className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`}
                                style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className={`text-xs font-semibold w-10 text-right ${pctColor}`}>
                              {plan > 0 ? `${pct}%` : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs"
                            onClick={() => openEdit(g.h, g.group)}>
                            <Icon name="Pencil" size={12} className="text-primary" />
                            Изменить
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {/* Итого */}
                  {groupStats.length > 0 && (
                    <tr className="bg-muted/20">
                      <td className="py-2 px-3 font-semibold text-foreground text-xs">Итого</td>
                      <td className="py-2 px-3 text-center font-semibold text-foreground text-xs">
                        {groupStats.reduce((a, g) => a + (g.h?.plan_hours ?? 0), 0)}
                      </td>
                      <td className="py-2 px-3 text-center font-semibold text-foreground text-xs">
                        {groupStats.reduce((a, g) => a + (g.h?.fact_hours ?? 0), 0)}
                      </td>
                      <td colSpan={2} className="py-2 px-3 text-xs text-muted-foreground">
                        {(() => {
                          const tp = groupStats.reduce((a, g) => a + (g.h?.plan_hours ?? 0), 0)
                          const tf = groupStats.reduce((a, g) => a + (g.h?.fact_hours ?? 0), 0)
                          if (tp === 0) return null
                          const p = Math.round((tf / tp) * 100)
                          return <span className={p >= 100 ? "text-green-400 font-semibold" : p >= 70 ? "text-yellow-400 font-semibold" : "text-red-400 font-semibold"}>{p}%</span>
                        })()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Модалка редактирования часов */}
      <Dialog open={!!editHours} onOpenChange={() => setEditHours(null)}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Icon name="Clock" size={18} className="text-primary" />
              Часы вычитки — {editHours?.group}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-foreground">План (часов)</Label>
              <Input type="number" min={0} value={editPlan} onChange={e => setEditPlan(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Факт (часов)</Label>
              <Input type="number" min={0} value={editFact} onChange={e => setEditFact(e.target.value)} className="bg-background" />
            </div>
          </div>
          {editPlan && editFact && Number(editPlan) > 0 && (
            <div className="px-1 text-xs text-muted-foreground">
              Выполнение:{" "}
              <span className={`font-semibold ${Math.round(Number(editFact) / Number(editPlan) * 100) >= 100 ? "text-green-400" : Math.round(Number(editFact) / Number(editPlan) * 100) >= 70 ? "text-yellow-400" : "text-red-400"}`}>
                {Math.round(Number(editFact) / Number(editPlan) * 100)}%
              </span>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditHours(null)} className="border-border">Отмена</Button>
            <Button onClick={handleSaveHours} disabled={saving}>
              {saving && <Icon name="Loader2" size={14} className="animate-spin mr-2" />}Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
