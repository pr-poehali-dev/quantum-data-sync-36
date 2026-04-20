import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { Student, apiGetGroups, apiDeleteStudent } from "@/lib/api"

interface Props {
  open: boolean
  onClose: () => void
  onSave: (name: string, group: string) => Promise<void>
  onExpel?: (id: number, comment: string) => Promise<void>
  onDeleted?: () => void
  student?: Student | null
}

export function StudentModal({ open, onClose, onSave, onExpel, onDeleted, student }: Props) {
  const [name, setName] = useState("")
  const [group, setGroup] = useState("")
  const [groups, setGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<"edit" | "expel" | "delete">("edit")
  const [expelComment, setExpelComment] = useState("")

  useEffect(() => {
    if (open) {
      setName(student?.name || "")
      setGroup(student?.group || "")
      setView("edit")
      setExpelComment("")
      apiGetGroups().then(gs => setGroups(gs.map(g => g.group)))
    }
  }, [open, student])

  async function handleSave() {
    if (!name.trim() || !group) return
    setLoading(true)
    await onSave(name.trim(), group)
    setLoading(false)
    onClose()
  }

  async function handleExpel() {
    if (!student || !onExpel) return
    setLoading(true)
    await onExpel(student.id, expelComment)
    setLoading(false)
    onClose()
  }

  async function handleDelete() {
    if (!student) return
    setLoading(true)
    await apiDeleteStudent(student.id)
    setLoading(false)
    onClose()
    onDeleted?.()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Icon name={student ? "UserCog" : "UserPlus"} size={18} className="text-primary" />
            {!student ? "Добавить студента" : view === "expel" ? "Отчислить студента" : view === "delete" ? "Удалить студента" : "Редактировать студента"}
          </DialogTitle>
        </DialogHeader>

        {view === "edit" && (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-foreground">ФИО студента</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Иванов Иван Иванович" className="bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">Группа</Label>
                <Select value={group} onValueChange={setGroup}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Выберите группу" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {groups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {student && onExpel && (
                <div className="flex gap-2 sm:mr-auto">
                  <Button variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-400 h-9 gap-1.5"
                    onClick={() => setView("expel")}>
                    <Icon name="UserX" size={14} />Отчислить
                  </Button>
                  <Button variant="outline" className="border-red-700/50 text-red-500 hover:bg-red-700/10 hover:text-red-500 h-9 gap-1.5"
                    onClick={() => setView("delete")}>
                    <Icon name="Trash2" size={14} />Удалить
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={onClose} className="border-border">Отмена</Button>
              <Button onClick={handleSave} disabled={loading || !name.trim() || !group}>
                {loading && <Icon name="Loader2" size={16} className="animate-spin mr-2" />}
                {student ? "Сохранить" : "Добавить"}
              </Button>
            </DialogFooter>
          </>
        )}

        {view === "expel" && (
          <>
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-start gap-2">
                <Icon name="AlertTriangle" size={16} className="shrink-0 mt-0.5" />
                Студент <strong>{student?.name}</strong> будет отчислен и перемещён в архив.
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">Комментарий (причина)</Label>
                <Textarea value={expelComment} onChange={e => setExpelComment(e.target.value)}
                  placeholder="Укажите причину отчисления..." className="bg-background resize-none min-h-[80px]" />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setView("edit")} className="border-border">Назад</Button>
              <Button onClick={handleExpel} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white border-0">
                {loading && <Icon name="Loader2" size={16} className="animate-spin mr-2" />}
                Подтвердить отчисление
              </Button>
            </DialogFooter>
          </>
        )}

        {view === "delete" && (
          <>
            <div className="space-y-3 py-2">
              <div className="p-3 rounded-lg bg-red-700/10 border border-red-700/30 text-sm text-red-400 flex items-start gap-2">
                <Icon name="AlertTriangle" size={16} className="shrink-0 mt-0.5" />
                <span>Студент <strong>{student?.name}</strong> будет <strong>удалён навсегда</strong> вместе со всеми оценками, пересдачами и замечаниями. Это действие необратимо.</span>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setView("edit")} className="border-border">Назад</Button>
              <Button onClick={handleDelete} disabled={loading} className="bg-red-700 hover:bg-red-800 text-white border-0">
                {loading && <Icon name="Loader2" size={16} className="animate-spin mr-2" />}
                Удалить навсегда
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
