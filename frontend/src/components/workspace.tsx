import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import {
  BadgeCheck,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MillytourLogo } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export type PanelNavItem = {
  icon: React.ElementType;
  label: string;
  to: string;
  badge?: string | number;
  /** Belgilansa NavLink o'rniga boshqariladigan aktiv holat ishlatiladi. */
  active?: boolean;
};

export function PanelShell({
  variant,
  nav,
  title,
  subtitle,
  children,
  actions,
}: {
  variant: "tourist" | "partner" | "admin";
  nav: PanelNavItem[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const variantMeta = {
    tourist: { label: "Sayohatchi kabineti", tone: "text-primary" },
    partner: { label: "Hamkor paneli", tone: "text-gold" },
    admin: { label: "Millytour administratori", tone: "text-eco" },
  }[variant];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const itemCls = (isActive: boolean) =>
    cn(
      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  const renderInner = (item: PanelNavItem) => (
    <>
      <item.icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge !== undefined && (
        <Badge variant="secondary" className="text-[10px]">
          {item.badge}
        </Badge>
      )}
      <ChevronRight
        className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60"
        aria-hidden="true"
      />
    </>
  );

  const navList = (
    <nav className="flex flex-col gap-1" aria-label="Panel bo'limlari">
      {nav.map((item) =>
        item.active === undefined ? (
          <NavLink
            key={`${item.to}-${item.label}`}
            to={item.to}
            onClick={() => setOpen(false)}
            className={({ isActive }) => itemCls(isActive)}
          >
            {renderInner(item)}
          </NavLink>
        ) : (
          <Link
            key={`${item.to}-${item.label}`}
            to={item.to}
            onClick={() => setOpen(false)}
            className={itemCls(item.active)}
          >
            {renderInner(item)}
          </Link>
        ),
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Menyu">
                <Menu className="size-4" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <MillytourLogo />
                </SheetTitle>
              </SheetHeader>
              <div className="px-4 py-4">{navList}</div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="hidden shrink-0 lg:block" aria-label="Millytour bosh sahifa">
            <MillytourLogo />
          </Link>

          <div className="min-w-0 flex-1">
            <p className={cn("text-[11px] font-bold tracking-wide uppercase", variantMeta.tone)}>
              {variantMeta.label}
            </p>
            <h1 className="truncate text-[15px] font-semibold text-foreground">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-right text-xs sm:block">
              <span className="block font-semibold text-foreground">
                {user?.name ?? "Foydalanuvchi"}
              </span>
              <span className="block text-muted-foreground">{user?.email ?? "—"}</span>
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Chiqish</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 flex flex-col gap-4">
            <div className="rounded-2xl border bg-card p-3">{navList}</div>
            <div className="relative overflow-hidden rounded-2xl bg-ink p-4 text-white">
              <div className="relative">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                  <BadgeCheck className="size-3.5 text-gold" aria-hidden="true" />
                  24/7 qo'llab-quvvatlash
                </p>
                <p className="mt-2 text-[12px] leading-5 text-white/70">
                  Savol bo'lsa saytdagi AI yordamchi yoki Telegram bot orqali yozing.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3 w-full bg-white/10 text-white hover:bg-white/20"
                  asChild
                >
                  <Link to="/paketlar">Tur paketlar</Link>
                </Button>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {(subtitle || actions) && (
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              {subtitle && (
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
              )}
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "primary" | "gold" | "eco";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    gold: "bg-gold/15 text-gold-ink",
    eco: "bg-eco/15 text-eco",
  }[tone];

  return (
    <Card className="border-border/70">
      <CardContent className="flex items-start gap-4 py-5">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", toneCls)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-0.5 text-[12px] text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function PanelCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/70", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-[15px]">{title}</CardTitle>
          {description && (
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-gold/20 text-gold-ink",
  confirmed: "bg-eco/15 text-eco",
  completed: "bg-eco/15 text-eco",
  cancelled: "bg-destructive/10 text-destructive",
  pending: "bg-gold/20 text-gold-ink",
  approved: "bg-eco/15 text-eco",
  rejected: "bg-destructive/10 text-destructive",
  paused: "bg-muted text-muted-foreground",
  trial: "bg-gold/20 text-gold-ink",
  active: "bg-eco/15 text-eco",
  overdue: "bg-destructive/10 text-destructive",
  paid: "bg-eco/15 text-eco",
  unpaid: "bg-gold/20 text-gold-ink",
  refunded: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
  assigned: "bg-gold/20 text-gold-ink",
  notified: "bg-gold/20 text-gold-ink",
  accepted: "bg-eco/15 text-eco",
  declined: "bg-destructive/10 text-destructive",
  done: "bg-eco/15 text-eco",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Kutilmoqda",
  confirmed: "Tasdiqlangan",
  completed: "Bajarilgan",
  cancelled: "Bekor qilingan",
  pending: "Tasdiq kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
  paused: "To'xtatilgan",
  trial: "Sinov davri",
  active: "Faol",
  overdue: "Muddati o'tgan",
  paid: "To'langan",
  unpaid: "To'lanmagan",
  refunded: "Qaytarilgan",
  failed: "Muvaffaqiyatsiz",
  assigned: "Biriktirilgan",
  notified: "Botga yuborilgan",
  accepted: "Qabul qilingan",
  declined: "Rad etilgan",
  done: "Bajarilgan",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PanelEmpty({
  icon: Icon = PanelLeftClose,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="max-w-md text-[13px] leading-5 text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  );
}

export function PanelTable({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b">
            {head.map((h) => (
              <th
                key={h}
                className="pb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}
