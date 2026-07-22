# AGH CENTRAL

Panel de mantenimiento para equipos de [AGH Dimensionadores](https://aghdimensionadores.com/).

## Roles

- **Admin**: dashboard completo, clientes, máquinas, mantenimientos
- **Cliente**: solo sus máquinas, historial de reparaciones y solicitud de soporte

## Cuentas de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | micaela@agh.com | admin123 |
| Cliente | cliente@mercadolibre.com | cliente123 |

## Cómo correrla

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Abrí [http://localhost:3000/login](http://localhost:3000/login).
