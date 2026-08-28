import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  emptyCubiscanPayload,
  stripPlanillaBoilerplate,
  type CubiscanOrdenPayload,
} from "@/lib/cubiscan-planilla";
import { getCliente, clienteLabel } from "@/lib/clientes";
import { prismaPg } from "@/lib/prisma";
import { planillaKind, planillaModeloFromMaquina } from "@/lib/planilla-template";

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
        fotos: { orderBy: { orden: "asc" } },
        mantenimiento: {
          include: { instalacion: { include: { maquina: true } } },
        },
      },
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
    payload.comentarios = stripPlanillaBoilerplate(payload.comentarios);
    const instalacion = orden.mantenimiento.instalacion;
    const cliente = await getCliente(instalacion.idCliente);
    payload.cliente = clienteLabel(cliente);
    payload.numeroSerie = instalacion.numeroSerie;
    payload.modelo = planillaModeloFromMaquina(
      instalacion.maquina.marca,
      instalacion.maquina.modelo
    );
    const kind =
      planillaKind(
        orden.mantenimiento.instalacion.maquina.marca,
        orden.mantenimiento.instalacion.maquina.modelo
      ) ?? "cubiscan";
    const fotos = (orden.fotos ?? []).map((f) => Buffer.from(f.imagen));
    const pdf = await Promise.race([
      buildCubiscanOrdenPdf({
        payload,
        firmaIngeniero: orden.firmaIngeniero,
        firmaCliente: orden.firmaCliente,
        fotos,
        kind,
      }),
      new Promise<Buffer>((_, reject) => {
        setTimeout(
          () => reject(new Error("Tiempo agotado generando el PDF")),
          45000
        );
      }),
    ]);

    const serie = (payload.numeroSerie || String(id)).replace(/[^\w.-]+/g, "_");
    const filename =
      kind === "agh"
        ? `orden-agh-${serie}.pdf`
        : `orden-cubiscan-${serie}.pdf`;

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
