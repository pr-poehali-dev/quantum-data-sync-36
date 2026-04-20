import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"

const months = ["Сен", "Окт", "Ноя", "Дек", "Янв", "Фев", "Мар", "Апр"]
const avgByMonth = [3.9, 4.1, 4.0, 4.2, 4.3, 4.2, 4.4, 4.5]

const MAX_GRADE = 5
const MIN_GRADE = 2

function normalize(value: number) {
  return ((value - MIN_GRADE) / (MAX_GRADE - MIN_GRADE)) * 100
}

const groupStats = [
  { group: "11А", average: 4.32, students: 28, top: 8 },
  { group: "11Б", average: 4.44, students: 30, top: 11 },
  { group: "10А", average: 3.75, students: 32, top: 5 },
  { group: "10Б", average: 4.00, students: 34, top: 7 },
]

interface Props {
  showDetailed?: boolean
}

export function GradesChart({ showDetailed }: Props) {
  const yearlyAverage = (avgByMonth.reduce((a, b) => a + b, 0) / avgByMonth.length).toFixed(2)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Линейный график по месяцам */}
      <Card className="border-border bg-card lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Icon name="TrendingUp" size={18} className="text-primary" />
            Динамика среднего балла по месяцам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-48 flex items-end gap-2 pt-6">
            {/* Горизонтальные линии */}
            {[5, 4, 3, 2].map((grade) => (
              <div
                key={grade}
                className="absolute left-0 right-0 border-t border-border/40"
                style={{ bottom: `${normalize(grade)}%` }}
              >
                <span className="absolute -left-6 -translate-y-1/2 text-xs text-muted-foreground">{grade}</span>
              </div>
            ))}

            {/* Столбцы */}
            {avgByMonth.map((avg, i) => {
              const height = normalize(avg)
              const isLast = i === avgByMonth.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                  {/* Тултип */}
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded px-2 py-1 text-xs text-foreground whitespace-nowrap z-10 pointer-events-none">
                    {months[i]}: {avg.toFixed(1)}
                  </div>
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                      isLast ? "bg-primary" : "bg-primary/40 group-hover:bg-primary/70"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{months[i]}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Среднегодовой балл</p>
              <p className="text-2xl font-bold text-foreground">{yearlyAverage}</p>
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
              <Icon name="TrendingUp" size={16} />
              +0.6 к прошлому году
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Группы */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Icon name="BarChart2" size={18} className="text-primary" />
            По группам
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupStats.map((g) => (
            <div key={g.group} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{g.group}</span>
                <span className="font-bold text-foreground">{g.average.toFixed(2)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-700"
                  style={{ width: `${normalize(g.average)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{g.students} студентов</span>
                <span>{g.top} отличников</span>
              </div>
            </div>
          ))}

          {showDetailed && (
            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-sm font-medium text-foreground">Расчёт среднегодового</p>
              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Сумма баллов:</span>
                  <span className="text-foreground font-medium">{avgByMonth.reduce((a, b) => a + b, 0).toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Кол-во месяцев:</span>
                  <span className="text-foreground font-medium">{avgByMonth.length}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 mt-1">
                  <span className="font-semibold text-foreground">Итог:</span>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{yearlyAverage}</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
