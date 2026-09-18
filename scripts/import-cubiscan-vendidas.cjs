const crypto = require("crypto");
const { PrismaClient, Prisma } = require("../node_modules/@prisma/client-pg");

const db = new PrismaClient();

/** M/D/YYYY → Date local, o null. */
function parseMdY(value) {
  if (!value) return null;
  const m = String(value).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) throw new Error(`Fecha inválida: ${value}`);
  return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
}

function parseMoney(value) {
  const n = Number(String(value).trim().replace(",", "."));
  if (Number.isNaN(n)) throw new Error(`Valor FOB inválido: ${value}`);
  return new Prisma.Decimal(n.toFixed(2));
}

function newClientToken() {
  return crypto.randomBytes(24).toString("hex").slice(0, 100);
}

function normalizeSerie(value) {
  return String(value).trim().toUpperCase().replace(/[\s-]+/g, "");
}

/**
 * Planilla: 100T / 110T / 150T → catálogo CUBISCAN 100 / 110 / 150.
 * 200TS no es 200SQ: si no existe, se crea.
 */
const MODELO_ALIASES = {
  "125": ["125"],
  "100T": ["100T", "100"],
  "110T": ["110T", "110"],
  "150T": ["150T", "150"],
  "325": ["325"],
  "200TS": ["200TS"],
};

