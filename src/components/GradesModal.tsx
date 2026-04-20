import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import { Student, apiUpdateGrade } from "@/lib/api"

const MONTHS = [
  { label: "Сен", year: 2025 }, { label: "Окт", year: 2025 }, { label: "Ноя", year: 2025 },
  { label: "Дек", year: 2025 }, { label: "Янв", year: 2026 }, { label: "Фев", year: 2026 },
  { label: "Мар", year: 2026 }, { label: "Апр", year: 2026 }, { label: "Май", year: 2026 },
  { label: "Июн", year: 2026 },
]

function getScoreColor(score: number | null) {
  if (score === null) return "text-muted-foreground"
  return score >= 70 ? "text-green-400" : "text-red-400"
}

function getScoreBg(score: number | null) {
  if (score === null) return ""
  return score >= 70 ? "bg-green-400/10 border-green-400/30" : "bg-red-400/10 border-red-400/30"
}

interface Props {
  open: boolean
  onClose: () => void
  student: Student | null
  onSaved: () => void
}

export function GradesModal({ open, onClose, student, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  if (!student) return null

  function getScore(month: string, year: number): number | null {
    const g = student!.grades.find(g => g.month === month && g.year === year)
    return g ? g.score : null
  }

  function getInput(month: string, year: number): string {
    const key = `${month}_${year}`
    if (values[key] !== undefined) return values[key]
    const score = getScore(month, year)
    return score !== null ? String(score) : ""
  }

  async function handleSave(month: string, year: number) {
    const key = `${month}_${year}`
    const val = parseInt(values[key] ?? "")
    if (isNaN(val) || val < 0 || val > 100) return
    setSaving(key)
    await apiUpdateGrade(student!.id, month, year, val)
    setSaving(null)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Icon name="ClipboardEdit" size={18} className="text-primary" />
            Оценки — {student.name}
            <span className="text-muted-foreground text-sm font-normal ml-1">({student.group})</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <p className="text-xs text-muted-foreground mb-3">Введите результат от 0 до 100. Зелёный — 70+, красный — ниже 70.</p>
          <div className="grid grid-cols-2 gap-2">
            {MONTHS.map(({ label, year }) => {
              const key = `${label}_${year}`
              const currentScore = getScore(label, year)
              const inputVal = getInput(label, year)
              const parsed = parseInt(inputVal)
              const displayScore = !isNaN(parsed) ? parsed : currentScore

              return (
                <div key={key} className={`flex items-center gap-2 p-2 rounded-lg border ${getScoreBg(displayScore)}`}>
                  <div className="w-10 text-xs font-medium text-muted-foreground">{label} {year === 2025 ? "'25" : "'26"}</div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={inputVal}
                    onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                    className={`h-7 w-16 text-center text-sm font-bold bg-background border-0 p-1 ${getScoreColor(displayScore)}`}
                    placeholder="—"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    disabled={saving === key || isNaN(parsed) || parsed < 0 || parsed > 100}
                    onClick={() => handleSave(label, year)}
                  >
                    {saving === key
                      ? <Icon name="Loader2" size={13} className="animate-spin" />
                      : <Icon name="Check" size={13} className="text-green-400" />
                    }
                  </Button>
                </div>
              )
            })}
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Среднегодовой результат:</span>
            <span className={`font-bold text-base ${getScoreColor(student.average)}`}>
              {student.average.toFixed(1)}%
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={onClose} className="w-full border-border mt-1">Закрыть</Button>
      </DialogContent>
    </Dialog>
  )
}