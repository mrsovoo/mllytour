import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useRestAction } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Lock, User, ArrowRight, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useRestAction("admin", "login");

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/admin/me", { credentials: "include" });
        const data = await res.json();
        if (data.admin) {
          navigate("/admin/dashboard");
        }
      } catch {
        // not logged in
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login({ username, password });
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kirish amalga oshmadi");
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#0B1220] text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#12306B] to-[#1E40AF]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_15%_0%,rgba(245,158,11,0.22),transparent_60%)]" />
        <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
          <Link to="/" aria-label="millytour — bosh sahifa">
            <svg width="120" height="28" viewBox="0 0 120 28" fill="none" aria-hidden="true">
              <circle cx="14" cy="14" r="12" stroke="white" strokeWidth="2" />
              <text x="32" y="19" fill="white" fontSize="16" fontWeight="bold" fontFamily="system-ui">millytour</text>
            </svg>
          </Link>
          <div className="mt-auto max-w-md">
            <h1 className="text-3xl leading-10 font-bold tracking-tight">
              Ma'muriy panel
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/75">
              Hamkorlar, mehmonxonalar, restoranlar va barcha platforma ma'lumotlarini boshqarish.
            </p>
            <ul className="mt-8 flex flex-col gap-3 text-sm">
              {[
                "To'liq hamkor boshqaruvi",
                "Mehmonxona va restoran nazorati",
                "Foydalanuvchi va buyurtma boshqaruvi",
                "Statistika va tahlil",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-white/85">
                  <ShieldCheck className="size-4 shrink-0 text-gold" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-12 text-xs text-white/50">
            © 2026 millytour · Admin Panel
          </p>
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link to="/" aria-label="millytour — bosh sahifa">
              <svg width="100" height="24" viewBox="0 0 120 28" fill="none">
                <circle cx="14" cy="14" r="12" stroke="#1F5BFF" strokeWidth="2" />
                <text x="32" y="19" fill="#1F5BFF" fontSize="16" fontWeight="bold" fontFamily="system-ui">millytour</text>
              </svg>
            </Link>
          </div>

          <Card className="border-0 shadow-none">
            <CardContent className="flex flex-col gap-6 pt-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h1 className="text-xl font-semibold">Admin kirish</h1>
                  <p className="text-[13px] text-muted-foreground">Ma'muriy panelga kirishingiz kerak</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="username" className="text-sm font-medium">Foydalanuvchi nomi</label>
                  <div className="relative">
                    <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      placeholder="admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      className="pl-9"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-sm font-medium">Parol</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="pl-9"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Kirilmoqda...</>
                  ) : (
                    <>Kirish <ArrowRight className="size-4" aria-hidden="true" /></>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                Amaliy test uchun: <code className="bg-muted px-1.5 py-0.5 rounded">admin</code> / <code className="bg-muted px-1.5 py-0.5 rounded">admin123</code>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
