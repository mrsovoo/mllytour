import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Store,
  Building2,
  Utensils,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAdminSession, adminFetch } from "@/api/admin";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Umumiy ko'rsatkichlar", icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "partners", label: "Hamkorlar", icon: Store, path: "/admin/partners" },
  { id: "hotels", label: "Mehmonxonalar", icon: Building2, path: "/admin/hotels" },
  { id: "restaurants", label: "Restoranlar", icon: Utensils, path: "/admin/restaurants" },
  { id: "users", label: "Foydalanuvchilar", icon: Users, path: "/admin/users" },
  { id: "settings", label: "Sozlamalar", icon: Settings, path: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [adminUser, setAdminUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await fetchAdminSession();
        if (!session) {
          navigate("/admin/login");
          return;
        }
        setAdminUser(session);
      } catch {
        navigate("/admin/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await adminFetch("/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setAdminUser(null);
    toast.success("Chiqildi");
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  const currentPath = location.pathname;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-background transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <ShieldCheck className="size-6 text-primary" aria-hidden="true" />
              <span className="font-bold text-lg">Admin</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPath.startsWith(item.path);
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{adminUser.username}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{adminUser.role}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="size-8 shrink-0"
              title="Chiqish"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}>
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          <div className="flex-1">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="capitalize">Admin Panel</span>
              <span>/</span>
              <span className="text-foreground">
                {NAV_ITEMS.find((n) => currentPath.startsWith(n.path))?.label ?? "Sahifa"}
              </span>
            </nav>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
