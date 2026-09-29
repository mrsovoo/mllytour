import AdminLayout from "@/layouts/AdminLayout";
import { Settings, ShieldCheck, Key, Bell, Globe, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [form, setForm] = useState({
    adminUsername: "admin",
    adminPassword: "admin123",
    siteName: "Millytour",
    siteEmail: "info@millytour.uz",
    timezone: "Asia/Tashkent",
    language: "uz",
  });

  const handleSave = () => {
    toast.success("Sozlamalar saqlandi");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sozlamalar</h1>
          <p className="text-muted-foreground">Admin panel sozlamalari</p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="size-5 text-primary" />
                <h3 className="font-semibold">Admin kirish</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Foydalanuvchi nomi</Label>
                  <Input
                    value={form.adminUsername}
                    onChange={(e) => setForm({ ...form, adminUsername: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Parol</Label>
                  <Input
                    type="password"
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Eslatish: bu `.env` orqali `ADMIN_USERNAME` va `ADMIN_PASSWORD` bilan ham o'zgartirilishi mumkin
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="size-5 text-primary" />
                <h3 className="font-semibold">Sayt</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Sayt nomi</Label>
                  <Input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={form.siteEmail} onChange={(e) => setForm({ ...form, siteEmail: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tillar</Label>
                  <Input value="UZ · RU · EN" disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="size-5 text-primary" />
                <h3 className="font-semibold">Umumiy</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Vaqt mintaqasi</Label>
                  <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Domoylik tili</Label>
                  <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSave}><Save className="size-4 mr-2" /> Saqlash</Button>
            <Button variant="outline" onClick={() => { setForm({ adminUsername: "admin", adminPassword: "admin123", siteName: "Millytour", siteEmail: "info@millytour.uz", timezone: "Asia/Tashkent", language: "uz" }); toast.info("Qayta yuklandi"); }}>
              <RotateCcw className="size-4 mr-2" /> Qayta yuklash
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
