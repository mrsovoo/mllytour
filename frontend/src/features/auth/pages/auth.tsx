import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/components/ui/input-otp";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AuthChoiceDialog } from "@/features/auth/components/auth-choice-dialog";
import { MillytourLogo } from "@/shared/components/brand";
import { ArrowLeft, ArrowRight, Globe, Loader2, Mail, Send, ShieldCheck } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/kabinet") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);

  const [step, setStep] = useState<"signIn" | { email: string; challengeId: string; devCode?: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const result = (await signIn("email-otp", formData)) as { email: string; challengeId: string; devCode?: string };
      setStep({ email: result.email, challengeId: result.challengeId, devCode: result.devCode });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Kod yuborilmadi. Qaytadan urinib ko'ring.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("Kiritilgan tasdiqlash kodi noto'g'ri.");
      setIsLoading(false);
      setOtp("");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2" data-page="auth">
      {/* Brend paneli — faqat desktop */}
      <aside className="relative hidden overflow-hidden bg-[#0B1220] text-white lg:flex lg:flex-col">
        {/* Saytning boshqa to'q paneli bilan bir xil gradient + oltin nur */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#12306B] to-[#1E40AF]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_15%_0%,rgba(245,158,11,0.22),transparent_60%)]" />
        <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
          <Link to="/" aria-label="millytour — bosh sahifa">
            <MillytourLogo mono />
          </Link>
          <div className="mt-auto max-w-md">
            <h1 className="text-3xl leading-10 font-bold tracking-tight">
              O'zbekiston bo'ylab shaxsiy sayohatingizni yarating
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/75">
              Tayyor tur paketlar, Milly AI dasturi va hunarmandlardan
              to'g'ridan-to'g'ri xarid — bitta hisobda.
            </p>
            <ul className="mt-8 flex flex-col gap-3 text-sm">
              {[
                "Bepul bekor qilish — 24 soat ichida",
                "Eng yaxshi narx kafolati",
                "Xavfsiz to'lov: Click, Payme, Visa",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-white/85">
                  <ShieldCheck className="size-4 shrink-0 text-gold" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-12 text-xs text-white/50">
            © 2026 millytour · Toshkent, O'zbekiston
          </p>
        </div>
      </aside>

      {/* Forma paneli */}
      <main className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="absolute top-4 left-4 lg:hidden">
          <Link to="/" aria-label="Orqaga — bosh sahifa">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
        <div className="absolute top-5 right-5">
          <LangHint />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link to="/" aria-label="millytour — bosh sahifa">
              <MillytourLogo />
            </Link>
          </div>

          {step === "signIn" ? (
            <>
              <h2 className="text-2xl leading-8 font-semibold tracking-tight">
                Hisobga kiring
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Email yoki telefon raqamingizni kiriting — tasdiqlash kodini yuboramiz. Hisob
                bo'lmasa avtomatik yaratiladi.
              </p>
              <form onSubmit={handleEmailSubmit} className="mt-8">
                <label htmlFor="email" className="text-sm font-medium">
                  Email yoki telefon raqam
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    name="email"
                    type="text"
                    required
                    placeholder="name@example.com yoki +998 90 123 45 67"
                    autoComplete="email"
                    disabled={isLoading}
                    className="pl-9"
                  />
                </div>
                {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
                <Button type="submit" className="mt-5 w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <>
                      Kod yuborish
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-xs text-muted-foreground">
                    yoki
                  </span>
                </div>
              </div>

              <AuthChoiceDialog
                trigger={
                  <Button type="button" variant="outline" size="lg" className="w-full">
                    <Send className="size-4" aria-hidden="true" />
                    Telegram orqali kirish
                  </Button>
                }
              />

              <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
                Davom etish orqali{" "}
                <Link
                  to="/hujjatlar#oferta"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  ommaviy oferta
                </Link>{" "}
                va{" "}
                <Link
                  to="/hujjatlar#maxfiylik"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  maxfiylik siyosatiga
                </Link>{" "}
                rozilik bildirasiz.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl leading-8 font-semibold tracking-tight">
                Kodni kiriting
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                6 xonali kod <span className="font-medium text-foreground">{step.email}</span>{" "}
                manziliga yuborildi.
              </p>
              <form onSubmit={handleOtpSubmit} className="mt-8">
                <input type="hidden" name="email" value={step.email} />
                <input type="hidden" name="challengeId" value={step.challengeId} />
                <input type="hidden" name="code" value={otp} />
                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                        const form = (e.target as HTMLElement).closest("form");
                        form?.requestSubmit();
                      }
                    }}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && (
                  <p className="mt-3 text-center text-sm text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="mt-6 w-full"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    "Tasdiqlash"
                  )}
                </Button>
              </form>
              {step.devCode && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
                  Lokal test kodi: <strong>{step.devCode}</strong>
                </p>
              )}
              <div className="mt-4 text-center">
                <Button variant="link" onClick={() => setStep("signIn")}>
                  Boshqa emaildan foydalanish
                </Button>
              </div>
            </>
          )}

          <div className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="size-3.5" aria-hidden="true" />
            UZ · RU · EN — MVP 1.0
          </div>
        </div>
      </main>
    </div>
  );
}

function LangHint() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
      <Globe className="size-3.5" aria-hidden="true" />
      UZ
    </span>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
