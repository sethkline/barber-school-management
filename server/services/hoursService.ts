// server/services/hoursService.ts
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import {
  studentHours,
  students,
  type StudentHour,
  type NewStudentHour,
  type Student
} from '~/server/db/schema'

export interface ListHoursParams {
  page?: number
  limit?: number
  studentId?: string
  startDate?: string
  endDate?: string
}

export interface HoursSummary {
  totalHours: number
  lastRecorded: string | null
  progressPercentage: number | null
  requirementMet: boolean
  requirementHours: number
}

export const hoursService = {
  /**
   * Retrieve a paginated list of hours records.
   */
  async getHoursRecords({
    page = 1,
    limit = 10,
    studentId = '',
    startDate = '',
    endDate = ''
  }: ListHoursParams): Promise<{ data: any[]; count: number }> {
    const db = getDb()
    const offset = (page - 1) * limit

    const conditions = []
    if (studentId) {
      conditions.push(eq(studentHours.studentId, studentId))
    }
    if (startDate) {
      conditions.push(gte(studentHours.dateRecorded, startDate))
    }
    if (endDate) {
      conditions.push(lte(studentHours.dateRecorded, endDate))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const data = await db
      .select({
        id: studentHours.id,
        studentId: studentHours.studentId,
        hoursCompleted: studentHours.hoursCompleted,
        dateRecorded: studentHours.dateRecorded,
        createdAt: studentHours.createdAt,
        firstName: students.firstName,
        lastName: students.lastName
      })
      .from(studentHours)
      .leftJoin(students, eq(studentHours.studentId, students.id))
      .where(whereClause)
      .orderBy(desc(studentHours.dateRecorded))
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(studentHours)
      .where(whereClause)

    const count = Number(countResult[0]?.count ?? 0)

    const transformedData = data.map(row => ({
      id: row.id,
      student_id: row.studentId,
      hours_completed: row.hoursCompleted,
      date_recorded: row.dateRecorded,
      created_at: row.createdAt,
      students: row.firstName ? {
        first_name: row.firstName,
        last_name: row.lastName
      } : null
    }))

    return { data: transformedData, count }
  },

  /**
   * Retrieve a single hours record by ID.
   */
  async getHoursRecordById(id: string): Promise<StudentHour> {
    const db = getDb()
    const result = await db
      .select()
      .from(studentHours)
      .where(eq(studentHours.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error(`Hours record with ID ${id} not found`)
    }
    return result[0]
  },

  /**
   * Create a new hours record.
   */
  async createHoursRecord(hoursData: NewStudentHour): Promise<StudentHour> {
    const db = getDb()
    const result = await db
      .insert(studentHours)
      .values(hoursData)
      .returning()

    if (!result[0]) {
      throw new Error('Failed to create hours record')
    }
    return result[0]
  },

  /**
   * Update an existing hours record.
   */
  async updateHoursRecord(id: string, hoursData: Partial<NewStudentHour>): Promise<StudentHour> {
    const db = getDb()
    const result = await db
      .update(studentHours)
      .set({ ...hoursData, updatedAt: new Date() })
      .where(eq(studentHours.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to update hours record with ID ${id}`)
    }
    return result[0]
  },

  /**
   * Delete an hours record.
   */
  async deleteHoursRecord(id: string): Promise<StudentHour> {
    const db = getDb()
    const result = await db
      .delete(studentHours)
      .where(eq(studentHours.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to delete hours record with ID ${id}`)
    }
    return result[0]
  },

  /**
   * Get a student's total completed hours.
   */
  async getStudentTotalHours(studentId: string): Promise<number> {
    const db = getDb()

    const data = await db
      .select({ hoursCompleted: studentHours.hoursCompleted })
      .from(studentHours)
      .where(eq(studentHours.studentId, studentId))

    const totalHours = data.reduce((sum, record) => sum + Number(record.hoursCompleted || 0), 0)
    return totalHours
  },

  /**
   * Get a summary of a student's hours progress toward requirements.
   */
  async getStudentHoursSummary(studentId: string, requirementHours: number = 1000): Promise<HoursSummary> {
    const db = getDb()

    const data = await db
      .select({
        hoursCompleted: studentHours.hoursCompleted,
        dateRecorded: studentHours.dateRecorded
      })
      .from(studentHours)
      .where(eq(studentHours.studentId, studentId))
      .orderBy(desc(studentHours.dateRecorded))

    const totalHours = data.reduce((sum, record) => sum + Number(record.hoursCompleted || 0), 0)
    const lastRecorded = data.length > 0 ? data[0].dateRecorded : null
    const progressPercentage = Math.min(Math.round((totalHours / requirementHours) * 100), 100)
    const requirementMet = totalHours >= requirementHours

    return {
      totalHours,
      lastRecorded,
      progressPercentage,
      requirementMet,
      requirementHours
    }
  },

  /**
   * Get monthly hours breakdown for a student within a date range.
   */
  async getStudentMonthlyHours(
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Array<{ month: string; total: number }>> {
    const db = getDb()

    const conditions = [eq(studentHours.studentId, studentId)]
    if (startDate) {
      conditions.push(gte(studentHours.dateRecorded, startDate))
    }
    if (endDate) {
      conditions.push(lte(studentHours.dateRecorded, endDate))
    }

    const data = await db
      .select({
        dateRecorded: studentHours.dateRecorded,
        hoursCompleted: studentHours.hoursCompleted
      })
      .from(studentHours)
      .where(and(...conditions))

    const monthlyData: Record<string, number> = {}

    data.forEach(record => {
      if (record.dateRecorded && record.hoursCompleted) {
        const monthKey = record.dateRecorded.substring(0, 7)
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0
        }
        monthlyData[monthKey] += Number(record.hoursCompleted)
      }
    })

    const result = Object.entries(monthlyData).map(([month, total]) => ({
      month,
      total
    }))

    result.sort((a, b) => a.month.localeCompare(b.month))

    return result
  },

  /**
   * Generate a PDF certificate of hours completion.
   */
  async generateCompletionCertificate(studentId: string): Promise<{ certificateUrl: string }> {
    const summary = await this.getStudentHoursSummary(studentId)

    if (!summary.requirementMet) {
      throw new Error('Hours requirement not met. Unable to generate completion certificate.')
    }

    const certificateUrl = `/api/certificates/${studentId}/hours-completion.pdf`
    return { certificateUrl }
  },

  /**
   * Get students who have completed their hours requirements.
   */
  async getStudentsWithCompletedHours(requirementHours: number = 1000): Promise<Array<Student & { total_hours: number }>> {
    const db = getDb()

    // Get all students with their total hours
    const result = await db
      .select({
        student: students,
        totalHours: sql<number>`COALESCE(SUM(${studentHours.hoursCompleted}), 0)`
      })
      .from(students)
      .leftJoin(studentHours, eq(students.id, studentHours.studentId))
      .groupBy(students.id)
      .having(sql`COALESCE(SUM(${studentHours.hoursCompleted}), 0) >= ${requirementHours}`)

    return result.map(row => ({
      ...row.student,
      total_hours: Number(row.totalHours)
    }))
  }
}
