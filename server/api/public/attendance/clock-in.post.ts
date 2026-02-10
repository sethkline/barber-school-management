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

    // Check if student is already clocked in
    const existingRecords = await db
      .select()
      .from(attendance)
      .where(and(
        eq(attendance.studentId, studentId),
        isNull(attendance.clockOut)
      ))
      .limit(1)

    if (existingRecords.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Student is already clocked in',
      })
    }

    // Create new attendance record
    const today = new Date().toISOString().split('T')[0]
    const [record] = await db
      .insert(attendance)
      .values({
        studentId: studentId,
        attendanceDate: today,
        clockIn: new Date(),
        status: 'present',
      })
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
      message: 'Clocked in successfully',
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
      clockIn: record.clockIn,
    }
  } catch (error: any) {
    console.error('Clock in error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to clock in',
    })
  }
})
