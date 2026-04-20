import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { apiLogin } from "@/lib/api"

interface Props {
  onLogin: (token: string, username: string) => void
}

export function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await apiLogin(username, password)
      if (res.ok) {
        onLogin(res.token, res.username)
      } else {
        setError(res.error || "Неверный логин или пароль")
      }
    } catch {
      setError("Ошибка соединения с сервером")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Icon name="GraduationCap" size={28} className="text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold text-xl text-foreground">АкадемикПро</div>
              <div className="text-xs text-muted-foreground">Система управления успеваемостью</div>
            </div>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-foreground text-lg">Вход для администратора</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-foreground">Логин</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  className="bg-background"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-foreground">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-background"
                  required
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
                  <Icon name="AlertCircle" size={14} />
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Icon name="Loader2" size={16} className="animate-spin" />
                    Вход...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icon name="LogIn" size={16} />
                    Войти
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
