import { NextResponse } from "next/server";
import { prismaPg } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; fotoId: string }> }
) {
  const id = Number((await params).id);
  const fotoId = Number((await params).fotoId);
  if (!Number.isInteger(id) || !Number.isInteger(fotoId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const foto = await prismaPg.clienteMaquinaFoto.findFirst({
    where: { id: fotoId, idClienteMaquina: id },
    select: { imagen: true, imagenMime: true },
  });
  if (!foto) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(foto.imagen), {
    headers: {
      "Content-Type": foto.imagenMime || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
