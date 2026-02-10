import { eq, and, isNull } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import { attendance, students } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { studentId } = body

    if (!studentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Student ID is required',
      })
    }

    const db = getDb()

    // Find active clock-in record
    const existingRecords = await db
      .select()
      .from(attendance)
      .where(and(
        eq(attendance.studentId, studentId),
        isNull(attendance.clockOut)
      ))
      .limit(1)

    if (existingRecords.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No active clock-in found',
      })
    }

    const existingRecord = existingRecords[0]

    // Update with clock out time
    const [updated] = await db
      .update(attendance)
      .set({ clockOut: new Date() })
      .where(eq(attendance.id, existingRecord.id))
      .returning()

    // Get student name for confirmation
    const studentRecords = await db
      .select({ firstName: students.firstName, lastName: students.lastName })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1)

    const student = studentRecords[0]

    return {
      success: true,
      message: 'Clocked out successfully',
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
      clockOut: updated.clockOut,
    }
  } catch (error: any) {
    console.error('Clock out error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to clock out',
    })
  }
})
