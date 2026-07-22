import { redirect } from "next/navigation";
import { PortalSidebar } from "@/components/portal-sidebar";
import { getSession } from "@/lib/auth";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.rol !== "cliente") {
    redirect("/login");
  }

  return (
    <div className="app-frame">
      <PortalSidebar nombre={session.nombre} />
      <div className="main-area">
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
