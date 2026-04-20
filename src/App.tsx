import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LoginPage } from "@/components/LoginPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "");
  const [username, setUsername] = useState(() => localStorage.getItem("admin_username") || "");

  function handleLogin(t: string, u: string) {
    localStorage.setItem("admin_token", t);
    localStorage.setItem("admin_username", u);
    setToken(t);
    setUsername(u);
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
    setToken("");
    setUsername("");
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {!token ? (
            <LoginPage onLogin={handleLogin} />
          ) : (
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index username={username} onLogout={handleLogout} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          )}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
