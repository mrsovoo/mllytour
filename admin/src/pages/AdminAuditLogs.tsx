import { useState } from "react";
import { Link } from "react-router";
import { useAdminQuery } from "@/api/admin";
import { ShieldAlert, ChevronLeft, Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout from "@/layouts/AdminLayout";

interface AuditLog {
  id: string;
  adminUsername: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export default function AdminAuditLogs() {
  const [search, setSearch] = useState("");
  const { data: logs, isLoading } = useAdminQuery<AuditLog[]>("/audit-logs");

  const filteredLogs = (logs || []).filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.adminUsername.toLowerCase().includes(search.toLowerCase()) ||
      l.targetType.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldAlert className="size-6 text-primary" /> Xavfsizlik va Audit Jurnali
            </h1>
            <p className="text-muted-foreground">
              Administratorlar tomonidan amalga oshirilgan har bir muhim harakat tarixi (Who, What, When, Target)
            </p>
          </div>
          <Link to="/admin/dashboard">
            <Button variant="outline">
              <ChevronLeft className="size-4 mr-1" /> Orqaga
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative w-full sm:w-72 mb-4">
              <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Audit yozuvlarini qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Audit jurnali bo'sh
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vaqt</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Harakat</TableHead>
                    <TableHead>Obyekt (Target)</TableHead>
                    <TableHead>Tafsilotlar</TableHead>
                    <TableHead>IP Manzil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-sm flex items-center gap-1.5">
                        <UserCheck className="size-3.5 text-primary" /> {log.adminUsername}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.targetType} ({log.targetId})
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground max-w-xs truncate">
                        {log.details}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{log.ipAddress || "—"}</TableCell>
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
