// server/services/studentService.ts
import { eq, ilike, or, sql, and } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import {
  students,
  studentDocuments,
  legacyStudents,
  type Student,
  type NewStudent,
  type StudentDocument,
  type NewStudentDocument
} from '~/server/db/schema'

export interface ListStudentsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export const studentService = {
  /**
   * Retrieve a paginated list of students.
   */
  async getStudents({
    page = 1,
    limit = 10,
    search = '',
    status = ''
  }: ListStudentsParams): Promise<{ data: Student[]; count: number }> {
    const db = getDb()
    const offset = (page - 1) * limit

    // Build where conditions
    const conditions = []
    if (status) {
      conditions.push(eq(students.status, status))
    }
    if (search) {
      conditions.push(
        or(
          ilike(students.firstName, `%${search}%`),
          ilike(students.lastName, `%${search}%`),
          ilike(students.email, `%${search}%`)
        )
      )
    }

    // Get data with pagination
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const data = await db
      .select()
      .from(students)
      .where(whereClause)
      .limit(limit)
      .offset(offset)

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(whereClause)

    const count = Number(countResult[0]?.count ?? 0)

    return { data, count }
  },

  /**
   * Retrieve a single student by ID.
   */
  async getStudentById(id: string): Promise<Student> {
    const db = getDb()
    const result = await db
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error(`Student with ID ${id} not found`)
    }
    return result[0]
  },

  /**
   * Create a new student record.
   */
  async createStudent(studentData: NewStudent): Promise<Student> {
    const db = getDb()
    const result = await db
      .insert(students)
      .values(studentData)
      .returning()

    if (!result[0]) {
      throw new Error('Failed to create student')
    }
    return result[0]
  },

  /**
   * Update an existing student record.
   */
  async updateStudent(id: string, studentData: Partial<NewStudent>): Promise<Student> {
    const db = getDb()
    const result = await db
      .update(students)
      .set({ ...studentData, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to update student with ID ${id}`)
    }
    return result[0]
  },

  /**
   * Delete a student record.
   */
  async deleteStudent(id: string): Promise<Student> {
    const db = getDb()
    const result = await db
      .delete(students)
      .where(eq(students.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to delete student with ID ${id}`)
    }
    return result[0]
  },

  /**
   * List all documents for a given student.
   */
  async listStudentDocuments(studentId: string): Promise<StudentDocument[]> {
    const db = getDb()
    return db
      .select()
      .from(studentDocuments)
      .where(eq(studentDocuments.studentId, studentId))
  },

  /**
   * Upload a new document for a student.
   */
  async uploadStudentDocument(studentId: string, documentData: NewStudentDocument): Promise<StudentDocument> {
    const db = getDb()
    const result = await db
      .insert(studentDocuments)
      .values({ ...documentData, studentId })
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to upload document for student ${studentId}`)
    }
    return result[0]
  },

  /**
   * Remove a specific student document.
   */
  async removeStudentDocument(studentId: string, documentId: string): Promise<StudentDocument> {
    const db = getDb()
    const result = await db
      .delete(studentDocuments)
      .where(
        and(
          eq(studentDocuments.id, documentId),
          eq(studentDocuments.studentId, studentId)
        )
      )
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to delete document ${documentId} for student ${studentId}`)
    }
    return result[0]
  },

  /**
   * Archive a student by moving them to legacy_students table
   */
  async archiveStudent(id: string, studentData: Student): Promise<void> {
    const db = getDb()

    // Insert into legacy_students
    await db.insert(legacyStudents).values({
      originalStudentId: id,
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      email: studentData.email,
      phone: studentData.phone,
      address: studentData.address,
      city: studentData.city,
      zipCode: studentData.zipCode,
      enrollmentDate: studentData.enrollmentDate,
      graduationDate: studentData.expectedGraduationDate,
      notes: `Archived at ${new Date().toISOString()}`,
      archivedAt: new Date()
    })

    // Delete from active students
    await db.delete(students).where(eq(students.id, id))
  }
}
