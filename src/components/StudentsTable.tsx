import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { StudentModal } from "@/components/StudentModal"
import { GradesModal } from "@/components/GradesModal"
import { apiGetStudents, apiAddStudent, apiUpdateStudent, Student } from "@/lib/api"

const MONTHS = ["Сен", "Окт", "Ноя", "Дек", "Янв", "Фев", "Мар", "Апр", "Май", "Июн"]

function getScoreColor(score: number) {
  return score >= 70 ? "text-green-400" : "text-red-400"
}

function getAverageBadge(avg: number) {
  if (avg >= 70) return <Badge className="bg-green-400/15 text-green-400 border-green-400/30">{avg.toFixed(1)}%</Badge>
  return <Badge className="bg-red-400/15 text-red-400 border-red-400/30">{avg.toFixed(1)}%</Badge>
}

function getScore(student: Student, month: string) {
  const g = student.grades.find(g => g.month === month)
  return g ? g.score : null
}

interface Props {
  showAll?: boolean
}

export function StudentsTable({ showAll }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterGroup, setFilterGroup] = useState("all")
  const [filterAvg, setFilterAvg] = useState("all")

  const [addOpen, setAddOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [gradesStudent, setGradesStudent] = useState<Student | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await apiGetStudents()
    setStudents(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const groups = [...new Set(students.map(s => s.group))].sort()

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.group.toLowerCase().includes(search.toLowerCase())
    const matchGroup = filterGroup === "all" || s.group === filterGroup
    const matchAvg = filterAvg === "all"
      || (filterAvg === "pass" && s.average >= 70)
      || (filterAvg === "fail" && s.average < 70)
    return matchSearch && matchGroup && matchAvg
  })

  const displayed = showAll ? filtered : filtered.slice(0, 6)

  async function handleAdd(name: string, group: string) {
    await apiAddStudent(name, group)
    await load()
  }

  async function handleEdit(name: string, group: string) {
    if (!editStudent) return
    await apiUpdateStudent(editStudent.id, name, group)
    await load()
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Icon name="Users" size={18} className="text-primary" />
                {showAll ? "Все студенты" : "Студенты"}
              </CardTitle>
              <Button size="sm" className="h-8 gap-1.5 self-start sm:self-auto" onClick={() => setAddOpen(true)}>
                <Icon name="UserPlus" size={14} />
                Добавить студента
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[160px]">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm bg-background"
                />
              </div>
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger className="h-8 w-[110px] text-sm bg-background">
                  <SelectValue placeholder="Группа" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Все группы</SelectItem>
                  {groups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterAvg} onValueChange={setFilterAvg}>
                <SelectTrigger className="h-8 w-[130px] text-sm bg-background">
                  <SelectValue placeholder="Успеваемость" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="pass">70% и выше</SelectItem>
                  <SelectItem value="fail">Ниже 70%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Icon name="Loader2" size={20} className="animate-spin" />
              Загрузка...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Студент</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Группа</th>
                    {MONTHS.map(m => (
                      <th key={m} className="text-center py-3 px-1 text-muted-foreground font-medium min-w-[40px]">{m}</th>
                    ))}
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Ср. год</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((student, idx) => (
                    <tr key={student.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {student.name[0]}
                          </div>
                          <span className="font-medium text-foreground whitespace-nowrap">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{student.group}</td>
                      {MONTHS.map(m => {
                        const score = getScore(student, m)
                        return (
                          <td key={m} className={`py-3 px-1 text-center font-semibold ${score !== null ? getScoreColor(score) : "text-muted-foreground"}`}>
                            {score !== null ? score : "—"}
                          </td>
                        )
                      })}
                      <td className="py-3 px-2 text-center">{getAverageBadge(student.average)}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Редактировать оценки"
                            onClick={() => setGradesStudent(student)}
                          >
                            <Icon name="ClipboardEdit" size={14} className="text-primary" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Редактировать студента"
                            onClick={() => setEditStudent(student)}
                          >
                            <Icon name="Pencil" size={14} className="text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {displayed.length === 0 && (
                    <tr>
                      <td colSpan={MONTHS.length + 4} className="py-12 text-center text-muted-foreground">
                        Студенты не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!showAll && filtered.length > 6 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">Показано 6 из {filtered.length} студентов</p>
            </div>
          )}
        </CardContent>
      </Card>

      <StudentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
      />
      <StudentModal
        open={!!editStudent}
        onClose={() => setEditStudent(null)}
        onSave={handleEdit}
        student={editStudent}
      />
      <GradesModal
        open={!!gradesStudent}
        onClose={() => setGradesStudent(null)}
        student={gradesStudent}
        onSaved={load}
      />
    </>
  )
}