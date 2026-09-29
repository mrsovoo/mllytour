import { Link } from "react-router";
import { useAdminQuery, useAdminMutation } from "@/api/admin";
import { Trash2, ChevronLeft } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "@/layouts/AdminLayout";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_anonymous: number;
  role: string;
  phone: string;
  country: string;
  language: string;
  telegram_username: string | null;
  interests: string;
  onboarded_at: number | null;
  created_at: number;
}

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = useAdminQuery<AdminUser[]>("/users");
  const { mutate: changeRole } = useAdminMutation("/users/:id/role");
  const { mutate: deleteUser } = useAdminMutation("/users/:id/delete");

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await changeRole({ id, role });
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`${name} foydalanuvchisini o'chirish?`)) {
      try {
        await deleteUser({ id });
        await refetch();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
            <p className="text-muted-foreground">Barcha foydalanuvchilarni boshqarish</p>
          </div>
          <Link to="/admin/dashboard">
            <Button variant="outline"><ChevronLeft className="size-4 mr-1" /> Orqaga</Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Input placeholder="Qidirish..." className="w-full sm:w-64" />
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha</SelectItem>
                  <SelectItem value="user">Foydalanuvchi</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
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
            ) : users?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Foydalanuvchi topilmadi</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ism</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tel</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Telegram</TableHead>
                    <TableHead>Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users || []).map((u: AdminUser) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm">{u.phone || "—"}</TableCell>
                      <TableCell><RoleBadge role={u.role} /></TableCell>
                      <TableCell>{u.is_anonymous ? <span className="text-muted-foreground text-xs">Mehmon</span> : <span className="text-eco text-xs">Faol</span>}</TableCell>
                      <TableCell className="text-sm">
                        {u.telegram_username ? `@${u.telegram_username}` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Select
                            defaultValue={u.role}
                            onValueChange={(role) => handleRoleChange(u.id, role)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Foydalanuvchi</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(u.id, u.name || "Foydalanuvchi")}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
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

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    user: "bg-muted text-muted-foreground",
    admin: "bg-primary/10 text-primary",
    owner: "bg-gold/20 text-gold",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[role] || "bg-muted text-muted-foreground"}`}>
      {role}
    </span>
  );
}
