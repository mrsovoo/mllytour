import { useEffect, useState } from "react";

import { useRestMutation } from "@/api/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CITIES } from "@/data/catalog";
import { MillytourLogo } from "@/components/brand";
import { Loader2, Sparkles } from "lucide-react";

const INTERESTS = [
  { id: "history", label: "Tarix va me'morchilik" },
  { id: "craft", label: "Hunarmandchilik" },
  { id: "nature", label: "Tabiat" },
  { id: "food", label: "Gastronomiya" },
  { id: "pilgrimage", label: "Ziyorat" },
  { id: "shopping", label: "Bozor va xarid" },
];

/**
 * Ro'yxatdan o'tishni to'liq yakunlaydi: hisob yaratilgach (OTP tasdiqlangach)
 * bir marta ism, shahar va qiziqishlar so'raladi — tavsiyalar shu asosda
 * aniqlashadi. `onboardedAt` belgilangan mijozga ko'rsatilmaydi.
 */
export function OnboardingGate({ children }: { children?: React.ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const saveProfile = useRestMutation("account", "completeOnboarding");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState<string>(CITIES[1] ?? CITIES[0]);
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !user.onboardedAt && !open) {
      const timer = window.setTimeout(() => {
        setOpen(true);
        setName(user.name ?? "");
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, user, open]);

  // Mehmon (anonymous) yoki yuklanmayotgan holatda gate ko'rsatilmaydi.
  if (!open || isLoading || !isAuthenticated || !user || user.onboardedAt) {
    return <>{children}</>;
  }

  const isGuest = Boolean(user.isAnonymous);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        name: name.trim() || undefined,
        city,
        interests: interests.slice(0, 6),
      });
      if (user) {
        localStorage.setItem(
          "millytour-local-user",
          JSON.stringify({ ...user, name: name.trim() || user.name, onboardedAt: Date.now() }),
        );
      }
      window.dispatchEvent(new Event("millytour:auth-change"));
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saqlanmadi, qaytadan urining");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[70] grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lifted">
          <div className="flex items-center justify-between">
            <MillytourLogo />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              <Sparkles className="size-3" aria-hidden="true" />
              1 daqiqa
            </span>
          </div>

          {isGuest ? (
            <>
              <h2 className="mt-5 text-lg font-semibold text-foreground">
                Hisobingizni to'liqlashtiring
              </h2>
              <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                Siz mehmon sifatida kirdingiz. Bron va vaucherlarni saqlash uchun email bilan
                ro'yxatdan o'ting — hisobingiz shu brauzerda saqlanadi.
              </p>
              <Button className="mt-5 w-full" asChild>
                <a href="/auth?returnTo=%2Fdashboard">Email bilan ro'yxatdan o'tish</a>
              </Button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 w-full text-center text-[12px] text-muted-foreground hover:text-foreground"
              >
                Keyinroq
              </button>
            </>
          ) : (
            <>
              <h2 className="mt-5 text-lg font-semibold text-foreground">
                Sizni tanib olishga yordam bering
              </h2>
              <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                Ismingiz va qiziqishlaringiz — Milly AI va tavsiyalar shunga moslashadi.
              </p>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Ism</span>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Aziza"
                    className="mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Shahringiz</span>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:border-primary/50"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Qiziqishlar (ixtiyoriy)
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {INTERESTS.map((i) => {
                      const active = interests.includes(i.id);
                      return (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() =>
                            setInterests((prev) =>
                              prev.includes(i.id)
                                ? prev.filter((x) => x !== i.id)
                                : [...prev, i.id],
                            )
                          }
                          className={
                            active
                              ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground"
                              : "rounded-full border px-3 py-1.5 text-[12px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }
                        >
                          {i.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

              <Button className="mt-5 w-full" size="lg" onClick={submit} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : "Saqlash va boshlash"}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
