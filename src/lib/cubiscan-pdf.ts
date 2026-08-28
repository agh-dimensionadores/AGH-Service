import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import {
  CUBISCAN_EMPRESA,
  checkKey,
  formatFechaAr,
  type CubiscanCheckSection,
  type CubiscanOrdenPayload,
} from "@/lib/cubiscan-planilla";
import {
  CUBISCAN_IMAGE_FILES,
  cubiscanModeloNumero,
} from "@/lib/maquina-images";
import {
  aghModeloCode,
  checkSectionsFor,
  planillaFirmaLabel,
  planillaTitulo,
  type PlanillaKind,
} from "@/lib/planilla-template";

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

function logoPath(...names: string[]) {
  for (const name of names) {
    const inAssets = path.join(process.cwd(), "assets", name);
    if (fs.existsSync(inAssets)) return inAssets;
    const inPublic = path.join(process.cwd(), "public", name);
    if (fs.existsSync(inPublic)) return inPublic;
  }
  return null;
}

function maquinaFile(...names: string[]) {
  const dir = path.join(process.cwd(), "assets", "maquinas");
  for (const name of names) {
    const full = path.join(dir, name);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

/** Foto del modelo: cubiscan{número} o maquinaodc / maquinapdl. */
function resolveMaquinaImage(modelo: string, kind: PlanillaKind) {
  if (kind === "agh") {
    const code = aghModeloCode(undefined, modelo);
    if (code === "ODC") {
      return maquinaFile("maquinaodc.png", "maquinaodc.jpg", "maquinaodc.webp");
    }
    return maquinaFile(
      "maquinapdl.png",
      "maquinapdl.jpg",
      "maquinapdl.webp",
      "maquinapdc.png",
      "maquinapdc.jpg"
    );
  }

  const n = cubiscanModeloNumero(undefined, modelo);
  if (!n) return null;
  const mapped = CUBISCAN_IMAGE_FILES[n];
  const candidates = [`cubiscan${n}-pdf.png`, mapped, `cubiscan${n}.png`].filter(
    (f, i, arr): f is string => Boolean(f) && arr.indexOf(f) === i
  );
  return maquinaFile(...candidates);
}

function drawLines(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  startY: number,
  lineHeight: number
) {
  doc.font("Helvetica").fontSize(8).fillColor("#000");
  let ty = startY;
  for (const line of text.split("\n")) {
    doc.text(line.length ? line : " ", x, ty, {
      lineBreak: false,
      continued: false,
    });
    ty += lineHeight;
  }
}

function tryImage(
  doc: PDFKit.PDFDocument,
  file: string | null,
  x: number,
  y: number,
  fit: [number, number],
  align?: "left" | "center" | "right"
) {
  if (!file) return false;
  try {
    doc.image(file, x, y, {
      fit,
      align: align ?? "left",
      valign: "center",
    });
    return true;
  } catch {
    return false;
  }
}

/** Parte el texto para que entre en `maxHeight` (el resto va a la hoja siguiente). */
function splitTextToHeight(
  doc: PDFKit.PDFDocument,
  text: string,
  width: number,
  maxHeight: number
): { fitted: string; rest: string } {
  const raw = (text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!raw.trim()) return { fitted: "", rest: "" };

  doc.font("Helvetica").fontSize(8);
  const lineHeight = Math.max(doc.currentLineHeight(), 10);
  const maxLines = Math.max(1, Math.floor(Math.max(lineHeight, maxHeight) / lineHeight));

  const lines: string[] = [];
  for (const para of raw.split("\n")) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (doc.widthOfString(next) <= width) {
        line = next;
        continue;
      }
      if (line) lines.push(line);
      if (doc.widthOfString(word) <= width) {
        line = word;
        continue;
      }
      // Palabra más ancha que la caja: cortar por caracteres para no colgar PDFKit.
      let chunk = "";
      for (const ch of word) {
        const trial = chunk + ch;
        if (doc.widthOfString(trial) <= width) {
          chunk = trial;
        } else {
          if (chunk) lines.push(chunk);
          chunk = ch;
        }
      }
      line = chunk;
    }
    if (line) lines.push(line);
  }

  const fitted = lines.slice(0, maxLines).join("\n");
  const rest = lines.slice(maxLines).join("\n");
  if (rest.trim() && !fitted.trim() && lines.length) {
    return { fitted: lines[0], rest: lines.slice(1).join("\n") };
  }
  return { fitted, rest };
}

