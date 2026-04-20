import Icon from "@/components/ui/icon"
import { Button } from "@/components/ui/button"

interface Props {
  activeTab: "dashboard" | "students" | "grades"
  setActiveTab: (tab: "dashboard" | "students" | "grades") => void
}

export function DashboardHeader({ activeTab, setActiveTab }: Props) {
  const tabs = [
    { id: "dashboard" as const, label: "Дашборд", icon: "LayoutDashboard" },
    { id: "students" as const, label: "Студенты", icon: "Users" },
    { id: "grades" as const, label: "Оценки", icon: "ClipboardList" },
  ]

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="GraduationCap" size={20} className="text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-foreground text-lg">АкадемикПро</span>
              <span className="hidden sm:block text-xs text-muted-foreground">Система управления успеваемостью</span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="gap-2"
              >
                <Icon name={tab.icon} size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-foreground">Администратор</p>
              <p className="text-xs text-muted-foreground">2025–2026 уч. год</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <Icon name="User" size={16} className="text-primary" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
