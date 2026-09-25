import { NextResponse } from "next/server";
import { getOrdenCompraFoto } from "@/lib/orden-compra-fotos";

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

  const foto = await getOrdenCompraFoto(id, fotoId);
  if (!foto) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(foto.imagen, {
    headers: {
      "Content-Type": foto.imagenMime || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
