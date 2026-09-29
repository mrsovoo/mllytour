import { useState } from "react";
import { Link } from "react-router";
import { useAdminQuery, useAdminMutation } from "@/api/admin";
import { Utensils, Edit3, Eye, MoreHorizontal, Star, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent } from "@/components/ui/card";

interface Restaurant {
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

export default function AdminRestaurants() {
  const [statusFilter, setStatusFilter] = useState("all");

  const params: Record<string, string> = {};
  if (statusFilter !== "all") params.status = statusFilter;

  const { data: restaurants, isLoading, refetch } = useAdminQuery<Restaurant[]>(
    "/restaurants",
    params,
  );
  const { mutate: changeStatus } = useAdminMutation("/restaurants/:id/status");

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await changeStatus({ id, status });
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Restoranlar</h1>
            <p className="text-muted-foreground">Restoranlarni boshqarish</p>
          </div>
          <Link to="/admin/dashboard">
            <Button variant="outline"><ChevronLeft className="size-4 mr-1" /> Orqaga</Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Input placeholder="Restoran qidirish..." className="w-full sm:w-64" />
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : restaurants?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Restoran topilmadi</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shirkat</TableHead>
                    <TableHead>Shahar</TableHead>
                    <TableHead>Tel</TableHead>
                    <TableHead>Reyting</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Obuna</TableHead>
                    <TableHead>Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(restaurants || []).map((r: Restaurant) => (
                    <TableRow key={r._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 place-items-center rounded-lg bg-muted">
                            <Utensils className="size-4 text-muted-foreground" />
                          </div>
                          <p className="font-medium text-sm">{r.businessName}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.city}</TableCell>
                      <TableCell className="text-sm">{r.phone || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {r.rating > 0 ? (
                          <span className="flex items-center gap-1">
                            <Star className="size-3 text-gold" /> {r.rating.toFixed(1)}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-sm"><SubBadge subscription={r.subscription} /></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => alert("Ko'rish: " + r.businessName)}>
                              <Eye className="size-4 mr-2" /> Ko'rish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alert("Tahrirlash: " + r.businessName)}>
                              <Edit3 className="size-4 mr-2" /> Tahrirlash
                            </DropdownMenuItem>
                            {(r.status === "approved" || r.status === "pending") && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleStatusChange(r._id, r.status === "approved" ? "paused" : "approved")}
                              >
                                {r.status === "approved" ? "To'xtatish" : "Tasdiqlash"}
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
    pending: "Kutayotgan", approved: "Tasdiqlangan", paused: "To'xtatilgan", rejected: "Rad etilgan",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {labels[status] || status}
    </span>
  );
}

function SubBadge({ subscription }: { subscription: string }) {
  const styles: Record<string, string> = { trial: "bg-blue-50/80 text-blue-600", active: "bg-eco/10 text-eco", expired: "bg-red-50/80 text-red-600" };
  const labels: Record<string, string> = { trial: "Sinov", active: "Faol", expired: "Muddati o'tgan" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[subscription] || "bg-muted text-muted-foreground"}`}>
      {labels[subscription] || subscription}
    </span>
  );
}
