import { Header } from "@/components/admin/header";
import { Sidebar } from "@/components/admin/sidebar";
import { requireAdminPageAccess } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPageAccess();

  return (
    <div className="relative min-h-screen">
      <div className="admin-mesh pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-60" />
      <div className="pointer-events-none absolute -left-40 -top-32 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,216,160,0.65),transparent_68%)] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-16 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(241,160,119,0.28),transparent_72%)] blur-3xl" />

      <div className="relative flex min-h-screen items-start">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
