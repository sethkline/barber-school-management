// Database connection utility using Drizzle ORM
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../db/schema'

const { Pool } = pg

let pool: pg.Pool | null = null
let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (db) {
    return db
  }

  const config = useRuntimeConfig()
  const databaseUrl = config.databaseUrl

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  })

  db = drizzle(pool, { schema })
  return db
}

export async function closeDb() {
  if (pool) {
    await pool.end()
    pool = null
    db = null
  }
}

// Export schema for use in services
export { schema }
