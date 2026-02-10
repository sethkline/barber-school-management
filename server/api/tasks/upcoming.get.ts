// server/api/tasks/upcoming.ts
import { or, eq, gte, asc, and } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import { tasks } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 5

    const db = getDb()
    const today = new Date()

    const data = await db
      .select()
      .from(tasks)
      .where(
        and(
          or(
            eq(tasks.status, 'pending'),
            eq(tasks.status, 'in_progress')
          ),
          gte(tasks.dueDate, today)
        )
      )
      .orderBy(asc(tasks.dueDate))
      .limit(limit)

    // Determine priority based on due date proximity
    const result = data.map(task => {
      const dueDate = new Date(task.dueDate!)
      const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

      let priority = 'medium'
      if (daysUntilDue <= 1) {
        priority = 'high'
      } else if (daysUntilDue > 7) {
        priority = 'low'
      }

      return {
        ...task,
        priority
      }
    })

    return {
      data: result
    }

  } catch (error: any) {
    console.error('Error fetching upcoming tasks:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch upcoming tasks'
    })
  }
})
