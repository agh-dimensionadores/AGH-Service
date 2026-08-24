type SqlClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
};

/** Crea la tabla de login de AGH Service sin hacer db push sobre el resto de la base. */
export async function ensureAghTables(client: SqlClient) {
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS agh_usuarios (
      id VARCHAR(40) PRIMARY KEY,
      email VARCHAR(200) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      nombre VARCHAR(150) NOT NULL,
      rol VARCHAR(20) NOT NULL,
      cliente_id INTEGER,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS agh_usuarios_cliente_id_idx
    ON agh_usuarios (cliente_id)
  `);
  await client.$executeRawUnsafe(`DROP TABLE IF EXISTS agh_soporte`);
}
