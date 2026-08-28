import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import {
  calibracionTitulo,
  type CalibracionPesoPayload,
} from "@/lib/calibracion-peso";

type PdfDoc = InstanceType<typeof PDFDocument>;

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

function logoPath(...names: string[]) {
  for (const name of names) {
    const inAssets = path.join(process.cwd(), "assets", name);
    if (fs.existsSync(inAssets)) return inAssets;
  }
  return null;
}

function drawScaleDiagram(
  doc: PdfDoc,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const line = "#333";
  doc.save();
  doc.lineWidth(1).strokeColor(line);

  doc.moveTo(x, y).lineTo(x + w, y).lineTo(x + w, y + h * 0.82).lineTo(x + w * 0.78, y + h).lineTo(x, y + h).closePath().stroke();

  doc.fillColor("#666").font("Helvetica-Bold").fontSize(6);
  const labels: [string, number, number][] = [
    ["Punto 1", x + 4, y + 4],
    ["Punto 2", x + w - 34, y + 4],
    ["Punto 3", x + w / 2 - 14, y + h / 2 - 3],
    ["Punto 4", x + 4, y + h - 14],
  ];
  for (const [label, lx, ly] of labels) {
    doc.text(label, lx, ly, { width: 40 });
  }

  doc.restore();
  doc.fillColor("#000").strokeColor("#000");
}

export function buildCalibracionPesoPdf(
  data: CalibracionPesoPayload
): Promise<Buffer> {
  const logintecLogo = logoPath("logologintec-black.png", "logo.png");
  const cubiscanLogo = logoPath("logocubiscan2-pdf.png", "logocubiscan2.png");
  const montraLogo = logoPath("logomontra-pdf.png", "logomontra.png");
  const titulo = calibracionTitulo(data.modeloEquipo || "—");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: titulo,
        Author: "Logintec SRL",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const M = 14;
    const contentW = W - M * 2;
    const line = "#222";
    const gray = "#d9d9d9";
    const headerGray = "#bdbdbd";

    const drawBox = (x: number, y: number, w: number, h: number, fill?: string) => {
      if (fill) doc.save().rect(x, y, w, h).fill(fill).restore();
      doc.rect(x, y, w, h).stroke(line);
    };

    let y = M;

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#000");
    const titleGap = 22;
    const titleH = doc.heightOfString(titulo, { width: contentW });
    doc.text(titulo, M, y, { width: contentW, align: "center" });
    y += titleH + titleGap;

    const metaW = contentW * 0.32;
    const logoW = contentW * 0.30;
    const diagramW = contentW * 0.30;
    const metaX = M;
    const logoColX = M + metaW + 16;
    const diagramX = M + metaW + logoW + 22;

    const metaFields: [string, string][] = [
      ["LUGAR", data.lugar],
      ["EQUIPO", data.equipo],
      ["MES", data.mes],
      ["AÑO", data.anio],
    ];
    let my = y;
    for (const [label, value] of metaFields) {
      doc.font("Helvetica-Bold").fontSize(7).text(label, metaX, my);
      doc.moveTo(metaX + 38, my + 9).lineTo(metaX + metaW - 8, my + 9).stroke("#444");
      if (value) {
        doc.font("Helvetica").fontSize(8).text(value, metaX + 40, my - 1, {
          width: metaW - 48,
          ellipsis: true,
        });
      }
      my += 14;
    }

    const logoY = y;
    const logoItemH = 15;
    const logoGap = 3;
    let ly = logoY;
    for (const file of [logintecLogo, cubiscanLogo, montraLogo]) {
      if (file) {
        try {
          doc.image(file, logoColX, ly, {
            fit: [logoW - 10, logoItemH],
            align: "right",
          });
        } catch {
          /* ignore */
        }
      }
      ly += logoItemH + logoGap;
    }

    drawScaleDiagram(doc, diagramX, y, diagramW, 52);
    y = Math.max(my, ly - logoGap, y + 52);
    y += 22;

    const cols = [
      { key: "med", label: "MEDICIÓN", w: 0.07 },
      { key: "pat", label: "PATRÓN", w: 0.1 },
      { key: "p1", label: "PUNTO 1", w: 0.1 },
      { key: "p2", label: "PUNTO 2", w: 0.1 },
      { key: "p3", label: "PUNTO 3", w: 0.1 },
      { key: "p4", label: "PUNTO 4", w: 0.1 },
      { key: "hora", label: "HORA", w: 0.1 },
      { key: "real", label: "REALIZÓ", w: 0.13 },
      { key: "fir", label: "FIRMA", w: 0.1 },
    ] as const;

    const rowH = 13.5;
    const headerH = 14;

    drawBox(M, y, contentW, headerH, headerGray);
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#000");
    let cx = M;
    for (const col of cols) {
      const cw = contentW * col.w;
      doc.text(col.label, cx + 2, y + 3.5, { width: cw - 4, align: "center" });
      if (col.key !== "fir") {
        doc.moveTo(cx + cw, y).lineTo(cx + cw, y + headerH).stroke(line);
      }
      cx += cw;
    }
    y += headerH;

    const footerH = 62;
    const tableBottom = H - M - footerH - 10;
    doc.font("Helvetica").fontSize(6.5);

    for (let i = 0; i < data.filas.length; i++) {
      if (y + rowH > tableBottom) break;
      const fila = data.filas[i];
      const values = [
        String(i + 1),
        fila.patron,
        fila.punto1,
        fila.punto2,
        fila.punto3,
        fila.punto4,
        fila.hora,
        fila.realizo,
        fila.firma,
      ];
      drawBox(M, y, contentW, rowH);
      cx = M;
      for (let c = 0; c < cols.length; c++) {
        const cw = contentW * cols[c].w;
        const val = values[c];
        if (val) {
          doc.text(val, cx + 2, y + 3, {
            width: cw - 4,
            align: c === 0 ? "center" : "left",
            ellipsis: true,
          });
        }
        if (c < cols.length - 1) {
          doc.moveTo(cx + cw, y).lineTo(cx + cw, y + rowH).stroke(line);
        }
        cx += cw;
      }
      y += rowH;
    }

    y = tableBottom;
    drawBox(M, y, contentW, footerH);
    doc.font("Helvetica-Bold").fontSize(7).text("COMENTARIOS", M + 6, y + 4);
    if (data.comentarios) {
      doc.font("Helvetica").fontSize(7).text(data.comentarios, M + 6, y + 14, {
        width: contentW * 0.58,
        height: 40,
      });
    }

    const sigW = contentW * 0.3;
    const sigX = M + contentW - sigW - 8;
    const sigImgH = 38;
    const sigTop = y + 6;

    const firmaBuf = dataUrlToBuffer(data.firmaIngeniero);
    if (firmaBuf) {
      try {
        doc.image(firmaBuf, sigX, sigTop, {
          fit: [sigW, sigImgH],
          align: "center",
          valign: "center",
        });
      } catch {
        /* ignore */
      }
    }

    const nameY = sigTop + sigImgH + 5;
    doc
      .moveTo(sigX, nameY)
      .lineTo(sigX + sigW, nameY)
      .stroke("#444");

    if (data.nombreIngeniero) {
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(data.nombreIngeniero, sigX, nameY + 4, {
          width: sigW,
          align: "center",
        });
    }

    doc.end();
  });
}
