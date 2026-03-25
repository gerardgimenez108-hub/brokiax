import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AuthGuard from "@/components/layout/AuthGuard";

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
          <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
