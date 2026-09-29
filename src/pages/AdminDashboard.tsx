import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useRestQuery, useRestMutation } from "@/api/client";
import {
  Users,
  Store,
  ClipboardList,
  BadgeCheck,
  Wallet,
  BarChart3,
  Bot,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Search,
  ArrowUpDown,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from "@/layouts/AdminLayout";

type UserRole = "user" | "admin" | "owner";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_anonymous: number;
  role: UserRole;
  phone: string;
  country: string;
  language: string;
  telegram_username: string | null;
  interests: string;
  onboarded_at: number | null;
  created_at: number;
}

export default function AdminDashboard() {
  const stats = useRestQuery("admin", "stats");
  const users = useRestQuery("admin", "users");
  const providers = useRestQuery("admin", "providers");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Boshqaruv paneli</h1>
          <p className="text-muted-foreground">Platforma statistikasi va boshqaruv</p>
        </div>
        <Link to="/admin/users">
          <Button>Foydalanuvchilarni boshqarish</Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Foydalanuvchilar" value={stats?.users ?? 0} />
        <StatCard icon={Store} label="Hamkorlar" value={stats?.providers ?? 0} tone="gold" />
        <StatCard icon={ClipboardList} label="Buyurtmalar" value={stats?.bookings ?? 0} />
        <StatCard icon={BadgeCheck} label="Menga kutayotgan" value={stats?.pendingProviders ?? 0} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users table */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Foydalanuvchilar</h3>
              <div className="flex gap-2">
                <Input placeholder="Qidirish..." className="w-48" />
                <Button variant="ghost" size="icon"><Search className="size-4" /></Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ism</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users?.slice(0, 10) ?? []).map((user: AdminUser) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      {user.is_anonymous ? (
                        <span className="text-muted-foreground text-xs">Mehmon</span>
                      ) : (
                        <span className="text-eco text-xs">Faol</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(users?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Foydalanuvchi topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick actions + providers */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Tezkor amallar</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/admin/partners">
                  <Button variant="outline" className="w-full justify-start">
                    <Store className="size-4 mr-2" /> Hamkorlar
                  </Button>
                </Link>
                <Link to="/admin/hotels">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="size-4 mr-2" /> Mehmonxonalar
                  </Button>
                </Link>
                <Link to="/admin/restaurants">
                  <Button variant="outline" className="w-full justify-start">
                    <Utensils className="size-4 mr-2" /> Restoranlar
                  </Button>
                </Link>
                <Link to="/admin/users">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="size-4 mr-2" /> Foydalanuvchilar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Hamkorlar (oxirgi 5 ta)</h3>
              <div className="space-y-3">
                {(providers?.slice(0, 5) ?? []).map((p: any) => (
                  <div key={p._id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{p.businessName || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">{p.city} · {p.direction || "—"}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
                {(providers?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">Hamkor topilmadi</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone?: string }) {
  const toneClass = {
    gold: "text-gold",
    amber: "text-amber-500",
    eco: "text-eco",
  }[tone || ""];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <span className={`grid size-10 place-items-center rounded-xl ${toneClass ? `bg-${tone.split("-")[0]}/10 ${toneClass}` : "bg-muted"}`}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const styles = {
    user: "bg-muted text-muted-foreground",
    admin: "bg-primary/10 text-primary",
    owner: "bg-gold/20 text-gold",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[role]}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50/80 text-amber-600",
    approved: "bg-eco/10 text-eco",
    paused: "bg-red-50/80 text-red-600",
    rejected: "bg-red-50/80 text-red-700",
  };
  const labels: Record<string, string> = {
    pending: "Kutayotgan",
    approved: "Tasdiqlangan",
    paused: "To'xtatilgan",
    rejected: "Rad etilgan",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {labels[status] || status}
    </span>
  );
}
