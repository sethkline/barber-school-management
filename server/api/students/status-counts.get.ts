// server/api/students/status-counts.ts
import { gte } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import { students } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const period = query.period as string || 'all'

    const db = getDb()
    const now = new Date()

    let conditions = []

    // Apply time period filter if specified
    if (period !== 'all') {
      let startDate: Date

      switch (period) {
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      }

      conditions.push(gte(students.createdAt, startDate))
    }

    const data = conditions.length > 0
      ? await db.select({ id: students.id, status: students.status, createdAt: students.createdAt }).from(students).where(conditions[0])
      : await db.select({ id: students.id, status: students.status, createdAt: students.createdAt }).from(students)

    // Count students by status
    const statusCounts: Record<string, number> = {}
    data.forEach(student => {
      const status = student.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // Convert to expected format
    const result = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }))

    return {
      data: result
    }

  } catch (error: any) {
    console.error('Error fetching student status counts:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch student status counts'
    })
  }
})