const ROWS = [
  { entrega: "4/27/2017", cliente: "Avon", modelo: "125", serie: "07130572", impo: "8/24/2016", despacho: "16073IC04144332U", po: "C3629 / SO26028", fob: "18800", origen: "EEUU" },
  { entrega: "", cliente: "Adidas", modelo: "100T", serie: "16010231", impo: "10/11/2017", despacho: "17073IC04182728J", po: "SO29043", fob: "8400", origen: "EEUU" },
  { entrega: "10/11/2017", cliente: "Expoyer", modelo: "325", serie: "17010025", impo: "8/22/2017", despacho: "17073IC04148725X", po: "SO28641", fob: "19400", origen: "EEUU" },
  { entrega: "8/1/2019", cliente: "Trenes Argentinos", modelo: "325", serie: "17010074", impo: "12/18/2017", despacho: "17073IC04227651E", po: "SO29508", fob: "19400", origen: "EEUU" },
  { entrega: "4/9/2018", cliente: "Cencosud", modelo: "100T", serie: "16010269", impo: "12/18/2017", despacho: "17073IC04227651E", po: "SO29508", fob: "8400", origen: "EEUU" },
  { entrega: "8/2/2018", cliente: "TRF SA", modelo: "100T", serie: "16010420", impo: "7/10/2018", despacho: "18073IC04111105Y", po: "SO31228", fob: "8400", origen: "EEUU" },
  { entrega: "2/5/2019", cliente: "Mercadolibre", modelo: "100T", serie: "16010419", impo: "7/10/2018", despacho: "18073IC04111105Y", po: "SO31228", fob: "8400", origen: "EEUU" },
  { entrega: "12/27/2021", cliente: "DHL Express", modelo: "200TS", serie: "18101334", impo: "9/19/2018", despacho: "18073IC04152528F", po: "C5428 / SO1129", fob: "39000", origen: "JAPON" },
  { entrega: "5/3/2019", cliente: "Mercadolibre", modelo: "150T", serie: "16030191", impo: "11/15/2018", despacho: "18073IC04183435G", po: "SO32266", fob: "15690", origen: "EEUU" },
  { entrega: "5/23/2019", cliente: "Mercadolibre", modelo: "100T", serie: "16010574", impo: "3/6/2019", despacho: "19073IC04030318V", po: "SO35437", fob: "7200", origen: "EEUU" },
  { entrega: "5/15/2019", cliente: "DHL Express", modelo: "150T", serie: "19020006", impo: "3/6/2019", despacho: "19073IC04030318V", po: "SO35437", fob: "14040", origen: "EEUU" },
  { entrega: "1/25/2020", cliente: "Mercadolibre", modelo: "100T", serie: "18090049", impo: "5/15/2019", despacho: "19073IC04065275X", po: "SO35759", fob: "7200", origen: "EEUU" },
  { entrega: "1/28/2020", cliente: "Mercadolibre", modelo: "100T", serie: "18090057", impo: "5/15/2019", despacho: "19073IC04065275X", po: "SO35759", fob: "7200", origen: "EEUU" },
  { entrega: "4/17/2025", cliente: "Mercadolibre", modelo: "100T", serie: "18090058", impo: "5/15/2019", despacho: "19073IC04065275X", po: "SO35759", fob: "7200", origen: "EEUU" },
  { entrega: "6/15/2023", cliente: "Exar", modelo: "150T", serie: "19110035", impo: "10/31/2019", despacho: "19073IC04150590D", po: "SO36493", fob: "14040", origen: "EEUU" },
  { entrega: "6/15/2023", cliente: "Exar", modelo: "325", serie: "19030211", impo: "10/31/2019", despacho: "19073IC04150590D", po: "SO36493", fob: "18200", origen: "EEUU" },
  { entrega: "6/19/2025", cliente: "Newsan SA", modelo: "100T", serie: "18090339", impo: "10/27/2020", despacho: "20073IC04108688G", po: "C3786/SO37945", fob: "7200", origen: "EEUU" },
  { entrega: "7/14/2025", cliente: "Mercadolibre", modelo: "100T", serie: "18090340", impo: "10/27/2020", despacho: "20073IC04108688G", po: "C3786/SO37945", fob: "7200", origen: "EEUU" },
  { entrega: "4/23/2025", cliente: "Mercadolibre", modelo: "110T", serie: "19150202", impo: "10/27/2020", despacho: "20073IC04108688G", po: "C3786/SO37945", fob: "7500", origen: "EEUU" },
  { entrega: "8/29/2025", cliente: "Mercadolibre", modelo: "150T", serie: "25040027", impo: "6/19/2025", despacho: "25073IC04069026D", po: "25062580989", fob: "17500", origen: "EEUU" },
  { entrega: "8/28/2025", cliente: "Mercadolibre", modelo: "150T", serie: "25040028", impo: "6/19/2025", despacho: "25073IC04069026D", po: "25062580989", fob: "17500", origen: "EEUU" },
  { entrega: "8/28/2025", cliente: "Mercadolibre", modelo: "150T", serie: "25040029", impo: "6/19/2025", despacho: "25073IC04069026D", po: "25062580989", fob: "17500", origen: "EEUU" },
  { entrega: "9/26/2025", cliente: "Mercadolibre", modelo: "150T", serie: "25040030", impo: "6/19/2025", despacho: "25073IC04069026D", po: "25062580989", fob: "17500", origen: "EEUU" },
  { entrega: "9/26/2025", cliente: "Mercadolibre", modelo: "150T", serie: "25040031", impo: "6/19/2025", despacho: "25073IC04069026D", po: "25062580989", fob: "17500", origen: "EEUU" },
  { entrega: "10/14/2025", cliente: "Mercadolibre", modelo: "150T", serie: "25040018", impo: "10/9/2025", despacho: "25073IC04115458E", po: "25091580780", fob: "18989,75", origen: "EEUU" },
  { entrega: "10/14/2025", cliente: "Mercadolibre", modelo: "150T", serie: "25040019", impo: "10/9/2025", despacho: "25073IC04115458E", po: "25091580780", fob: "18989,75", origen: "EEUU" },
];

function isCubiscan(marca) {
  return (marca || "").toLowerCase().includes("cubiscan");
}

async function findCatalog(tx, sheetModelo) {
  const aliases = MODELO_ALIASES[sheetModelo] || [sheetModelo];
  const catalogo = await tx.maquina.findMany({
    select: { idmachine: true, marca: true, modelo: true },
  });
  const cubiscan = catalogo.filter((m) => isCubiscan(m.marca));
  for (const alias of aliases) {
    const found = cubiscan.find(
      (m) => (m.modelo || "").trim().toUpperCase() === alias.toUpperCase()
    );
    if (found) return found;
  }
  return null;
}

