// server/api/students/recent.ts
import { desc } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import { students } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 5

    const db = getDb()

    const data = await db
      .select()
      .from(students)
      .orderBy(desc(students.createdAt))
      .limit(limit)

    return {
      data: data || []
    }

  } catch (error: any) {
    console.error('Error fetching recent students:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch recent students'
    })
  }
})
