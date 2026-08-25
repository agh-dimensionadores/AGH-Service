import PDFDocument from "pdfkit";
import {
  CUBISCAN_CHECK_SECTIONS,
  CUBISCAN_EMPRESA,
  checkKey,
  formatFechaAr,
  type CubiscanCheckSection,
  type CubiscanOrdenPayload,
} from "@/lib/cubiscan-planilla";

function dataUrlToBuffer(dataUrl?: string | null) {
  if (!dataUrl) return null;
  const m = /^data:image\/\w+;base64,(.+)$/i.exec(dataUrl.trim());
  if (!m) return null;
  try {
    return Buffer.from(m[1], "base64");
  } catch {
    return null;
  }
}

function isChecked(val: string | boolean | undefined) {
  return val === true || val === "true" || val === "on" || val === "si";
}

/** PDF con el layout de la planilla impresa CubiScan / Logintec. */
export function buildCubiscanOrdenPdf(opts: {
  payload: CubiscanOrdenPayload;
  firmaIngeniero?: string | null;
  firmaCliente?: string | null;
}): Promise<Buffer> {
  const { payload: p, firmaIngeniero, firmaCliente } = opts;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: `Orden de Servicio CubiScan ${p.nroOrden || ""}`.trim(),
        Author: CUBISCAN_EMPRESA.nombre,
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const M = 18;
    const contentW = W - M * 2;
    const gray = "#5a5a5a";
    const lightGray = "#e8e8e8";
    const line = "#222";

    const drawBox = (x: number, y: number, w: number, h: number, fill?: string) => {
      if (fill) {
        doc.save().rect(x, y, w, h).fill(fill).restore();
      }
      doc.rect(x, y, w, h).stroke(line);
    };

    const sectionBar = (y: number, title: string) => {
      drawBox(M, y, contentW, 16, gray);
      doc
        .fillColor("#fff")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(title, M + 6, y + 4, { width: contentW - 12 });
      doc.fillColor("#000");
      return y + 16;
    };

    const checkbox = (x: number, y: number, checked: boolean, size = 8) => {
      doc.rect(x, y, size, size).stroke(line);
      if (checked) {
        doc
          .moveTo(x + 1.5, y + size / 2)
          .lineTo(x + size / 2 - 0.5, y + size - 1.5)
          .lineTo(x + size - 1.5, y + 1.5)
          .lineWidth(1.2)
          .stroke(line);
        doc.lineWidth(1);
      }
    };

    const fieldLine = (
      x: number,
      y: number,
      label: string,
      value: string,
      width: number
    ) => {
      doc.font("Helvetica").fontSize(7.5).fillColor("#000");
      const labelW = doc.widthOfString(label);
      doc.text(label, x, y);
      const vx = x + labelW + 3;
      const vw = Math.max(20, width - labelW - 3);
      doc
        .moveTo(vx, y + 9)
        .lineTo(vx + vw, y + 9)
        .stroke("#444");
      if (value) {
        doc.font("Helvetica-Bold").fontSize(8).text(value, vx + 2, y - 1, {
          width: vw - 4,
          ellipsis: true,
        });
      }
      doc.font("Helvetica");
    };

    // ——— Header bar ———
    let y = M;
    drawBox(M, y, contentW, 28, gray);
    doc
      .fillColor("#fff")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Orden de Servicio para Equipo CubiScan", M + 8, y + 5, {
        width: contentW * 0.62,
      });
    doc
      .fontSize(9)
      .text(`Modelo ${p.modelo || "CubiScan"}`, M + contentW * 0.58, y + 8, {
        width: contentW * 0.4,
        align: "right",
      });
    doc.fillColor("#000");
    y += 32;

    // ——— Logos + company + orden box ———
    const headerH = 78;
    drawBox(M, y, contentW, headerH);

    // Cubiscan wordmark
    doc.font("Helvetica-Bold").fontSize(14).text("CUBISCAN", M + 8, y + 8);
    doc.font("Helvetica").fontSize(6).fillColor("#555").text("by Quantronix", M + 8, y + 24);
    doc.fillColor("#000");

    // Center company
    const cx = M + contentW * 0.28;
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(CUBISCAN_EMPRESA.nombre, cx, y + 6, { width: contentW * 0.34, align: "center" });
    doc
      .font("Helvetica")
      .fontSize(6.5)
      .text(CUBISCAN_EMPRESA.direccion, cx, y + 18, {
        width: contentW * 0.34,
        align: "center",
      });
    doc.text(CUBISCAN_EMPRESA.telefono, cx, y + 28, {
      width: contentW * 0.34,
      align: "center",
    });
    doc.text(CUBISCAN_EMPRESA.web, cx, y + 38, {
      width: contentW * 0.34,
      align: "center",
    });
    doc.text(CUBISCAN_EMPRESA.horario, cx, y + 48, {
      width: contentW * 0.34,
      align: "center",
    });

    // Logintec wordmark
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#c45c26")
      .text("Logintec", M + contentW - 95, y + 8, { width: 85, align: "right" });
    doc.fillColor("#000");

    // Left meta fields
    const leftMetaX = M + 8;
    fieldLine(leftMetaX, y + 38, "Ingeniero(s):", p.ingenieros, 150);
    fieldLine(leftMetaX, y + 52, "Hora de llegada:", p.horaLlegada, 150);
    fieldLine(leftMetaX, y + 66, "Ubicación:", p.ubicacion, 150);

    // Contacto under ubicación area - squeeze
    // Actually put Contacto on next visual - form has it under ubicacion
    // Overwrite - use smaller
    doc.font("Helvetica").fontSize(7.5);
    // Contacto was cut - put at bottom left of header
    fieldLine(leftMetaX + 155, y + 66, "Contacto:", p.contacto, 100);

    // Right order box
    const boxX = M + contentW * 0.58;
    const boxW = contentW * 0.4 - 6;
    const boxY = y + 28;
    drawBox(boxX, boxY, boxW, 46);
    const rowH = 11.5;
    const rows: [string, string][] = [
      ["No. de Orden:", p.nroOrden],
      ["Fecha:", formatFechaAr(p.fecha)],
      ["Cliente:", p.cliente],
      ["No. de Serie:", p.numeroSerie],
    ];
    rows.forEach(([lab, val], i) => {
      const ry = boxY + 2 + i * rowH;
      doc.font("Helvetica").fontSize(7).text(lab, boxX + 3, ry);
      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text(val || "", boxX + 72, ry, { width: boxW - 76, ellipsis: true });
      if (i < rows.length - 1) {
        doc
          .moveTo(boxX, ry + rowH - 1)
          .lineTo(boxX + boxW, ry + rowH - 1)
          .stroke("#aaa");
      }
    });

    y += headerH + 4;

    // ——— Detalle ———
    y = sectionBar(y, "Detalle del servicio realizado");
    y += 4;

    // Service type row
    const tipoY = y;
    checkbox(M + 4, tipoY, p.embalaje);
    doc.font("Helvetica-Bold").fontSize(7.5).text("EMBALAJE", M + 15, tipoY);

    checkbox(M + 90, tipoY, Boolean(p.instalacion));
    doc.text("INSTALACION", M + 101, tipoY);
    checkbox(M + 175, tipoY + 1, p.instalacion === "venta", 7);
    doc.font("Helvetica").fontSize(7).text("Venta", M + 185, tipoY + 1);
    checkbox(M + 215, tipoY + 1, p.instalacion === "renta", 7);
    doc.text("Renta", M + 225, tipoY + 1);

    checkbox(M + 270, tipoY, Boolean(p.mantenimientoTipo));
    doc.font("Helvetica-Bold").fontSize(7.5).text("MANTENIMIENTO", M + 281, tipoY);
    checkbox(M + 375, tipoY + 1, p.mantenimientoTipo === "preventivo", 7);
    doc.font("Helvetica").fontSize(7).text("Preventivo", M + 385, tipoY + 1);
    checkbox(M + 445, tipoY + 1, p.mantenimientoTipo === "correctivo", 7);
    doc.text("Correctivo", M + 455, tipoY + 1);

    y += 16;

    // Two-column checklist
    const leftSecs = CUBISCAN_CHECK_SECTIONS.filter((s) =>
      ["estructura", "energia", "cargador"].includes(s.id)
    );
    const rightSecs = CUBISCAN_CHECK_SECTIONS.filter((s) =>
      ["limpieza", "calibracion"].includes(s.id)
    );
    const colW = (contentW - 10) / 2;
    const leftX = M;
    const rightX = M + colW + 10;
    const checkStartY = y;

    const drawSections = (
      sections: CubiscanCheckSection[],
      x: number,
      startY: number
    ) => {
      let cy = startY;
      for (const section of sections) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor("#000")
          .text(section.title, x, cy);
        cy += 11;
        for (const item of section.items) {
          const key = checkKey(section.id, item.id);
          const val = p.checks[key];
          const ok = item.yesNo
            ? val === "si" || val === true
            : isChecked(val);
          checkbox(x, cy, ok, 7);
          doc.font("Helvetica").fontSize(6.5).text(item.label, x + 11, cy, {
            width: colW - 50,
          });
          // underline for mark area
          doc
            .moveTo(x + colW - 36, cy + 7)
            .lineTo(x + colW - 4, cy + 7)
            .stroke("#888");
          if (item.yesNo) {
            const mark =
              val === "si" || val === true
                ? "Sí"
                : val === "no" || val === false
                  ? "No"
                  : "";
            if (mark) {
              doc.font("Helvetica-Bold").fontSize(6.5).text(mark, x + colW - 34, cy);
            }
          } else if (ok) {
            doc.font("Helvetica-Bold").fontSize(7).text("X", x + colW - 22, cy);
          }
          cy += 10;
        }
        cy += 4;
      }
      return cy;
    };

    const leftEnd = drawSections(leftSecs, leftX, checkStartY);
    const rightEnd = drawSections(rightSecs, rightX, checkStartY);
    y = Math.max(leftEnd, rightEnd) + 2;

    // ——— Comentarios ———
    y = sectionBar(y, "Comentarios/Notas");
    const notesH = 42;
    drawBox(M, y, contentW, notesH, "#fafafa");
    doc.font("Helvetica").fontSize(8).text(p.comentarios || "", M + 5, y + 4, {
      width: contentW - 10,
      height: notesH - 8,
    });
    y += notesH + 3;

    checkbox(M + 4, y, p.cuboCalibracion, 7);
    doc.font("Helvetica").fontSize(7.5).text("Cubo de calibración", M + 14, y);
    doc.text("No. de masa:", M + 130, y);
    doc
      .moveTo(M + 185, y + 8)
      .lineTo(M + 280, y + 8)
      .stroke("#444");
    if (p.nroMasa) {
      doc.font("Helvetica-Bold").text(p.nroMasa, M + 188, y);
    }
    y += 14;

    // ——— Refacciones ———
    y = sectionBar(y, "Refacciones Reemplazadas / Requerimiento de reemplazo");
    const cols = [
      { title: "Partes", w: contentW * 0.28 },
      { title: "Cantidad", w: contentW * 0.12 },
      { title: "Número de parte", w: contentW * 0.22 },
      { title: "Descripción", w: contentW * 0.38 },
    ];
    const headY = y;
    let hx = M;
    drawBox(M, headY, contentW, 14, lightGray);
    for (const c of cols) {
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .text(c.title, hx + 3, headY + 3, { width: c.w - 6 });
      hx += c.w;
    }
    y += 14;

    const refs = [...(p.refacciones ?? [])];
    while (refs.length < 3) {
      refs.push({
        parte: "",
        cantidad: "",
        numeroParte: "",
        descripcion: "",
        estado: "",
      });
    }
    for (const r of refs.slice(0, 4)) {
      const ry = y;
      drawBox(M, ry, contentW, 16);
      let rx = M;
      // Partes with mini checks
      checkbox(rx + 3, ry + 4, r.estado === "reemplazada", 6);
      doc.font("Helvetica").fontSize(5.5).text("Reempl.", rx + 11, ry + 4);
      checkbox(rx + 48, ry + 4, r.estado === "nueva", 6);
      doc.text("Nueva", rx + 56, ry + 4);
      if (r.parte) {
        doc.fontSize(7).text(r.parte, rx + 3, ry + 9, { width: cols[0].w - 6 });
      }
      rx += cols[0].w;
      doc.fontSize(7).text(r.cantidad, rx + 3, ry + 4, { width: cols[1].w - 6 });
      rx += cols[1].w;
      doc.text(r.numeroParte, rx + 3, ry + 4, { width: cols[2].w - 6 });
      rx += cols[2].w;
      doc.text(r.descripcion, rx + 3, ry + 4, { width: cols[3].w - 6 });
      y += 16;
    }
    y += 4;

    // ——— Calificación ———
    y = sectionBar(
      y,
      "Califique nuestro servicio, nos interesa su opinión"
    );
    const rateH = 52;
    drawBox(M, y, contentW * 0.68, rateH);

    const rateRow = (
      label: string,
      options: { key: string; label: string; on: boolean }[],
      ry: number
    ) => {
      doc.font("Helvetica").fontSize(7).text(label, M + 4, ry);
      let ox = M + 155;
      for (const o of options) {
        checkbox(ox, ry, o.on, 7);
        doc.text(o.label, ox + 10, ry);
        ox += 55;
      }
    };

    rateRow(
      "¿Resolvimos la falla reportada?",
      [
        { key: "si", label: "Sí", on: p.falloResuelto === "si" },
        { key: "no", label: "No", on: p.falloResuelto === "no" },
        {
          key: "ep",
          label: "En proceso",
          on: p.falloResuelto === "en_proceso",
        },
      ],
      y + 5
    );
    rateRow(
      "El servicio de mantenimiento fue:",
      [
        { key: "r", label: "Rápido", on: p.velocidadServicio === "rapido" },
        { key: "n", label: "Normal", on: p.velocidadServicio === "normal" },
        { key: "l", label: "Lento", on: p.velocidadServicio === "lento" },
      ],
      y + 18
    );
    rateRow(
      "El trato del Ingeniero fue:",
      [
        { key: "a", label: "Amable", on: p.tratoIngeniero === "amable" },
        { key: "d", label: "Descortés", on: p.tratoIngeniero === "descortes" },
      ],
      y + 31
    );

    // Tiempo reparación box
    const tX = M + contentW * 0.7;
    const tW = contentW * 0.3;
    drawBox(tX, y, tW, rateH);
    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .text("Tiempo de Reparación", tX + 4, y + 4, { width: tW - 8 });
    doc.font("Helvetica").fontSize(7);
    doc.text("Fecha:", tX + 4, y + 18);
    doc
      .font("Helvetica-Bold")
      .text(formatFechaAr(p.fechaCalificacion), tX + 40, y + 18, {
        width: tW - 46,
      });
    doc.font("Helvetica").text("Horario:", tX + 4, y + 32);
    doc.font("Helvetica-Bold").text(p.horarioCalificacion || "", tX + 40, y + 32, {
      width: tW - 46,
    });
    if (p.tiempoReparacion) {
      doc
        .font("Helvetica")
        .fontSize(6.5)
        .text(p.tiempoReparacion, tX + 4, y + 42, { width: tW - 8 });
    }
    y += rateH + 6;

    // Sugerencias
    doc.font("Helvetica").fontSize(7.5).text("COMENTARIOS/SUGERENCIAS:", M, y);
    doc
      .moveTo(M + 130, y + 8)
      .lineTo(M + contentW, y + 8)
      .stroke("#444");
    if (p.sugerencias) {
      doc.font("Helvetica-Bold").fontSize(7.5).text(p.sugerencias, M + 132, y - 1, {
        width: contentW - 132,
        ellipsis: true,
      });
    }
    y += 16;

    // ——— Firmas ———
    const sigH = Math.min(78, H - y - M - 4);
    const sigW = (contentW - 10) / 2;
    drawBox(M, y, sigW, sigH);
    drawBox(M + sigW + 10, y, sigW, sigH);

    doc
      .font("Helvetica")
      .fontSize(7)
      .text("Nombre y firma del Representante del Cliente", M + 4, y + 4, {
        width: sigW - 8,
      });
    if (p.representanteCliente) {
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(p.representanteCliente, M + 4, y + 14, { width: sigW - 8 });
    }
    const firmaCli = dataUrlToBuffer(firmaCliente);
    if (firmaCli) {
      try {
        doc.image(firmaCli, M + 10, y + 26, {
          fit: [sigW - 20, sigH - 36],
        });
      } catch {
        /* ignore */
      }
    }

    doc
      .font("Helvetica")
      .fontSize(7)
      .text("Representante de Cubiscan", M + sigW + 14, y + 4, {
        width: sigW - 8,
      });
    const repName = p.representanteCubiscan || p.ingenieros;
    if (repName) {
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(repName.toUpperCase(), M + sigW + 14, y + 14, {
          width: sigW - 8,
        });
    }
    const firmaIng = dataUrlToBuffer(firmaIngeniero);
    if (firmaIng) {
      try {
        doc.image(firmaIng, M + sigW + 20, y + 26, {
          fit: [sigW - 20, sigH - 36],
        });
      } catch {
        /* ignore */
      }
    }

    doc.end();
  });
}
