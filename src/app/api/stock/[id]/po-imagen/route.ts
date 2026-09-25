import { NextResponse } from "next/server";
import { getStockPoImagen } from "@/lib/stock-po-imagen";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const foto = await getStockPoImagen(id);
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
