import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { apiGetGroups, apiAddGroup, apiRenameGroup, apiDeleteGroup, GroupStat } from "@/lib/api"

type View = "list" | "add" | "rename" | "delete"

interface Props {
  open: boolean
  onClose: () => void
  onChanged: () => void
}

export function GroupsModal({ open, onClose, onChanged }: Props) {
  const [groups, setGroups] = useState<GroupStat[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>("list")
  const [selected, setSelected] = useState<GroupStat | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [newName, setNewName] = useState("")
  const [enrolled, setEnrolled] = useState("")
  const [remaining, setRemaining] = useState("")
  const [renameTo, setRenameTo] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const data = await apiGetGroups()
    setGroups(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open) { load(); setView("list"); setError("") }
  }, [open, load])

  function openAdd() { setView("add"); setNewName(""); setEnrolled(""); setRemaining(""); setError("") }
  function openRename(g: GroupStat) { setSelected(g); setRenameTo(g.group); setView("rename"); setError("") }
  function openDelete(g: GroupStat) { setSelected(g); setView("delete"); setError("") }

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true); setError("")
    const res = await apiAddGroup(newName.trim(), Number(enrolled) || 0, Number(remaining) || 0)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    await load(); onChanged(); setView("list")
  }

  async function handleRename() {
    if (!selected || !renameTo.trim() || renameTo === selected.group) return
    setSaving(true); setError("")
    const res = await apiRenameGroup(selected.group, renameTo.trim())
    setSaving(false)
    if (res.error) { setError(res.error); return }
    await load(); onChanged(); setView("list")
  }

  async function handleDelete() {
    if (!selected) return
    setSaving(true); setError("")
    const res = await apiDeleteGroup(selected.group)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    await load(); onChanged(); setView("list")
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Icon name="FolderCog" size={18} className="text-primary" />
            {view === "list" && "Управление группами"}
            {view === "add" && "Добавить группу"}
            {view === "rename" && `Переименовать «${selected?.group}»`}
            {view === "delete" && `Удалить группу «${selected?.group}»?`}
          </DialogTitle>
        </DialogHeader>

        {/* Список групп */}
        {view === "list" && (
          <div className="space-y-3 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Icon name="Loader2" size={18} className="animate-spin" />Загрузка...
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Групп пока нет</p>
            ) : (
              <div className="space-y-2">
                {groups.map(g => (
                  <div key={g.id} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/10">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{g.group}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {g.student_count ?? 0} студ.
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Набор: {g.enrolled} · Осталось: {g.remaining}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Переименовать" onClick={() => openRename(g)}>
                      <Icon name="Pencil" size={13} className="text-muted-foreground" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Удалить" onClick={() => openDelete(g)}>
                      <Icon name="Trash2" size={13} className="text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button className="w-full gap-2 mt-1" onClick={openAdd}>
              <Icon name="Plus" size={15} />
              Добавить группу
            </Button>
          </div>
        )}

        {/* Добавить */}
        {view === "add" && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-foreground">Название группы</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Например: 9А" className="bg-background" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground">При поступлении</Label>
                <Input type="number" min={0} value={enrolled} onChange={e => setEnrolled(e.target.value)} placeholder="0" className="bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">Сейчас осталось</Label>
                <Input type="number" min={0} value={remaining} onChange={e => setRemaining(e.target.value)} placeholder="0" className="bg-background" />
              </div>
            </div>
            {error && <p className="text-xs text-red-400 flex items-center gap-1"><Icon name="AlertCircle" size={13} />{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 border-border" onClick={() => setView("list")}>Назад</Button>
              <Button className="flex-1" onClick={handleAdd} disabled={saving || !newName.trim()}>
                {saving && <Icon name="Loader2" size={14} className="animate-spin mr-2" />}Добавить
              </Button>
            </div>
          </div>
        )}

        {/* Переименовать */}
        {view === "rename" && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-foreground">Новое название группы</Label>
              <Input value={renameTo} onChange={e => setRenameTo(e.target.value)} className="bg-background" autoFocus />
            </div>
            <p className="text-xs text-muted-foreground">
              Все студенты группы «{selected?.group}» будут автоматически переведены в новую группу.
            </p>
            {error && <p className="text-xs text-red-400 flex items-center gap-1"><Icon name="AlertCircle" size={13} />{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 border-border" onClick={() => setView("list")}>Назад</Button>
              <Button className="flex-1" onClick={handleRename} disabled={saving || !renameTo.trim() || renameTo === selected?.group}>
                {saving && <Icon name="Loader2" size={14} className="animate-spin mr-2" />}Переименовать
              </Button>
            </div>
          </div>
        )}

        {/* Удалить */}
        {view === "delete" && (
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-start gap-2">
              <Icon name="AlertTriangle" size={16} className="shrink-0 mt-0.5" />
              <span>Группу можно удалить только если в ней нет активных студентов.</span>
            </div>
            {selected && (selected.student_count ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">В группе <strong className="text-foreground">{selected.student_count}</strong> активных студентов. Переведите или отчислите их перед удалением.</p>
            )}
            {error && <p className="text-xs text-red-400 flex items-center gap-1"><Icon name="AlertCircle" size={13} />{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 border-border" onClick={() => setView("list")}>Назад</Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
                onClick={handleDelete}
                disabled={saving || (selected?.student_count ?? 0) > 0}
              >
                {saving && <Icon name="Loader2" size={14} className="animate-spin mr-2" />}Удалить группу
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
