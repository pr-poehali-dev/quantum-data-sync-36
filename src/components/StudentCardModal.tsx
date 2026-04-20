import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"
import { Student, Retake, apiGetRetakes, apiUpdateRetake } from "@/lib/api"

const MONTHS = ["Сен", "Окт", "Ноя", "Дек", "Янв", "Фев", "Мар", "Апр", "Май", "Июн"]
const MONTH_YEARS: Record<string, number> = {
  Сен: 2025, Окт: 2025, Ноя: 2025, Дек: 2025,
  Янв: 2026, Фев: 2026, Мар: 2026, Апр: 2026, Май: 2026, Июн: 2026,
}

function scoreColor(s: number | null) {
  if (s === null || s === 0) return "text-muted-foreground"
  return s >= 70 ? "text-green-400" : "text-red-400"
}

interface Props {
  open: boolean
  onClose: () => void
  student: Student | null
  onSaved: () => void
}

export function StudentCardModal({ open, onClose, student, onSaved }: Props) {
  const [retakes, setRetakes] = useState<Retake[]>([])
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (open && student) {
      apiGetRetakes(student.id).then(setRetakes)
      setEditing({})
    }
  }, [open, student])

  if (!student) return null

  function getRetake(month: string, year: number, attempt: number): number | null {
    const r = retakes.find(r => r.month === month && r.year === year && r.attempt === attempt)
    return r ? r.score : null
  }

  function getEditKey(month: string, year: number, attempt: number) {
    return `${month}_${year}_${attempt}`
  }

  function getInputVal(month: string, year: number, attempt: number): string {
    const key = getEditKey(month, year, attempt)
    if (editing[key] !== undefined) return editing[key]
    const v = getRetake(month, year, attempt)
    return v !== null ? String(v) : ""
  }

  function getBestScore(month: string, year: number): number | null {
    const g = student.grades.find(g => g.month === month && g.year === year)
    const base = g ? (g.best_score ?? g.score) : null
    const attempts = [1, 2, 3].map(a => getRetake(month, year, a)).filter(v => v !== null) as number[]
    const all = [...(base ? [base] : []), ...attempts].filter(v => v > 0)
    return all.length ? Math.max(...all) : base
  }

  async function handleSaveRetake(month: string, year: number, attempt: number) {
    const key = getEditKey(month, year, attempt)
    const val = parseInt(editing[key] ?? "")
    if (isNaN(val) || val < 0 || val > 100) return
    setSaving(key)
    await apiUpdateRetake(student.id, month, year, attempt, val)
    const updated = await apiGetRetakes(student.id)
    setRetakes(updated)
    setSaving(null)
    onSaved()
  }

  const monthsWithGrades = MONTHS.filter(m => student.grades.some(g => g.month === m))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {student.name[0]}
            </div>
            <div>
              <div>{student.name}</div>
              <div className="text-sm font-normal text-muted-foreground">{student.group}</div>
            </div>
            <div className="ml-auto">
              {student.average >= 70
                ? <Badge className="bg-green-400/15 text-green-400 border-green-400/30">{student.average.toFixed(1)}%</Badge>
                : <Badge className="bg-red-400/15 text-red-400 border-red-400/30">{student.average.toFixed(1)}%</Badge>
              }
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground">
            Результаты контрольных работ. В основной таблице отображается лучший результат из основного и пересдач.
          </p>

          {monthsWithGrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Оценок пока нет</div>
          ) : (
            <div className="space-y-3">
              {monthsWithGrades.map(month => {
                const year = MONTH_YEARS[month]
                const grade = student.grades.find(g => g.month === month && g.year === year)
                const base = grade?.score ?? null
                const best = getBestScore(month, year)

                return (
                  <div key={month} className="rounded-lg border border-border bg-muted/10 overflow-hidden">
                    {/* Заголовок месяца */}
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border">
                      <span className="font-semibold text-foreground text-sm">{month} {year === 2025 ? "2025" : "2026"}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">
                          Основной: <span className={`font-semibold ${scoreColor(base)}`}>{base && base > 0 ? base : "—"}</span>
                        </span>
                        {best && best > (base ?? 0) && (
                          <span className="text-muted-foreground">
                            Лучший: <span className="font-semibold text-green-400">{best}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Пересдачи */}
                    <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                      <span className="text-xs text-muted-foreground shrink-0">Пересдачи:</span>
                      {[1, 2, 3].map(attempt => {
                        const key = getEditKey(month, year, attempt)
                        const inputVal = getInputVal(month, year, attempt)
                        const parsed = parseInt(inputVal)
                        const displayScore = !isNaN(parsed) ? parsed : getRetake(month, year, attempt)
                        return (
                          <div key={attempt} className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground w-4">{attempt}.</span>
                            <Input
                              type="number" min={0} max={100}
                              value={inputVal}
                              onChange={e => setEditing(v => ({ ...v, [key]: e.target.value }))}
                              className={`h-7 w-14 text-center text-xs font-semibold bg-background ${scoreColor(displayScore)}`}
                              placeholder="—"
                            />
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                              disabled={saving === key || isNaN(parsed) || parsed < 0 || parsed > 100}
                              onClick={() => handleSaveRetake(month, year, attempt)}>
                              {saving === key
                                ? <Icon name="Loader2" size={12} className="animate-spin" />
                                : <Icon name="Check" size={12} className="text-green-400" />}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Button variant="outline" onClick={onClose} className="w-full border-border mt-2">Закрыть</Button>
      </DialogContent>
    </Dialog>
  )
}
