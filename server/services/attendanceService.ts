// server/services/attendanceService.ts
import { eq, and, gte, lte, sql, desc, asc } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import {
  attendance,
  students,
  type Attendance,
  type NewAttendance
} from '~/server/db/schema'

export interface ListAttendanceParams {
  date?: string
  studentId?: string
  page?: number
  limit?: number
  status?: string
  startDate?: string
  endDate?: string
}

export const attendanceService = {
  /**
   * Retrieve attendance records with optional filtering.
   */
  async getAttendance({
    date,
    studentId,
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate
  }: ListAttendanceParams): Promise<{ data: Attendance[]; count: number }> {
    const db = getDb()
    const offset = (page - 1) * limit

    const conditions = []
    if (date) {
      conditions.push(eq(attendance.attendanceDate, date))
    }
    if (studentId) {
      conditions.push(eq(attendance.studentId, studentId))
    }
    if (status) {
      conditions.push(eq(attendance.status, status))
    }
    if (startDate) {
      conditions.push(gte(attendance.attendanceDate, startDate))
    }
    if (endDate) {
      conditions.push(lte(attendance.attendanceDate, endDate))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const data = await db
      .select()
      .from(attendance)
      .where(whereClause)
      .orderBy(desc(attendance.attendanceDate), asc(attendance.clockIn))
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(whereClause)

    const count = Number(countResult[0]?.count ?? 0)

    return { data, count }
  },

  /**
   * Retrieve a single attendance record by ID.
   */
  async getAttendanceById(id: string): Promise<Attendance> {
    const db = getDb()
    const result = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error(`Attendance record with ID ${id} not found`)
    }
    return result[0]
  },

  /**
   * Create a new attendance record.
   */
  async createAttendance(attendanceData: NewAttendance): Promise<Attendance> {
    const db = getDb()
    const result = await db
      .insert(attendance)
      .values(attendanceData)
      .returning()

    if (!result[0]) {
      throw new Error('Failed to create attendance record')
    }
    return result[0]
  },

  /**
   * Update an existing attendance record.
   */
  async updateAttendance(id: string, attendanceData: Partial<NewAttendance>): Promise<Attendance> {
    const db = getDb()
    const result = await db
      .update(attendance)
      .set({ ...attendanceData, updatedAt: new Date() })
      .where(eq(attendance.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to update attendance record with ID ${id}`)
    }
    return result[0]
  },

  /**
   * Delete an attendance record.
   */
  async deleteAttendance(id: string): Promise<Attendance> {
    const db = getDb()
    const result = await db
      .delete(attendance)
      .where(eq(attendance.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to delete attendance record with ID ${id}`)
    }
    return result[0]
  },

  /**
   * Clock in a student.
   */
  async clockIn(studentId: string, attendanceDate: string): Promise<Attendance> {
    const db = getDb()

    // Check if there's already an attendance record for this student and date
    const existing = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, studentId),
          eq(attendance.attendanceDate, attendanceDate)
        )
      )
      .limit(1)

    if (existing[0]) {
      // Update existing record
      const result = await db
        .update(attendance)
        .set({
          clockIn: new Date(),
          status: 'present',
          updatedAt: new Date()
        })
        .where(eq(attendance.id, existing[0].id))
        .returning()

      if (!result[0]) {
        throw new Error('Failed to clock in student')
      }
      return result[0]
    }

    // Create new record
    const result = await db
      .insert(attendance)
      .values({
        studentId,
        attendanceDate,
        clockIn: new Date(),
        status: 'present'
      })
      .returning()

    if (!result[0]) {
      throw new Error('Failed to clock in student')
    }
    return result[0]
  },

  /**
   * Clock out a student.
   */
  async clockOut(studentId: string, attendanceDate: string): Promise<Attendance> {
    const db = getDb()

    const existing = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, studentId),
          eq(attendance.attendanceDate, attendanceDate)
        )
      )
      .limit(1)

    if (!existing[0]) {
      throw new Error('No attendance record found for clocking out')
    }

    const result = await db
      .update(attendance)
      .set({
        clockOut: new Date(),
        updatedAt: new Date()
      })
      .where(eq(attendance.id, existing[0].id))
      .returning()

    if (!result[0]) {
      throw new Error('Failed to clock out student')
    }
    return result[0]
  },

  /**
   * Mark a student as absent.
   */
  async markAbsent(studentId: string, attendanceDate: string): Promise<Attendance> {
    const db = getDb()

    const existing = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, studentId),
          eq(attendance.attendanceDate, attendanceDate)
        )
      )
      .limit(1)

    if (existing[0]) {
      const result = await db
        .update(attendance)
        .set({ status: 'absent', updatedAt: new Date() })
        .where(eq(attendance.id, existing[0].id))
        .returning()

      if (!result[0]) {
        throw new Error('Failed to mark student as absent')
      }
      return result[0]
    }

    const result = await db
      .insert(attendance)
      .values({
        studentId,
        attendanceDate,
        status: 'absent'
      })
      .returning()

    if (!result[0]) {
      throw new Error('Failed to mark student as absent')
    }
    return result[0]
  },

  /**
   * Mark a student as excused.
   */
  async markExcused(studentId: string, attendanceDate: string): Promise<Attendance> {
    const db = getDb()

    const existing = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, studentId),
          eq(attendance.attendanceDate, attendanceDate)
        )
      )
      .limit(1)

    if (existing[0]) {
      const result = await db
        .update(attendance)
        .set({ status: 'excused', updatedAt: new Date() })
        .where(eq(attendance.id, existing[0].id))
        .returning()

      if (!result[0]) {
        throw new Error('Failed to mark student as excused')
      }
      return result[0]
    }

    const result = await db
      .insert(attendance)
      .values({
        studentId,
        attendanceDate,
        status: 'excused'
      })
      .returning()

    if (!result[0]) {
      throw new Error('Failed to mark student as excused')
    }
    return result[0]
  },

  /**
   * Get attendance statistics for a date range.
   */
  async getAttendanceStats(startDate: string, endDate: string): Promise<any> {
    const db = getDb()

    const data = await db
      .select()
      .from(attendance)
      .where(
        and(
          gte(attendance.attendanceDate, startDate),
          lte(attendance.attendanceDate, endDate)
        )
      )

    const totalDays = new Set(data.map(record => record.attendanceDate)).size
    const totalRecords = data.length
    const presentCount = data.filter(record => record.status === 'present').length
    const absentCount = data.filter(record => record.status === 'absent').length
    const excusedCount = data.filter(record => record.status === 'excused').length
    const uniqueStudents = new Set(data.map(record => record.studentId)).size

    return {
      totalDays,
      totalRecords,
      presentCount,
      absentCount,
      excusedCount,
      uniqueStudents,
      presentRate: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0
    }
  },

  /**
   * Get attendance records for a specific day with student details.
   */
  async getDailyAttendance(date: string): Promise<any[]> {
    const db = getDb()

    // Get all active students
    const activeStudents = await db
      .select()
      .from(students)
      .where(eq(students.status, 'current'))

    // Get attendance records for the date
    const attendanceRecords = await db
      .select()
      .from(attendance)
      .where(eq(attendance.attendanceDate, date))

    const attendanceMap = new Map(
      attendanceRecords.map(record => [record.studentId, record])
    )

    return activeStudents.map(student => {
      const record = attendanceMap.get(student.id)
      return {
        student_id: student.id,
        first_name: student.firstName,
        last_name: student.lastName,
        email: student.email,
        attendance_id: record?.id || null,
        status: record?.status || 'unmarked',
        clock_in: record?.clockIn || null,
        clock_out: record?.clockOut || null
      }
    })
  },

  /**
   * Get attendance summary for a student.
   */
  async getStudentAttendanceSummary(studentId: string, startDate: string, endDate: string): Promise<any> {
    const db = getDb()

    const data = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, studentId),
          gte(attendance.attendanceDate, startDate),
          lte(attendance.attendanceDate, endDate)
        )
      )

    const totalDays = new Set(data.map(record => record.attendanceDate)).size
    const presentCount = data.filter(record => record.status === 'present').length
    const absentCount = data.filter(record => record.status === 'absent').length
    const excusedCount = data.filter(record => record.status === 'excused').length

    let totalHours = 0
    let daysWithHours = 0

    data.forEach(record => {
      if (record.clockIn && record.clockOut) {
        const clockIn = new Date(record.clockIn)
        const clockOut = new Date(record.clockOut)
        const hoursPresent = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
        if (hoursPresent > 0) {
          totalHours += hoursPresent
          daysWithHours++
        }
      }
    })

    const averageHours = daysWithHours > 0 ? totalHours / daysWithHours : 0

    return {
      totalDays,
      presentCount,
      absentCount,
      excusedCount,
      presentRate: totalDays > 0 ? (presentCount / totalDays) * 100 : 0,
      totalHours,
      averageHours
    }
  }
}
