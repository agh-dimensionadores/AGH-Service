import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  emptyCubiscanPayload,
  type CubiscanOrdenPayload,
} from "@/lib/cubiscan-planilla";
import { prismaPg } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const orden = await prismaPg.cubiscanOrdenServicio.findUnique({
      where: { idMantenimiento: id },
    });
    if (!orden) {
      return NextResponse.json(
        { error: "No hay planilla guardada para este trabajo" },
        { status: 404 }
      );
    }

    const { buildCubiscanOrdenPdf } = await import("@/lib/cubiscan-pdf");
    const payload = emptyCubiscanPayload(
      orden.payload as unknown as Partial<CubiscanOrdenPayload>
    );
    const pdf = await buildCubiscanOrdenPdf({
      payload,
      firmaIngeniero: orden.firmaIngeniero,
      firmaCliente: orden.firmaCliente,
    });

    const serie = (payload.numeroSerie || String(id)).replace(/[^\w.-]+/g, "_");
    const filename = `orden-cubiscan-${serie}.pdf`;

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[planilla-cubiscan/pdf]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "No se pudo generar el PDF",
      },
      { status: 500 }
    );
  }
}
