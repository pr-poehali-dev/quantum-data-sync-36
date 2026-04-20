import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { Student } from "@/lib/api"

const GROUPS = ["10А", "10Б", "11А", "11Б"]

interface Props {
  open: boolean
  onClose: () => void
  onSave: (name: string, group: string) => Promise<void>
  onExpel?: (id: number, comment: string) => Promise<void>
  student?: Student | null
}

export function StudentModal({ open, onClose, onSave, onExpel, student }: Props) {
  const [name, setName] = useState("")
  const [group, setGroup] = useState("")
  const [loading, setLoading] = useState(false)
  const [showExpel, setShowExpel] = useState(false)
  const [expelComment, setExpelComment] = useState("")

  useEffect(() => {
    if (open) {
      setName(student?.name || "")
      setGroup(student?.group || "")
      setShowExpel(false)
      setExpelComment("")
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Icon name={student ? "UserCog" : "UserPlus"} size={18} className="text-primary" />
            {student ? "Редактировать студента" : "Добавить студента"}
          </DialogTitle>
        </DialogHeader>

        {!showExpel ? (
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
                    {GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {student && onExpel && (
                <Button
                  variant="outline"
                  className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-400 sm:mr-auto"
                  onClick={() => setShowExpel(true)}
                >
                  <Icon name="UserX" size={15} className="mr-2" />
                  Отчислить
                </Button>
              )}
              <Button variant="outline" onClick={onClose} className="border-border">Отмена</Button>
              <Button onClick={handleSave} disabled={loading || !name.trim() || !group}>
                {loading && <Icon name="Loader2" size={16} className="animate-spin mr-2" />}
                {student ? "Сохранить" : "Добавить"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-start gap-2">
                <Icon name="AlertTriangle" size={16} className="shrink-0 mt-0.5" />
                Студент <strong>{student?.name}</strong> будет отчислен и перемещён в архив.
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">Комментарий (причина)</Label>
                <Textarea
                  value={expelComment}
                  onChange={e => setExpelComment(e.target.value)}
                  placeholder="Укажите причину отчисления..."
                  className="bg-background resize-none min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowExpel(false)} className="border-border">Назад</Button>
              <Button
                onClick={handleExpel}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 text-white border-0"
              >
                {loading && <Icon name="Loader2" size={16} className="animate-spin mr-2" />}
                Подтвердить отчисление
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