/** PDF con el layout de la planilla impresa CubiScan / AGH Dimensionadores. */
export function buildCubiscanOrdenPdf(opts: {
  payload: CubiscanOrdenPayload;
  firmaIngeniero?: string | null;
  firmaCliente?: string | null;
  fotos?: Buffer[];
  kind?: PlanillaKind;
}): Promise<Buffer> {
  const { payload: p, firmaIngeniero, firmaCliente, fotos = [], kind = "cubiscan" } =
    opts;
  const isAgh = kind === "agh";
  const titulo = planillaTitulo(kind);
  const firmaLabel = planillaFirmaLabel(kind);
  const sections = checkSectionsFor(kind);
  const cubiscanLogo = logoPath("logocubiscan2-pdf.png", "logocubiscan2.png");
  const logintecLogo = logoPath("logo.png");
  const montraLogo = logoPath("logomontra.png", "logomontra-pdf.png");
  const aghLogo = logoPath(
    "logoagh.png",
    "logoagh.jpg",
    "logoagh.webp",
    "agh-logo.png"
  );
  const maquinaImg = resolveMaquinaImage(p.modelo, kind);
  const productLogo =
    isAgh && aghModeloCode(undefined, p.modelo) === "ODC"
      ? maquinaFile("logoodc-black.png", "logoodc.png")
      : isAgh
        ? maquinaFile("logopdc-black.png", "logopdc.png")
        : null;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: `${titulo} ${p.nroOrden || ""}`.trim(),
        Author: CUBISCAN_EMPRESA.nombre,
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const M = 16;
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
      drawBox(M, y, contentW, 15, gray);
      doc
        .fillColor("#fff")
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text(title, M + 6, y + 3.5, { width: contentW - 12 });
      doc.fillColor("#000");
      return y + 15;
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

    const pageBottom = () => H - M;

    const drawEncabezado = () => {
      let hy = M;
      if (isAgh) {
        drawBox(M, hy, contentW, 18, "#1a1a1a");
        doc
          .fillColor("#fff")
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(titulo, M + 6, hy + 4.5, { width: contentW - 12, align: "center" });
        doc.fillColor("#000");
        hy += 18;
        drawBox(M, hy, contentW, 16, lightGray);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(`Modelo ${p.modelo || "PDC"}`, M, hy + 3.5, {
            width: contentW,
            align: "center",
          });
        hy += 18;

        const brandH = 100;
        drawBox(M, hy, contentW, brandH);

        const aghW = 96;
        const aghH = 72;
        const leftX = M + 52;
        const aghY = hy + (brandH - aghH) / 2;
        if (!tryImage(doc, aghLogo, leftX, aghY, [aghW, aghH], "center")) {
          doc
            .font("Helvetica-Bold")
            .fontSize(9)
            .text("AGH\nDIMENSIONADORES", leftX, hy + 32, {
              width: aghW,
              align: "center",
            });
        }

        const machineSize = 90;
        const machineX = M + contentW - 1 - machineSize;
        const machineY = hy + (brandH - machineSize) / 2;

        const prodW = 82;
        const prodH = 30;
        const prodX = machineX - 6 - prodW;
        const prodY = hy + (brandH - prodH) / 2;
        if (!tryImage(doc, productLogo, prodX, prodY, [prodW, prodH], "center")) {
          const code = aghModeloCode(undefined, p.modelo) || "PDC";
          doc
            .font("Helvetica-Bold")
            .fontSize(11)
            .fillColor("#000")
            .text(code, prodX, hy + 42, { width: prodW, align: "center" });
        }

        if (
          !tryImage(doc, maquinaImg, machineX, machineY, [
            machineSize,
            machineSize,
          ])
        ) {
          doc
            .font("Helvetica")
            .fontSize(6)
            .fillColor("#888")
            .text("foto", machineX + 30, hy + 46);
          doc.fillColor("#000");
        }

        const logiBlockW = 250;
        const logiBlockX = M + (contentW - logiBlockW) / 2;
        if (
          !tryImage(
            doc,
            logintecLogo,
            logiBlockX,
            hy + 8,
            [logiBlockW, 28],
            "center"
          )
        ) {
          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("Logintec", logiBlockX, hy + 12, {
              width: logiBlockW,
              align: "center",
            });
        }
        doc.font("Helvetica").fontSize(6.5).fillColor("#000");
        doc.text(CUBISCAN_EMPRESA.nombre, logiBlockX, hy + 42, {
          width: logiBlockW,
          align: "center",
        });
        doc.text(CUBISCAN_EMPRESA.direccion, logiBlockX, hy + 52, {
          width: logiBlockW,
          align: "center",
        });
        doc.text(
          `${CUBISCAN_EMPRESA.telefono}   ${CUBISCAN_EMPRESA.web}`,
          logiBlockX,
          hy + 62,
          { width: logiBlockW, align: "center" }
        );
        doc.text(CUBISCAN_EMPRESA.horario, logiBlockX, hy + 72, {
          width: logiBlockW,
          align: "center",
        });

        return hy + brandH + 3;
      }

      drawBox(M, hy, contentW, 26, gray);
      doc
        .fillColor("#fff")
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .text(titulo, M + 8, hy + 4, {
          width: contentW * 0.58,
        });
      doc
        .fontSize(8.5)
        .text(`Modelo ${p.modelo || "CubiScan"}`, M + contentW * 0.55, hy + 7, {
          width: contentW * 0.43,
          align: "right",
        });
      doc.fillColor("#000");
      hy += 30;

      const brandH = 78;
      drawBox(M, hy, contentW, brandH);

      const leftX = M + 8;
      const cubiW = 102;
      const cubiH = 24;
      if (!tryImage(doc, cubiscanLogo, leftX, hy + 8, [cubiW, cubiH])) {
        doc.font("Helvetica-Bold").fontSize(11).text("CUBISCAN", leftX, hy + 12);
      }
      const montraW = 64;
      const montraH = 20;
      if (
        !tryImage(
          doc,
          montraLogo,
          leftX + 8,
          hy + 8 + cubiH + 6,
          [montraW, montraH]
        )
      ) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .text("Montra", leftX, hy + 42, { width: cubiW });
      }

      const machineSize = 64;
      const machineX = leftX + cubiW + 8;
      const machineY = hy + (brandH - machineSize) / 2 + 6;
      if (
        !tryImage(doc, maquinaImg, machineX, machineY, [
          machineSize,
          machineSize,
        ])
      ) {
        doc
          .font("Helvetica")
          .fontSize(6)
          .fillColor("#888")
          .text("foto", machineX + 20, hy + 42);
        doc.fillColor("#000");
      }

      const logiW = 108;
      const logiH = 29;
      const rightPad = 36;
      const rightX = M + contentW - rightPad - logiW;
      const logiY = hy + (brandH - logiH) / 2;
      if (!tryImage(doc, logintecLogo, rightX, logiY, [logiW, logiH])) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .text("Logintec", rightX, logiY + 2, {
            width: logiW,
            align: "center",
          });
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#000")
        .text(CUBISCAN_EMPRESA.nombre, M, hy + 14, {
          width: contentW,
          align: "center",
        });
      doc.font("Helvetica").fontSize(6);
      doc.text(CUBISCAN_EMPRESA.direccion, M, hy + 26, {
        width: contentW,
        align: "center",
      });
      doc.text(CUBISCAN_EMPRESA.telefono, M, hy + 36, {
        width: contentW,
        align: "center",
      });
      doc.text(
        `${CUBISCAN_EMPRESA.web}  ·  ${CUBISCAN_EMPRESA.horario}`,
        M,
        hy + 46,
        { width: contentW, align: "center" }
      );

      return hy + brandH + 3;
    };

    const newPageWithHeader = () => {
      doc.addPage();
      return drawEncabezado();
    };

    // ——— Title bar + brand ———
    let y = drawEncabezado();

    // ——— Meta: ingeniero + caja orden ———
    const metaH = 52;
    drawBox(M, y, contentW, metaH);

    const leftMetaX = M + 8;
    fieldLine(leftMetaX, y + 6, "Ingeniero(s):", p.ingenieros, 240);
    fieldLine(leftMetaX, y + 18, "Hora de llegada:", p.horaLlegada, 240);
    fieldLine(leftMetaX, y + 30, "Ubicación:", p.ubicacion, 240);
    fieldLine(leftMetaX, y + 42, "Contacto:", p.contacto, 240);

    const boxX = M + contentW * 0.52;
    const boxW = contentW * 0.48 - 6;
    const boxY = y + 4;
    drawBox(boxX, boxY, boxW, 44);
    const rowH = 11;
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

    y += metaH + 4;

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
    const leftSecs = sections.filter((s) =>
      ["estructura", "energia", "cargador"].includes(s.id)
    );
    const rightSecs = sections.filter((s) =>
      ["limpieza", "calibracion"].includes(s.id)
    );
    const colW = (contentW - 10) / 2;
    const checkLeftX = M;
    const checkRightX = M + colW + 10;
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

    const leftEnd = drawSections(leftSecs, checkLeftX, checkStartY);
    const rightEnd = drawSections(rightSecs, checkRightX, checkStartY);
    y = Math.max(leftEnd, rightEnd) + 2;

    const ensureSpace = (minH: number) => {
      if (y + minH > pageBottom()) {
        y = newPageWithHeader();
      }
    };

    // ——— Comentarios: caja del tamaño del texto; si no entra, sigue en la otra hoja ———
    const commentsText = (p.comentarios || "").trim();
    const textW = contentW - 10;
    const barH = 15;
    const lineH = 10;

    const drawNotesBox = (title: string, body: string, boxH: number) => {
      y = sectionBar(y, title);
      drawBox(M, y, contentW, boxH, "#fafafa");
      if (body) {
        drawLines(doc, body, M + 5, y + 5, lineH);
      }
      y += boxH + 3;
    };

    if (!commentsText) {
      drawNotesBox("Comentarios/Notas", "", 36);
    } else {
      let remaining = commentsText;
      let title = "Comentarios/Notas";
      let pages = 0;
      while (remaining && pages < 12) {
        pages += 1;
        ensureSpace(barH + 48);
        const available = Math.max(36, pageBottom() - y - barH - 6);
        const { fitted, rest } = splitTextToHeight(
          doc,
          remaining,
          textW,
          Math.max(lineH, available - 12)
        );
        const chunk = fitted.trim() ? fitted : remaining.slice(0, 180);
        const leftover = (fitted.trim() ? rest : remaining.slice(chunk.length)).trim();
        const linesN = Math.max(1, chunk.split("\n").length);
        const notesH = leftover
          ? available
          : Math.max(36, linesN * lineH + 12);
        drawNotesBox(title, chunk, notesH);
        if (!leftover || leftover === remaining.trim()) break;
        remaining = leftover;
        title = "Comentarios/Notas (continuación)";
        y = newPageWithHeader();
      }
    }

    if (fotos.length) {
      const drawFoto = (
        buf: Buffer,
        x: number,
        fy: number,
        w: number,
        h: number
      ) => {
        try {
          doc.image(buf, x, fy, {
            fit: [w, h],
            align: "center",
            valign: "center",
          });
        } catch {
          doc.rect(x, fy, w, h).stroke("#ccc");
        }
      };

      const startFotosPage = () => {
        y = newPageWithHeader();
        y = sectionBar(y, "Fotos del mantenimiento realizado");
        y += 8;
      };

      if (pageBottom() - y < 140) {
        startFotosPage();
      } else {
        y = sectionBar(y, "Fotos del mantenimiento realizado");
        y += 8;
      }

      if (fotos.length === 1) {
        const maxW = contentW * 0.82;
        const maxH = Math.min(340, pageBottom() - y - 8);
        const x = M + (contentW - maxW) / 2;
        drawFoto(fotos[0], x, y, maxW, maxH);
        y += maxH + 10;
      } else {
        const fotoCols = 3;
        const gap = 10;
        const cellW = (contentW - gap * (fotoCols - 1)) / fotoCols;
        const cellH = cellW * 1.05;
        fotos.forEach((buf, i) => {
          if (i > 0 && i % fotoCols === 0) {
            y += cellH + gap;
          }
          if (i % fotoCols === 0 && y + cellH > pageBottom()) {
            startFotosPage();
          }
          const col = i % fotoCols;
          const x = M + col * (cellW + gap);
          drawFoto(buf, x, y, cellW, cellH);
        });
        y += cellH + 10;
      }
    }

    // ——— Refacciones ———
    ensureSpace(80);
    y = sectionBar(y, "Refacciones Reemplazadas / Requerimiento de reemplazo");
    const cols = [
      { title: "Reemplazada / Nueva", w: contentW * 0.28 },
      { title: "Cantidad", w: contentW * 0.14 },
      { title: "Número de parte", w: contentW * 0.24 },
      { title: "Descripción", w: contentW * 0.34 },
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
        cantidad: "",
        numeroParte: "",
        descripcion: "",
        estado: "reemplazada",
      });
    }
    for (const r of refs.slice(0, 4)) {
      const ry = y;
      drawBox(M, ry, contentW, 16);
      let rx = M;
      checkbox(rx + 3, ry + 4, Boolean(r.cantidad || r.numeroParte || r.descripcion) && r.estado === "reemplazada", 6);
      doc.font("Helvetica").fontSize(6.5).text("Reemplazada", rx + 12, ry + 4);
      checkbox(rx + 78, ry + 4, Boolean(r.cantidad || r.numeroParte || r.descripcion) && r.estado === "nueva", 6);
      doc.text("Nueva", rx + 87, ry + 4);
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
    ensureSpace(90);
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
    if (H - y - M < 90) {
      y = newPageWithHeader();
    }
    const sigH = Math.max(56, Math.min(78, H - y - M - 4));
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
      .text(firmaLabel, M + sigW + 14, y + 4, {
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
