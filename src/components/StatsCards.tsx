import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { apiGetStudents, apiGetGroups, apiUpdateGroup, Student, GroupStat } from "@/lib/api"

export function StatsCards() {
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<GroupStat[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [editGroup, setEditGroup] = useState<GroupStat | null>(null)
  const [enrolled, setEnrolled] = useState("")
  const [remaining, setRemaining] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const [s, g] = await Promise.all([apiGetStudents(), apiGetGroups()])
    setStudents(s)
    setGroups(g)
  }, [])

  useEffect(() => { load() }, [load])

  const total = students.length
  const avgScore = total ? students.reduce((s, st) => s + st.average, 0) / total : 0
  const passing = students.filter(s => s.average >= 70).length
  const failing = students.filter(s => s.average < 70).length

  const totalEnrolled = groups.reduce((a, g) => a + g.enrolled, 0)
  const totalRemaining = groups.reduce((a, g) => a + g.remaining, 0)
  const conversionRate = totalEnrolled > 0 ? Math.round((totalRemaining / totalEnrolled) * 100) : 100

  const stats = [
    {
      label: "Всего студентов",
      value: total || "—",
      change: `${passing} успевают · ${failing} отстают`,
      icon: "Users",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      action: (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 absolute top-3 right-3 opacity-60 hover:opacity-100"
          title="Редактировать набор"
          onClick={() => setEditOpen(true)}
        >
          <Icon name="Settings2" size={13} className="text-muted-foreground" />
        </Button>
      ),
    },
    {
      label: "Средний балл (год)",
      value: total ? `${avgScore.toFixed(1)}%` : "—",
      change: avgScore >= 70 ? "Выше порога 70%" : "Ниже порога 70%",
      icon: "TrendingUp",
      color: avgScore >= 70 ? "text-green-400" : "text-red-400",
      bg: avgScore >= 70 ? "bg-green-400/10" : "bg-red-400/10",
      action: null,
    },
    {
      label: "Успевают (≥70%)",
      value: passing || "—",
      change: total ? `${Math.round((passing / total) * 100)}% от всех` : "",
      icon: "CheckCircle",
      color: "text-green-400",
      bg: "bg-green-400/10",
      action: null,
    },
    {
      label: "Конверсия",
      value: totalEnrolled > 0 ? `${conversionRate}%` : "—",
      change: totalEnrolled > 0
        ? `Набрали ${totalEnrolled} · осталось ${totalRemaining}`
        : "Укажите данные набора",
      icon: "BarChart3",
      color: conversionRate >= 80 ? "text-green-400" : conversionRate >= 60 ? "text-yellow-400" : "text-red-400",
      bg: conversionRate >= 80 ? "bg-green-400/10" : conversionRate >= 60 ? "bg-yellow-400/10" : "bg-red-400/10",
      action: null,
    },
  ]

  function openEditGroup(g: GroupStat) {
    setEditGroup(g)
    setEnrolled(String(g.enrolled))
    setRemaining(String(g.remaining))
  }

  async function handleSave() {
    if (!editGroup) return
    setSaving(true)
    await apiUpdateGroup(editGroup.group, Number(enrolled), Number(remaining))
    setSaving(false)
    setEditGroup(null)
    await load()
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border bg-card relative">
            {stat.action}
            <CardContent className="p-5">
              <div className="mb-4">
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

      {/* Диалог редактирования групп */}
      <Dialog open={editOpen} onOpenChange={v => { setEditOpen(v); setEditGroup(null) }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Icon name="Users" size={18} className="text-primary" />
              Данные набора студентов
            </DialogTitle>
          </DialogHeader>

          {!editGroup ? (
            <div className="space-y-2 py-2">
              <p className="text-xs text-muted-foreground mb-3">Выберите группу для редактирования:</p>
              {groups.map(g => (
                <button
                  key={g.group}
                  onClick={() => openEditGroup(g)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors text-left"
                >
                  <span className="font-semibold text-foreground">{g.group}</span>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>Набрали: <span className="text-foreground font-medium">{g.enrolled}</span></div>
                    <div>Осталось: <span className="text-foreground font-medium">{g.remaining}</span></div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <p className="text-sm font-medium text-foreground">Группа {editGroup.group}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-foreground">При поступлении</Label>
                  <Input type="number" min={0} value={enrolled} onChange={e => setEnrolled(e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground">Сейчас осталось</Label>
                  <Input type="number" min={0} value={remaining} onChange={e => setRemaining(e.target.value)} className="bg-background" />
                </div>
              </div>
              {enrolled && remaining && (
                <div className="p-2 rounded bg-muted/30 text-xs text-muted-foreground">
                  Конверсия группы:{" "}
                  <span className="font-semibold text-foreground">
                    {Math.round((Number(remaining) / Number(enrolled)) * 100)}%
                  </span>
                  {" "}({Number(enrolled) - Number(remaining)} отсева)
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {editGroup ? (
              <>
                <Button variant="outline" onClick={() => setEditGroup(null)} className="border-border">Назад</Button>
                <Button onClick={handleSave} disabled={saving || !enrolled || !remaining}>
                  {saving && <Icon name="Loader2" size={14} className="animate-spin mr-2" />}Сохранить
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditOpen(false)} className="border-border">Закрыть</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
