import { eq, asc } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import { students } from '~/server/db/schema'

// Public endpoint - no auth required
export default defineEventHandler(async (event) => {
  try {
    const db = getDb()

    // Get all active students for the dropdown
    const data = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        photoUrl: students.photoUrl,
        status: students.status
      })
      .from(students)
      .where(eq(students.status, 'active'))
      .orderBy(asc(students.lastName))

    return data.map(student => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      imageUrl: student.photoUrl,
    }))
  } catch (error: any) {
    console.error('Error fetching students:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch students',
    })
  }
})
