import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { apiGetGroups, apiGetHours, apiUpdateHours, GroupStat, HoursPlan } from "@/lib/api"

export function HoursTable() {
  const [groups, setGroups] = useState<GroupStat[]>([])
  const [hours, setHours] = useState<HoursPlan[]>([])
  const [editHours, setEditHours] = useState<{ group: string; plan: string; fact: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const [g, h] = await Promise.all([apiGetGroups(), apiGetHours(2025)])
    setGroups(g)
    setHours(h)
  }, [])

  useEffect(() => { load() }, [load])

  function openEdit(group: string) {
    const h = hours.find(h => h.group === group)
    setEditHours({ group, plan: String(h?.plan_hours ?? 0), fact: String(h?.fact_hours ?? 0) })
  }

  async function handleSave() {
    if (!editHours) return
    setSaving(true)
    await apiUpdateHours(editHours.group, 2025, Number(editHours.plan) || 0, Number(editHours.fact) || 0)
    setSaving(false)
    setEditHours(null)
    await load()
  }

  const rows = groups.map(g => {
    const h = hours.find(h => h.group === g.group)
    const plan = h?.plan_hours ?? 0
    const fact = h?.fact_hours ?? 0
    const pct = plan > 0 ? Math.round((fact / plan) * 100) : 0
    return { group: g.group, plan, fact, pct }
  })

  const totPlan = rows.reduce((a, r) => a + r.plan, 0)
  const totFact = rows.reduce((a, r) => a + r.fact, 0)
  const totPct = totPlan > 0 ? Math.round((totFact / totPlan) * 100) : 0

  function pctColor(p: number) {
    return p >= 100 ? "text-green-400" : p >= 70 ? "text-yellow-400" : "text-red-400"
  }
  function barColor(p: number) {
    return p >= 100 ? "bg-green-500" : p >= 70 ? "bg-yellow-500" : "bg-red-500"
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2 text-base">
              <Icon name="Clock" size={18} className="text-primary" />
              План и факт вычитки часов
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
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium min-w-[120px]">Выполнение</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Ред.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.group} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-foreground">{r.group}</td>
                    <td className="py-2.5 px-3 text-center text-foreground">{r.plan || "—"}</td>
                    <td className="py-2.5 px-3 text-center text-foreground">{r.fact || "—"}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all duration-700 ${barColor(r.pct)}`}
                            style={{ width: `${Math.min(r.pct, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-semibold w-9 text-right ${pctColor(r.pct)}`}>
                          {r.plan > 0 ? `${r.pct}%` : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEdit(r.group)}>
                        <Icon name="Pencil" size={12} className="text-primary" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length > 0 && (
                  <tr className="bg-muted/20 font-semibold text-xs">
                    <td className="py-2 px-3 text-foreground">Итого</td>
                    <td className="py-2 px-3 text-center text-foreground">{totPlan || "—"}</td>
                    <td className="py-2 px-3 text-center text-foreground">{totFact || "—"}</td>
                    <td className="py-2 px-3">
                      {totPlan > 0 && (
                        <span className={`${pctColor(totPct)}`}>{totPct}%</span>
                      )}
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editHours} onOpenChange={() => setEditHours(null)}>
        <DialogContent className="bg-card border-border sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Icon name="Clock" size={16} className="text-primary" />
              Часы — {editHours?.group}
            </DialogTitle>
          </DialogHeader>
          {editHours && (
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs">План (ч)</Label>
                <Input type="number" min={0} value={editHours.plan}
                  onChange={e => setEditHours(v => v ? { ...v, plan: e.target.value } : v)}
                  className="bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs">Факт (ч)</Label>
                <Input type="number" min={0} value={editHours.fact}
                  onChange={e => setEditHours(v => v ? { ...v, fact: e.target.value } : v)}
                  className="bg-background" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditHours(null)} className="border-border">Отмена</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Icon name="Loader2" size={14} className="animate-spin mr-2" />}Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
