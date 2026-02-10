// server/services/certificationService.ts
import { eq, and, gte, lte, sql, or, isNull, ilike } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import {
  studentCertifications,
  students,
  type StudentCertification,
  type NewStudentCertification
} from '~/server/db/schema'

export interface ListCertificationsParams {
  studentId?: string
  page?: number
  limit?: number
  includeExpired?: boolean
  search?: string
}

export const certificationService = {
  /**
   * Retrieve a paginated list of certifications.
   */
  async getCertifications({
    studentId,
    page = 1,
    limit = 10,
    includeExpired = true,
    search = ''
  }: ListCertificationsParams): Promise<{ data: any[]; count: number }> {
    const db = getDb()
    const offset = (page - 1) * limit

    const conditions = []
    if (studentId) {
      conditions.push(eq(studentCertifications.studentId, studentId))
    }
    if (!includeExpired) {
      const today = new Date().toISOString().split('T')[0]
      conditions.push(
        or(
          gte(studentCertifications.expirationDate, today),
          isNull(studentCertifications.expirationDate)
        )
      )
    }
    if (search) {
      conditions.push(ilike(studentCertifications.certificationName, `%${search}%`))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get certifications with student info
    const data = await db
      .select({
        id: studentCertifications.id,
        studentId: studentCertifications.studentId,
        certificationName: studentCertifications.certificationName,
        awardedDate: studentCertifications.awardedDate,
        expirationDate: studentCertifications.expirationDate,
        createdAt: studentCertifications.createdAt,
        firstName: students.firstName,
        lastName: students.lastName
      })
      .from(studentCertifications)
      .leftJoin(students, eq(studentCertifications.studentId, students.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(studentCertifications)
      .where(whereClause)

    const count = Number(countResult[0]?.count ?? 0)

    // Transform data to include student info nested
    const transformedData = data.map(row => ({
      id: row.id,
      student_id: row.studentId,
      certification_name: row.certificationName,
      awarded_date: row.awardedDate,
      expiration_date: row.expirationDate,
      created_at: row.createdAt,
      students: row.firstName ? {
        first_name: row.firstName,
        last_name: row.lastName
      } : null
    }))

    return { data: transformedData, count }
  },

  /**
   * Retrieve a single certification by ID.
   */
  async getCertificationById(id: string): Promise<any> {
    const db = getDb()
    const result = await db
      .select({
        id: studentCertifications.id,
        studentId: studentCertifications.studentId,
        certificationName: studentCertifications.certificationName,
        awardedDate: studentCertifications.awardedDate,
        expirationDate: studentCertifications.expirationDate,
        createdAt: studentCertifications.createdAt,
        firstName: students.firstName,
        lastName: students.lastName
      })
      .from(studentCertifications)
      .leftJoin(students, eq(studentCertifications.studentId, students.id))
      .where(eq(studentCertifications.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error(`Certification with ID ${id} not found`)
    }

    const row = result[0]
    return {
      id: row.id,
      student_id: row.studentId,
      certification_name: row.certificationName,
      awarded_date: row.awardedDate,
      expiration_date: row.expirationDate,
      created_at: row.createdAt,
      students: row.firstName ? {
        first_name: row.firstName,
        last_name: row.lastName
      } : null
    }
  },

  /**
   * Create a new certification record.
   */
  async createCertification(certificationData: NewStudentCertification): Promise<StudentCertification> {
    const db = getDb()
    const result = await db
      .insert(studentCertifications)
      .values(certificationData)
      .returning()

    if (!result[0]) {
      throw new Error('Failed to create certification')
    }
    return result[0]
  },

  /**
   * Update an existing certification record.
   */
  async updateCertification(id: string, certificationData: Partial<NewStudentCertification>): Promise<StudentCertification> {
    const db = getDb()
    const result = await db
      .update(studentCertifications)
      .set({ ...certificationData, updatedAt: new Date() })
      .where(eq(studentCertifications.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to update certification with ID ${id}`)
    }
    return result[0]
  },

  /**
   * Delete a certification record.
   */
  async deleteCertification(id: string): Promise<void> {
    const db = getDb()
    await db.delete(studentCertifications).where(eq(studentCertifications.id, id))
  },

  /**
   * Get certifications that are about to expire within a specified number of days.
   */
  async getExpiringCertifications(daysToExpiration: number = 30): Promise<any[]> {
    const db = getDb()

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysToExpiration)

    const todayStr = today.toISOString().split('T')[0]
    const futureDateStr = futureDate.toISOString().split('T')[0]

    const data = await db
      .select({
        id: studentCertifications.id,
        studentId: studentCertifications.studentId,
        certificationName: studentCertifications.certificationName,
        awardedDate: studentCertifications.awardedDate,
        expirationDate: studentCertifications.expirationDate,
        firstName: students.firstName,
        lastName: students.lastName,
        email: students.email
      })
      .from(studentCertifications)
      .leftJoin(students, eq(studentCertifications.studentId, students.id))
      .where(
        and(
          gte(studentCertifications.expirationDate, todayStr),
          lte(studentCertifications.expirationDate, futureDateStr)
        )
      )

    return data.map(row => ({
      id: row.id,
      student_id: row.studentId,
      certification_name: row.certificationName,
      awarded_date: row.awardedDate,
      expiration_date: row.expirationDate,
      students: {
        first_name: row.firstName,
        last_name: row.lastName,
        email: row.email
      }
    }))
  },

  /**
   * Send renewal notification for an expiring certification.
   */
  async sendRenewalNotification(studentId: string, certificationId: string): Promise<void> {
    console.log(`Sending renewal notification for certification ${certificationId} to student ${studentId}`)
  }
}
