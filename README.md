# AGH CENTRAL

## Bases de datos

Todo vive en **PostgreSQL** (`DATABASE_URL`):

- Tablas existentes: `clientes`, `maquinas`, `cloud_users` (Voxel Cloud), etc.
- Tablas de esta app: `agh_usuarios` (login). Los arreglos van a `clientes_mantenimientos`.

No uses `prisma db push` sobre esta base: las tablas nuevas se crean con el script de abajo.

```bash
npm install
npm run db:tables
npm run db:seed
npm run dev
```

Login: [http://localhost:3000/login](http://localhost:3000/login)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | micaela@agh.com | admin123 |
| Cliente | cliente@mercadolibre.com | cliente123 |
