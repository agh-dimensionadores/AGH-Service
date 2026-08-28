import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prismaPg } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; fotoId: string }> }
) {
  const session = await getSession();
  if (!session || session.rol !== "admin") {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const id = Number((await params).id);
  const fotoId = Number((await params).fotoId);
  if (!Number.isInteger(id) || !Number.isInteger(fotoId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const foto = await prismaPg.cubiscanOrdenFoto.findFirst({
    where: {
      id: fotoId,
      ordenServicio: { idMantenimiento: id },
    },
    select: { imagen: true, imagenMime: true },
  });
  if (!foto) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(Buffer.from(foto.imagen), {
    status: 200,
    headers: {
      "Content-Type": foto.imagenMime || "image/jpeg",
      "Cache-Control": "private, max-age=60",
    },
  });
}
