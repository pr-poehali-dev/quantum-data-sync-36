import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { apiGetRemarks, apiAddRemark, apiUpdateRemark, apiDeleteRemark, apiGetStudents, Remark, Student } from "@/lib/api"

export function RemarksTable() {
  const [remarks, setRemarks] = useState<Remark[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [addOpen, setAddOpen] = useState(false)
  const [selStudent, setSelStudent] = useState("")
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)

  const [editRemark, setEditRemark] = useState<Remark | null>(null)
  const [editText, setEditText] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [r, s] = await Promise.all([apiGetRemarks(), apiGetStudents()])
    setRemarks(r)
    setStudents(s)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = remarks.filter(r =>
    r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.group.toLowerCase().includes(search.toLowerCase()) ||
    r.text.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAdd() {
    if (!selStudent || !text.trim()) return
    setSaving(true)
    await apiAddRemark(Number(selStudent), text.trim())
    setSaving(false)
    setAddOpen(false)
    setSelStudent("")
    setText("")
    await load()
  }

  async function handleEdit() {
    if (!editRemark || !editText.trim()) return
    setEditSaving(true)
    await apiUpdateRemark(editRemark.id, editText.trim())
    setEditSaving(false)
    setEditRemark(null)
    await load()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await apiDeleteRemark(deleteId)
    setDeleting(false)
    setDeleteId(null)
    await load()
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Icon name="MessageSquareWarning" size={18} className="text-primary" />
              Замечания по студентам
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm bg-background" />
              </div>
              <Button size="sm" className="h-8 gap-1.5 shrink-0" onClick={() => setAddOpen(true)}>
                <Icon name="Plus" size={14} />
                Добавить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Icon name="Loader2" size={20} className="animate-spin" />Загрузка...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Icon name="MessageSquare" size={32} className="opacity-30" />
              <p className="text-sm">{search ? "Замечания не найдены" : "Замечаний пока нет"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(r => (
                <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                    {r.student_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{r.student_name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{r.group}</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{r.text}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{r.created_at}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Редактировать"
                        onClick={() => { setEditRemark(r); setEditText(r.text) }}>
                        <Icon name="Pencil" size={12} className="text-muted-foreground" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Удалить"
                        onClick={() => setDeleteId(r.id)}>
                        <Icon name="Trash2" size={12} className="text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {filtered.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-right">
              {filtered.length} {filtered.length === 1 ? "замечание" : filtered.length < 5 ? "замечания" : "замечаний"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Добавить */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Icon name="MessageSquarePlus" size={18} className="text-primary" />Добавить замечание
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-foreground">Студент</Label>
              <Select value={selStudent} onValueChange={setSelStudent}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Выберите студента" /></SelectTrigger>
                <SelectContent className="bg-card border-border max-h-60">
                  {students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.group})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Замечание</Label>
              <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Опишите замечание..." className="bg-background resize-none min-h-[100px]" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-border">Отмена</Button>
            <Button onClick={handleAdd} disabled={saving || !selStudent || !text.trim()}>
              {saving && <Icon name="Loader2" size={14} className="animate-spin mr-2" />}Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Редактировать */}
      <Dialog open={!!editRemark} onOpenChange={() => setEditRemark(null)}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Icon name="Pencil" size={18} className="text-primary" />Редактировать замечание
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {editRemark && <p className="text-xs text-muted-foreground mb-3">{editRemark.student_name} · {editRemark.group}</p>}
            <Textarea value={editText} onChange={e => setEditText(e.target.value)} className="bg-background resize-none min-h-[100px]" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditRemark(null)} className="border-border">Отмена</Button>
            <Button onClick={handleEdit} disabled={editSaving || !editText.trim()}>
              {editSaving && <Icon name="Loader2" size={14} className="animate-spin mr-2" />}Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Удалить */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Icon name="Trash2" size={18} className="text-red-400" />Удалить замечание?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Это действие нельзя отменить.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="border-border">Отмена</Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white border-0">
              {deleting && <Icon name="Loader2" size={14} className="animate-spin mr-2" />}Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
