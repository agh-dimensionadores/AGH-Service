import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  calibracionPesoAplica,
  emptyCalibracionPeso,
  extractCalibracionPeso,
} from "@/lib/calibracion-peso";
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
      include: {
        mantenimiento: {
          include: { instalacion: { include: { maquina: true } } },
        },
      },
    });
    if (!orden) {
      return NextResponse.json(
        { error: "No hay plantilla de calibración guardada" },
        { status: 404 }
      );
    }

    const maquina = orden.mantenimiento.instalacion.maquina;
    if (!calibracionPesoAplica(maquina.marca, maquina.modelo)) {
      return NextResponse.json(
        { error: "La calibración de peso solo aplica a equipos CubiScan" },
        { status: 404 }
      );
    }

    const calibracion = extractCalibracionPeso(orden.payload);
    if (!calibracion?.activa) {
      return NextResponse.json(
        { error: "No hay plantilla de calibración guardada" },
        { status: 404 }
      );
    }

    const { buildCalibracionPesoPdf } = await import("@/lib/calibracion-peso-pdf");
    const pdf = await buildCalibracionPesoPdf(emptyCalibracionPeso(calibracion));
    const serie = (calibracion.equipo || String(id)).replace(/[^\w.-]+/g, "_");

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="calibracion-peso-${serie}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[calibracion-peso/pdf]", err);
    return NextResponse.json(
      { error: "Error generando el PDF" },
      { status: 500 }
    );
  }
}
