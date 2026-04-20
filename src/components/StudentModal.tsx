import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { Student } from "@/lib/api"

const GROUPS = ["10А", "10Б", "11А", "11Б"]

interface Props {
  open: boolean
  onClose: () => void
  onSave: (name: string, group: string) => Promise<void>
  student?: Student | null
}

export function StudentModal({ open, onClose, onSave, student }: Props) {
  const [name, setName] = useState("")
  const [group, setGroup] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(student?.name || "")
      setGroup(student?.group || "")
    }
  }, [open, student])

  async function handleSave() {
    if (!name.trim() || !group) return
    setLoading(true)
    await onSave(name.trim(), group)
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
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-foreground">ФИО студента</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Иванов Иван Иванович"
              className="bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground">Группа</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Выберите группу" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {GROUPS.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-border">Отмена</Button>
          <Button onClick={handleSave} disabled={loading || !name.trim() || !group}>
            {loading ? <Icon name="Loader2" size={16} className="animate-spin mr-2" /> : null}
            {student ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
