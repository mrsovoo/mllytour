import { useState } from "react";
import { Link } from "react-router";
import { useAdminQuery, useAdminMutation } from "@/api/admin";
import { toast } from "sonner";
import { Eye, Edit3, MoreHorizontal, Store, Star, CheckCircle2 } from "lucide-react";
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
import { PARTNER_DIRECTIONS } from "@/data/catalog";

interface Provider {
  _id: string;
  businessName: string;
  phone: string;
  city: string;
  direction: string;
  status: string;
  subscription: string;
  rating: number;
  ratingCount: number;
  completedOrders: number;
  contactName?: string;
  telegramUsername?: string;
  about?: string;
  createdAt?: number;
  monthlyFee?: number;
}

export default function AdminPartners() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const queryParams: Record<string, string> = {};
  if (statusFilter !== "all") queryParams.status = statusFilter;
  if (directionFilter !== "all") queryParams.direction = directionFilter;

  const { data: providers, isLoading, refetch } = useAdminQuery<Provider[]>(
    "/providers",
    queryParams,
  );
  const { mutate: changeStatus } = useAdminMutation("/providers/:id/status");
  const { mutate: changeSubscription } = useAdminMutation("/providers/:id/subscription");

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await changeStatus({ providerId: id, status });
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Holatni o'zgartirib bo'lmadi");
    }
  };

  /** Obunani bir oyga uzaytiradi (to'lov tasdiqlangach admin qo'lda yoqadi). */
  const handleSubscription = async (id: string) => {
    try {
      await changeSubscription({ providerId: id, subscription: "active", months: 1 });
      toast.success("Obuna 1 oyga uzaytirildi");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Obunani yangilab bo'lmadi");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hamkorlar</h1>
            <p className="text-muted-foreground">Hamkorlarni tasdiqlash, boshqarish va obuna qilish</p>
          </div>
          <Link to="/admin/dashboard">
            <Button variant="outline">← Orqaga</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Hamkorni qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Holat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="pending">Kutayotgan</SelectItem>
                  <SelectItem value="approved">Tasdiqlangan</SelectItem>
                  <SelectItem value="paused">To'xtatilgan</SelectItem>
                </SelectContent>
              </Select>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Yo'nalish" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {PARTNER_DIRECTIONS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : providers?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Hamkor topilmadi
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shirkat</TableHead>
                    <TableHead>Yo'nalish</TableHead>
                    <TableHead>Shahar</TableHead>
                    <TableHead>Reyting</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Obuna</TableHead>
                    <TableHead>Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(providers || []).map((p: Provider) => (
                    <TableRow key={p._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 place-items-center rounded-lg bg-muted">
                            <Store className="size-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{p.businessName}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              {p.telegramUsername ? `@${p.telegramUsername}` : p.phone}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {PARTNER_DIRECTIONS.find((d) => d.id === p.direction)?.label || p.direction}
                      </TableCell>
                      <TableCell className="text-sm">{p.city}</TableCell>
                      <TableCell className="text-sm">
                        {p.rating > 0 ? (
                          <span className="flex items-center gap-1">
                            <Star className="size-3 text-gold" /> {p.rating.toFixed(1)}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-sm">
                        <SubscriptionBadge subscription={p.subscription} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => alert("Ko'rish: " + p.businessName)}>
                              <Eye className="size-4 mr-2" /> Ko'rish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alert("Tahrirlash: " + p.businessName)}>
                              <Edit3 className="size-4 mr-2" /> Tahrirlash
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSubscription(p._id)}>
                              <CheckCircle2 className="size-4 mr-2" /> Obunani 1 oyga uzaytirish
                            </DropdownMenuItem>
                            {(p.status === "approved" || p.status === "pending") && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleStatusChange(p._id, p.status === "approved" ? "paused" : "approved")}
                              >
                                {p.status === "approved" ? "To'xtatish" : "Tasdiqlash"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
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

function SubscriptionBadge({ subscription }: { subscription: string }) {
  const styles: Record<string, string> = {
    trial: "bg-blue-50/80 text-blue-600",
    active: "bg-eco/10 text-eco",
    expired: "bg-red-50/80 text-red-600",
  };
  const labels: Record<string, string> = {
    trial: "Sinov",
    active: "Faol",
    expired: "Muddati o'tgan",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[subscription] || "bg-muted text-muted-foreground"}`}>
      {labels[subscription] || subscription}
    </span>
  );
}
