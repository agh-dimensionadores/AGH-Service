import { NextResponse } from "next/server";
import { prismaPg } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const maquina = await prismaPg.maquina.findUnique({
    where: { idmachine: id },
    select: { imagen: true, imagenMime: true, imagenUpdatedAt: true },
  });

  if (!maquina?.imagen) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(Buffer.from(maquina.imagen), {
    status: 200,
    headers: {
      "Content-Type": maquina.imagenMime || "image/jpeg",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
