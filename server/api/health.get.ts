// Health check endpoint for ALB
import { getDb } from '~/server/utils/db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    // Verify database connection
    const db = getDb()
    await db.execute(sql`SELECT 1`)

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    }
  } catch (error: any) {
    console.error('Health check failed:', error)

    // Return 503 Service Unavailable if DB is down
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      message: `Health check failed: ${error.message}`
    })
  }
})
