import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Icon from "@/components/ui/icon"
import { apiGetExpelled, apiRestoreStudent, apiDeleteStudent, ExpelledStudent } from "@/lib/api"

export function ExpelledTable() {
  const [expelled, setExpelled] = useState<ExpelledStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [restoreId, setRestoreId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ExpelledStudent | null>(null)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await apiGetExpelled()
    setExpelled(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleRestore() {
    if (!restoreId) return
    setActing(true)
    await apiRestoreStudent(restoreId)
    setActing(false)
    setRestoreId(null)
    await load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setActing(true)
    await apiDeleteStudent(deleteTarget.id)
    setActing(false)
    setDeleteTarget(null)
    await load()
  }

  if (!loading && expelled.length === 0) return null

  return (
    <>
      <Card className="border-border bg-card border-red-500/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Icon name="UserX" size={18} className="text-red-400" />
            Отчисленные студенты
            <span className="ml-auto text-xs font-normal bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
              {expelled.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Icon name="Loader2" size={18} className="animate-spin" />Загрузка...
            </div>
          ) : (
            <div className="space-y-2">
              {expelled.map(s => (
                <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-bold text-red-400 shrink-0 mt-0.5">
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{s.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{s.group}</span>
                      {s.expel_date && <span className="text-xs text-muted-foreground">{s.expel_date}</span>}
                    </div>
                    {s.expel_comment && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.expel_comment}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost"
                      className="h-7 gap-1 text-xs text-green-400 hover:text-green-400 hover:bg-green-400/10"
                      onClick={() => setRestoreId(s.id)}>
                      <Icon name="RotateCcw" size={13} />
                      <span className="hidden sm:inline">Вернуть</span>
                    </Button>
                    <Button size="sm" variant="ghost"
                      className="h-7 w-7 p-0 hover:bg-red-500/15"
                      title="Удалить из базы навсегда"
                      onClick={() => setDeleteTarget(s)}>
                      <Icon name="Trash2" size={13} className="text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Восстановить */}
      <Dialog open={restoreId !== null} onOpenChange={() => setRestoreId(null)}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Icon name="RotateCcw" size={18} className="text-green-400" />Вернуть студента?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Студент будет восстановлен в общий список.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRestoreId(null)} className="border-border">Отмена</Button>
            <Button onClick={handleRestore} disabled={acting} className="bg-green-600 hover:bg-green-700 text-white border-0">
              {acting && <Icon name="Loader2" size={14} className="animate-spin mr-2" />}Восстановить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Полное удаление */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Icon name="Trash2" size={18} className="text-red-400" />Удалить из базы навсегда?
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm text-foreground font-medium">{deleteTarget?.name}</p>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              Будут удалены все данные студента: оценки, замечания и история. Это действие необратимо.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-border">Отмена</Button>
            <Button onClick={handleDelete} disabled={acting} className="bg-red-500 hover:bg-red-600 text-white border-0">
              {acting && <Icon name="Loader2" size={14} className="animate-spin mr-2" />}Удалить навсегда
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
