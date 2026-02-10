import { eq, and, isNull } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import { attendance } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { studentId } = query

    if (!studentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Student ID is required',
      })
    }

    const db = getDb()

    // Check if student has active clock-in
    const records = await db
      .select({ id: attendance.id, clockIn: attendance.clockIn })
      .from(attendance)
      .where(and(
        eq(attendance.studentId, studentId as string),
        isNull(attendance.clockOut)
      ))
      .limit(1)

    const data = records[0] || null

    return {
      isClockedIn: !!data,
      clockInTime: data?.clockIn || null,
    }
  } catch (error: any) {
    return {
      isClockedIn: false,
      clockInTime: null,
    }
  }
})
