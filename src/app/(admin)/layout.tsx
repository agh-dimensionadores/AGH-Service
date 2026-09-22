import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getSession } from "@/lib/auth";
import { prismaPg } from "@/lib/prisma";
import { parseGenero } from "@/lib/saludo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.rol !== "admin") {
    redirect("/login");
  }

  const perfil = await prismaPg.usuario.findUnique({
    where: { id: session.id },
    select: { genero: true },
  });
  const genero = parseGenero(perfil?.genero ?? session.genero);
  const rolLabel =
    genero === "f"
      ? "Administradora"
      : genero === "m"
        ? "Administrador"
        : "Administración";

  return (
    <div className="app-frame">
      <Sidebar nombre={session.nombre} rolLabel={rolLabel} />
      <div className="main-area">
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
