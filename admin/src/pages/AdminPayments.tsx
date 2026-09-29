import { useState } from "react";
import { Link } from "react-router";
import { useAdminQuery, useAdminMutation } from "@/api/admin";
import { toast } from "sonner";
import { 
  CreditCard, 
  DollarSign, 
  ArrowUpRight, 
  RefreshCcw, 
  ChevronLeft, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock,
  RotateCcw
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import AdminLayout from "@/layouts/AdminLayout";

interface Payment {
  id: string;
  orderId: string;
  userId: string;
  provider: "click" | "payme" | "card" | "test";
  amount: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  customerName?: string;
  createdAt: string;
  paidAt?: string;
}

interface PartnerEarning {
  id: string;
  partnerId: string;
  partnerName?: string;
  orderId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  status: "PENDING" | "AVAILABLE" | "PAID";
  createdAt: string;
}

export default function AdminPayments() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundReason, setRefundReason] = useState("");

  const queryParams: Record<string, string> = {};
  if (statusFilter !== "all") queryParams.status = statusFilter;
  if (providerFilter !== "all") queryParams.provider = providerFilter;

  const { data: payments, isLoading, refetch } = useAdminQuery<Payment[]>("/payments", queryParams);
  const { data: earnings, isLoading: earningsLoading } = useAdminQuery<PartnerEarning[]>("/partner-earnings");
  const { mutate: processRefund } = useAdminMutation("/payments/:id/refund");

  const handleRefundSubmit = async () => {
    if (!selectedPayment) return;
    try {
      await processRefund({ id: selectedPayment.id, reason: refundReason });
      toast.success("To'lov muvaffaqiyatli qaytarildi (Refund)");
      setRefundDialogOpen(false);
      setRefundReason("");
      setSelectedPayment(null);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Qaytarishda xatolik yuz berdi");
    }
  };

  const totalPaid = (payments || [])
    .filter((p) => p.status === "PAID")
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="size-6 text-primary" /> To'lovlar va Daromadlar
            </h1>
            <p className="text-muted-foreground">
              Click, Payme, Karta to'lovlari, komissiyalar va to'lov qaytarishlar (Refund)
            </p>
          </div>
          <Link to="/admin/dashboard">
            <Button variant="outline">
              <ChevronLeft className="size-4 mr-1" /> Orqaga
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Jami Tushum</p>
                  <p className="text-2xl font-bold mt-1">{totalPaid.toLocaleString()} UZS</p>
                </div>
                <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center">
                  <DollarSign className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Click To'lovlar</p>
                  <p className="text-2xl font-bold mt-1">
                    {(payments || []).filter((p) => p.provider === "click" && p.status === "PAID").length} ta
                  </p>
                </div>
                <div className="size-10 rounded-full bg-blue-50 text-blue-600 grid place-items-center">
                  <ArrowUpRight className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Payme To'lovlar</p>
                  <p className="text-2xl font-bold mt-1">
                    {(payments || []).filter((p) => p.provider === "payme" && p.status === "PAID").length} ta
                  </p>
                </div>
                <div className="size-10 rounded-full bg-teal-50 text-teal-600 grid place-items-center">
                  <RefreshCcw className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Xalqaro Karta</p>
                  <p className="text-2xl font-bold mt-1">
                    {(payments || []).filter((p) => p.provider === "card" && p.status === "PAID").length} ta
                  </p>
                </div>
                <div className="size-10 rounded-full bg-purple-50 text-purple-600 grid place-items-center">
                  <CreditCard className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="payments">To'lovlar Ro'yxati</TabsTrigger>
            <TabsTrigger value="earnings">Hamkorlar Ulushi (Earnings)</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Buyurtma yoki ID qidirish..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Holat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha holatlar</SelectItem>
                      <SelectItem value="PAID">To'langan (PAID)</SelectItem>
                      <SelectItem value="PENDING">Kutayotgan</SelectItem>
                      <SelectItem value="FAILED">Xato / Bekor</SelectItem>
                      <SelectItem value="REFUNDED">Qaytarilgan</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Provayder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha provayderlar</SelectItem>
                      <SelectItem value="click">Click</SelectItem>
                      <SelectItem value="payme">Payme</SelectItem>
                      <SelectItem value="card">Visa / Mastercard</SelectItem>
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
                ) : (payments || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    To'lovlar topilmadi
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>To'lov ID</TableHead>
                        <TableHead>Buyurtma ID</TableHead>
                        <TableHead>Provayder</TableHead>
                        <TableHead>Miqdor</TableHead>
                        <TableHead>Holat</TableHead>
                        <TableHead>Sana</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(payments || []).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{p.orderId}</TableCell>
                          <TableCell>
                            <span className="uppercase text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                              {p.provider}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {p.amount.toLocaleString()} {p.currency}
                          </TableCell>
                          <TableCell>
                            <PaymentStatusBadge status={p.status} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(p.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {p.status === "PAID" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setSelectedPayment(p);
                                  setRefundDialogOpen(true);
                                }}
                              >
                                <RotateCcw className="size-3 mr-1" /> Qaytarish (Refund)
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings">
            <Card>
              <CardContent className="pt-6">
                {earningsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (earnings || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Hamkorlar ulushi ma'lumotlari mavjud emas
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hamkor</TableHead>
                        <TableHead>Buyurtma ID</TableHead>
                        <TableHead>Jami Miqdor</TableHead>
                        <TableHead>Platforma Komissiyasi</TableHead>
                        <TableHead>Hamkorga Qoladi (Net)</TableHead>
                        <TableHead>Holat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(earnings || []).map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium text-sm">{e.partnerName || e.partnerId}</TableCell>
                          <TableCell className="font-mono text-xs">{e.orderId}</TableCell>
                          <TableCell>{e.grossAmount.toLocaleString()} {e.currency}</TableCell>
                          <TableCell className="text-amber-600 font-medium">
                            {e.commissionAmount.toLocaleString()} {e.currency} ({e.commissionRate}%)
                          </TableCell>
                          <TableCell className="text-emerald-600 font-bold">
                            {e.netAmount.toLocaleString()} {e.currency}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
                              {e.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Refund Dialog */}
        <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>To'lovni qaytarish (Refund)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Qaytariladigan summa: <strong className="text-foreground">{selectedPayment?.amount.toLocaleString()} {selectedPayment?.currency}</strong>
              </p>
              <div className="space-y-2">
                <label className="text-xs font-semibold">Qaytarish sababi:</label>
                <Input
                  placeholder="Mijoz arizasi, xizmat ko'rsatilmadi va h.k."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Bekor qilish</Button>
              <Button variant="destructive" onClick={handleRefundSubmit}>Tasdiqlash va Qaytarish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-700 border-gray-200",
    REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${styles[status] || "bg-muted"}`}>
      {status}
    </span>
  );
}
