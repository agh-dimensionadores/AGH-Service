# AGH CENTRAL

## Bases de datos

- **PostgreSQL** (`DATABASE_URL`): solo la tabla existente `clientes` — no se crean tablas nuevas ahí.
- **SQLite** (`DATABASE_URL_SQLITE`): máquinas, usuarios, mantenimientos, soporte.

```bash
npm install
npm run db:generate
npx prisma db push
npm run db:seed
npm run dev
```

Login: [http://localhost:3000/login](http://localhost:3000/login)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | micaela@agh.com | admin123 |
| Cliente | cliente@mercadolibre.com | cliente123 |