async function ensureCatalog(tx, sheetModelo) {
  const existing = await findCatalog(tx, sheetModelo);
  if (existing) return existing;
  if (sheetModelo !== "200TS") {
    throw new Error(`No hay modelo Cubiscan en catálogo para ${sheetModelo}`);
  }
  return tx.maquina.create({
    data: { marca: "CUBISCAN", modelo: "200TS", favorito: false },
    select: { idmachine: true, marca: true, modelo: true },
  });
}

async function ensureCliente(tx, cache, nombre) {
  const key = nombre.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);

  const found = await tx.cliente.findFirst({
    where: { nombre: { equals: nombre, mode: "insensitive" } },
    select: { id: true, nombre: true },
  });
  if (found) {
    cache.set(key, found);
    return found;
  }

  const created = await tx.cliente.create({
    data: {
      nombre,
      token: newClientToken(),
      activo: 1,
      fechaCreacion: new Date(),
    },
    select: { id: true, nombre: true },
  });
  await tx.cliente.update({
    where: { id: created.id },
    data: { clienteId: created.id },
  });
  cache.set(key, created);
  return created;
}

async function main() {
  const result = await db.$transaction(
    async (tx) => {
    const clientesCache = new Map();
    const createdClientes = [];
    const createdUnidades = [];
    const skipped = [];
    const catalogCache = new Map();

    for (const row of ROWS) {
      const serie = normalizeSerie(row.serie);
      const [enStock, asignada] = await Promise.all([
        tx.maquinaStock.findFirst({
          where: { numeroSerie: { equals: serie, mode: "insensitive" } },
          select: { id: true },
        }),
        tx.clienteMaquina.findFirst({
          where: {
            numeroSerie: { equals: serie, mode: "insensitive" },
            liberadaEn: null,
          },
          select: { id: true },
        }),
      ]);
      if (enStock || asignada) {
        skipped.push(`${serie} (${row.cliente} ${row.modelo})`);
        continue;
      }

      let catalogo = catalogCache.get(row.modelo);
      if (!catalogo) {
        catalogo = await ensureCatalog(tx, row.modelo);
        catalogCache.set(row.modelo, catalogo);
      }
      const cliente = await ensureCliente(tx, clientesCache, row.cliente);
      if (!createdClientes.some((c) => c.id === cliente.id)) {
        createdClientes.push(cliente);
      }

      const stock = await tx.maquinaStock.create({
        data: {
          idMaquina: catalogo.idmachine,
          numeroSerie: serie,
          fechaImportacion: parseMdY(row.impo),
          despachoImportacion: row.despacho,
          po: row.po,
          origen: row.origen,
          valorFo: parseMoney(row.fob),
          estado: "asignado",
        },
      });

      const unidad = await tx.clienteMaquina.create({
        data: {
          idCliente: cliente.id,
          idMaquina: catalogo.idmachine,
          numeroSerie: serie,
          modalidad: "venta",
          fechaCompra: parseMdY(row.entrega),
        },
      });

      await tx.maquinaStock.update({
        where: { id: stock.id },
        data: { idClienteMaquina: unidad.id },
      });

      createdUnidades.push({
        cliente: cliente.nombre,
        modelo: `${catalogo.marca} ${catalogo.modelo}`,
        serie,
      });
    }

    return { createdClientes, createdUnidades, skipped };
    },
    { maxWait: 15000, timeout: 120000 }
  );

  console.log("Clientes:", result.createdClientes.map((c) => `${c.id} ${c.nombre}`).join(", ") || "(reutilizados)");
  console.log("Unidades:", result.createdUnidades.length);
  for (const u of result.createdUnidades) {
    console.log(`  ${u.cliente} · ${u.modelo} · ${u.serie}`);
  }
  if (result.skipped.length) {
    console.log("Omitidas (serie ya existía):", result.skipped.join(", "));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
