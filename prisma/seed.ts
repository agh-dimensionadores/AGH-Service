import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  await prisma.soporte.deleteMany();
  await prisma.mantenimiento.deleteMany();
  await prisma.maquina.deleteMany();
  await prisma.catalogoMaquina.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.cliente.deleteMany();

  const [catLs, catPdc, catOdc] = await Promise.all([
    prisma.catalogoMaquina.create({
      data: { marca: "AGH", nombre: "LS1000" },
    }),
    prisma.catalogoMaquina.create({
      data: { marca: "AGH", nombre: "PDC" },
    }),
    prisma.catalogoMaquina.create({
      data: { marca: "AGH", nombre: "ODC" },
    }),
  ]);

  const ml = await prisma.cliente.create({
    data: {
      nombre: "Operaciones CEDIS",
      empresa: "Mercado Libre",
      email: "ops@mercadolibre.com",
      telefono: "+54 11 4000-1000",
      direccion: "CEDIS 2 · Buenos Aires",
    },
  });

  const andreani = await prisma.cliente.create({
    data: {
      nombre: "Planta Logística",
      empresa: "Andreani",
      email: "planta@andreani.com",
      telefono: "+54 11 5000-2000",
      direccion: "Centro de distribución Norte",
    },
  });

  const ocasa = await prisma.cliente.create({
    data: {
      nombre: "Hub Central",
      empresa: "Ocasa",
      email: "hub@ocasa.com",
      telefono: "+54 11 6000-3000",
      direccion: "Ezeiza",
    },
  });

  const maquinas = await Promise.all([
    prisma.maquina.create({
      data: {
        catalogoId: catLs.id,
        numeroSerie: "LS1000-2024-011",
        descripcion: "Dimensionador de línea para bultos",
        ubicacion: "CEDIS 2",
        estadoEquipo: "operativa",
        clienteId: ml.id,
        fechaCompra: daysFromNow(-400),
      },
    }),
    prisma.maquina.create({
      data: {
        catalogoId: catPdc.id,
        numeroSerie: "PDC-2023-088",
        descripcion: "Pallet Dimensioner Camera",
        ubicacion: "Consolidación",
        estadoEquipo: "proximo",
        clienteId: andreani.id,
        fechaCompra: daysFromNow(-600),
      },
    }),
    prisma.maquina.create({
      data: {
        catalogoId: catOdc.id,
        numeroSerie: "ODC-2025-031",
        descripcion: "Object Dimensioner Camera",
        ubicacion: "Packing 2",
        estadoEquipo: "operativa",
        clienteId: ocasa.id,
        fechaCompra: daysFromNow(-120),
      },
    }),
    prisma.maquina.create({
      data: {
        catalogoId: catLs.id,
        numeroSerie: "LS1000-2022-004",
        descripcion: "Unidad en revisión de cámara",
        ubicacion: "Muelle 1",
        estadoEquipo: "fuera",
        clienteId: ml.id,
      },
    }),
    prisma.maquina.create({
      data: {
        catalogoId: catOdc.id,
        numeroSerie: "ODC-2024-142",
        descripcion: "Captura de dimensiones y peso",
        ubicacion: "Muelle 3",
        estadoEquipo: "operativa",
        clienteId: andreani.id,
      },
    }),
    prisma.maquina.create({
      data: {
        catalogoId: catPdc.id,
        numeroSerie: "PDC-2024-015",
        descripcion: "Dimensionamiento estático de pallets",
        ubicacion: "Zona A",
        estadoEquipo: "proximo",
        clienteId: ocasa.id,
      },
    }),
  ]);

  for (let i = 0; i < 12; i++) {
    const catalogoId = i % 3 === 0 ? catOdc.id : i % 3 === 1 ? catPdc.id : catLs.id;
    await prisma.maquina.create({
      data: {
        catalogoId,
        numeroSerie: `AGH-EXTRA-${100 + i}`,
        descripcion: "Equipo de flota instalado",
        ubicacion: `Puesto ${i + 1}`,
        estadoEquipo: i === 0 ? "fuera" : i < 3 ? "proximo" : "operativa",
        clienteId: i % 3 === 0 ? ml.id : i % 3 === 1 ? andreani.id : ocasa.id,
      },
    });
  }

  await prisma.mantenimiento.createMany({
    data: [
      {
        maquinaId: maquinas[0].id,
        tipo: "Preventivo",
        titulo: "Service preventivo LS1000",
        descripcion: "Revisión óptica, limpieza de sensores y chequeo de balanza.",
        tecnico: "Carlos Gómez",
        estado: "programado",
        fecha: daysFromNow(7),
        proximo: daysFromNow(7),
        costo: 120000,
      },
      {
        maquinaId: maquinas[1].id,
        tipo: "Calibración",
        titulo: "Calibración volumétrica PDC",
        descripcion: "Calibración con patrones certificados y validación de volumen real.",
        tecnico: "Ana Ruiz",
        estado: "programado",
        fecha: daysFromNow(10),
        proximo: daysFromNow(10),
        costo: 185000,
      },
      {
        maquinaId: maquinas[2].id,
        tipo: "Preventivo",
        titulo: "Mantenimiento ODC packing",
        descripcion: "Update Voxel y prueba de captura de código de barras.",
        tecnico: "Luis Fernández",
        estado: "programado",
        fecha: daysFromNow(14),
        proximo: daysFromNow(14),
        costo: 95000,
      },
      {
        maquinaId: maquinas[4].id,
        tipo: "Correctivo",
        titulo: "Mantenimiento completado",
        descripcion: "Realineación de cámara y limpieza óptica finalizada.",
        tecnico: "Ana Ruiz",
        estado: "completado",
        fecha: daysFromNow(-1),
        costo: 65000,
        piezas: "Kit limpieza óptica",
      },
      {
        maquinaId: maquinas[3].id,
        tipo: "Correctivo",
        titulo: "Alerta generada — cámara offline",
        descripcion: "Equipo fuera de servicio por falla de captura. Pendiente repuesto óptico.",
        tecnico: "Carlos Gómez",
        estado: "en_curso",
        fecha: new Date(),
        costo: null,
      },
      {
        maquinaId: maquinas[5].id,
        tipo: "Preventivo",
        titulo: "Mantenimiento programado PDC",
        descripcion: "Service trimestral programado en zona A.",
        tecnico: "Luis Fernández",
        estado: "programado",
        fecha: daysFromNow(5),
        proximo: daysFromNow(5),
        costo: 110000,
      },
      {
        maquinaId: maquinas[0].id,
        tipo: "Correctivo",
        titulo: "Repuesto utilizado — sensor IR",
        descripcion: "Se reemplazó sensor IR y se validó la medición.",
        tecnico: "Carlos Gómez",
        estado: "completado",
        fecha: daysFromNow(-2),
        piezas: "Sensor IR AGH-S12",
        costo: 78000,
      },
    ],
  });

  await prisma.usuario.createMany({
    data: [
      {
        email: "micaela@agh.com",
        nombre: "Micaela",
        rol: "admin",
        passwordHash: await bcrypt.hash("admin123", 10),
      },
      {
        email: "cliente@mercadolibre.com",
        nombre: "Operaciones ML",
        rol: "cliente",
        clienteId: ml.id,
        passwordHash: await bcrypt.hash("cliente123", 10),
      },
    ],
  });

  console.log("Seed AGH CENTRAL listo:", {
    catalogo: 3,
    maquinas: await prisma.maquina.count(),
    admin: "micaela@agh.com / admin123",
    cliente: "cliente@mercadolibre.com / cliente123",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
