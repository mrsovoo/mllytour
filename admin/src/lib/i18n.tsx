import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Til tizimi: UZ (standart), RU, EN.
 * Header, pastki menyu va asosiy CTA matnlarini qamrab oladi; qolgan
 * sahifa matnlari keyingi bosqichlarda asta-sekin `t()`ga ko'chiriladi.
 */
export type Lang = "uz" | "ru" | "en";

const DICT = {
  nav_home: { uz: "Bosh sahifa", ru: "Главная", en: "Home" },
  nav_packages: { uz: "Tur paketlar", ru: "Туры", en: "Tours" },
  nav_services: { uz: "Xizmatlar", ru: "Услуги", en: "Services" },
  nav_market: { uz: "Hunarmandlar", ru: "Ремесленники", en: "Artisans" },
  nav_destinations: { uz: "Yo'nalishlar", ru: "Направления", en: "Destinations" },
  nav_deals: { uz: "Takliflar", ru: "Акции", en: "Deals" },
  tour_menu_label: {
    uz: "Tur paketlar va yo'nalishlar",
    ru: "Туры и направления",
    en: "Tours & destinations",
  },
  nav_partners: { uz: "Hamkorlik", ru: "Сотрудничество", en: "Partnership" },
  nav_signin: { uz: "Kirish", ru: "Войти", en: "Sign in" },
  nav_account: { uz: "Kabinet", ru: "Кабинет", en: "Account" },
  nav_admin: { uz: "Admin", ru: "Админ", en: "Admin" },
  menu_label: { uz: "Xizmat ko'rsatuvchilar", ru: "Поставщики услуг", en: "Service providers" },
  menu_all: { uz: "Barcha mutaxassislarni ko'rish", ru: "Все специалисты", en: "All specialists" },
  svc_hotel: { uz: "Mehmonxona", ru: "Отель", en: "Hotel" },
  svc_restaurant: { uz: "Restoran", ru: "Ресторан", en: "Restaurant" },
  svc_guide: { uz: "Gid", ru: "Гид", en: "Guide" },
  svc_transfer: { uz: "Transfer", ru: "Трансфер", en: "Transfer" },
  svc_translator: { uz: "Tarjimon", ru: "Переводчик", en: "Translator" },
  svc_photographer: { uz: "Fotograf", ru: "Фотограф", en: "Photographer" },
  svc_other: { uz: "Boshqa xizmatlar", ru: "Другие услуги", en: "Other services" },
  svc_artisan: { uz: "Hunarmandlar bozori", ru: "Базар ремесленников", en: "Artisan market" },
  cta_view: { uz: "Ko'rish", ru: "Открыть", en: "View" },
  cta_details: { uz: "Batafsil", ru: "Подробнее", en: "Details" },
  cta_book: { uz: "Bron qilish", ru: "Забронировать", en: "Book now" },
  cta_from: { uz: "dan", ru: "от", en: "from" },
  cta_open_milly: { uz: "Milly AI bilan tur dasturi tuzish", ru: "Составить маршрут с Milly AI", en: "Plan a tour with Milly AI" },
  cta_login_register: { uz: "Kirish / Ro'yxatdan o'tish", ru: "Вход / Регистрация", en: "Sign in / Sign up" },
} as const;

type DictKey = keyof typeof DICT;

const LABELS: Record<Lang, string> = { uz: "UZ", ru: "RU", en: "EN" };

/** Bayroq, to'liq nom — til almashtirgich menyusida ishlatiladi. */
const LANG_META: Record<Lang, { flag: string; name: string }> = {
  uz: { flag: "🇺🇿", name: "O'zbekcha" },
  ru: { flag: "🇷🇺", name: "Русский" },
  en: { flag: "🇬🇧", name: "English" },
};

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
};

const Ctx = createContext<LangCtx | null>(null);

const STORAGE_KEY = "millytour.lang";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") {
      return "uz";
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "ru" || saved === "en" || saved === "uz" ? saved : "uz";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback((key: DictKey) => DICT[key][lang], [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useLang LangProvider ichida ishlatilishi kerak");
  }
  return ctx;
}

/** Header'dagi til almashtirgich — tanlangan til darhol ko'rinadi. */
export function LangSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "group h-8 gap-1.5 rounded-full border border-border/70 px-2.5 font-semibold",
            "hover:bg-muted data-[state=open]:bg-muted",
            className,
          )}
          aria-label="Tilni almashtirish"
        >
          <span className="text-[13px] leading-none" aria-hidden="true">
            {LANG_META[lang].flag}
          </span>
          <span className="text-[12px] tracking-wide">{LABELS[lang]}</span>
          <ChevronDown
            className="size-3 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      {/* p-1 (4px) + rounded-2xl (24px) → element radiusi 24 − 4 = 20px (rounded-xl),
          ya'ni ichki va tashqi burchaklar konsentrik. */}
      <DropdownMenuContent align="end" className="min-w-48 rounded-2xl p-1">
        <DropdownMenuLabel className="px-2.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
          Til / Язык / Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        {(["uz", "ru", "en"] as Lang[]).map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLang(l)}
            className={cn(
              "gap-2.5 rounded-xl px-2.5 py-2 text-[13px]",
              l === lang && "font-semibold text-primary",
            )}
          >
            <span className="text-[15px] leading-none" aria-hidden="true">
              {LANG_META[l].flag}
            </span>
            <span className="flex-1">{LANG_META[l].name}</span>
            <span className="text-[11px] font-bold tracking-wide opacity-70">{LABELS[l]}</span>
            {l === lang && <Check className="size-3.5 text-primary" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
