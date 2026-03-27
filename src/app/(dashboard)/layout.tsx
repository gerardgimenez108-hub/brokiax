import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AuthGuard from "@/components/layout/AuthGuard";
import MobileNav from "@/components/layout/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <Topbar />
        <main className="md:pl-[var(--sidebar-width)] min-h-[calc(100vh-var(--topbar-height))]">
          <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom)+1rem)] md:pb-6">
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
