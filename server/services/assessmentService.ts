// server/services/assessmentService.ts
import { eq, and, gte, lte, sql, desc, asc, isNotNull } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import {
  assessments,
  type Assessment,
  type NewAssessment
} from '~/server/db/schema'

export interface ListAssessmentsParams {
  page?: number
  limit?: number
  studentId?: string
  assessmentType?: string
  startDate?: string
  endDate?: string
}

export const assessmentService = {
  /**
   * Retrieve a paginated list of assessments.
   */
  async getAssessments({
    page = 1,
    limit = 10,
    studentId = '',
    assessmentType = '',
    startDate = '',
    endDate = ''
  }: ListAssessmentsParams): Promise<{ data: Assessment[]; count: number }> {
    const db = getDb()
    const offset = (page - 1) * limit

    const conditions = []
    if (studentId) {
      conditions.push(eq(assessments.studentId, studentId))
    }
    if (assessmentType) {
      conditions.push(eq(assessments.assessmentType, assessmentType))
    }
    if (startDate) {
      conditions.push(gte(assessments.assessmentDate, startDate))
    }
    if (endDate) {
      conditions.push(lte(assessments.assessmentDate, endDate))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const data = await db
      .select()
      .from(assessments)
      .where(whereClause)
      .orderBy(desc(assessments.assessmentDate))
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(assessments)
      .where(whereClause)

    const count = Number(countResult[0]?.count ?? 0)

    return { data, count }
  },

  /**
   * Retrieve a single assessment by ID.
   */
  async getAssessmentById(id: string): Promise<Assessment> {
    const db = getDb()
    const result = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error(`Assessment with ID ${id} not found`)
    }
    return result[0]
  },

  /**
   * Create a new assessment record.
   */
  async createAssessment(assessmentData: NewAssessment): Promise<Assessment> {
    const db = getDb()
    const result = await db
      .insert(assessments)
      .values(assessmentData)
      .returning()

    if (!result[0]) {
      throw new Error('Failed to create assessment')
    }
    return result[0]
  },

  /**
   * Update an existing assessment record.
   */
  async updateAssessment(id: string, assessmentData: Partial<NewAssessment>): Promise<Assessment> {
    const db = getDb()
    const result = await db
      .update(assessments)
      .set({ ...assessmentData, updatedAt: new Date() })
      .where(eq(assessments.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to update assessment with ID ${id}`)
    }
    return result[0]
  },

  /**
   * Delete an assessment record.
   */
  async deleteAssessment(id: string): Promise<Assessment> {
    const db = getDb()
    const result = await db
      .delete(assessments)
      .where(eq(assessments.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to delete assessment with ID ${id}`)
    }
    return result[0]
  },

  /**
   * Get a student's progress over time for a specific assessment type
   */
  async getStudentProgress(studentId: string, assessmentType?: string): Promise<Assessment[]> {
    const db = getDb()

    const conditions = [eq(assessments.studentId, studentId)]
    if (assessmentType) {
      conditions.push(eq(assessments.assessmentType, assessmentType))
    }

    return db
      .select()
      .from(assessments)
      .where(and(...conditions))
      .orderBy(asc(assessments.assessmentDate))
  },

  /**
   * Get average scores across all students for an assessment type
   */
  async getAverageScores(assessmentType: string): Promise<{ average: number; count: number }> {
    const db = getDb()

    const data = await db
      .select({ score: assessments.score })
      .from(assessments)
      .where(
        and(
          eq(assessments.assessmentType, assessmentType),
          isNotNull(assessments.score)
        )
      )

    if (!data || data.length === 0) {
      return { average: 0, count: 0 }
    }

    const sum = data.reduce((acc, assessment) => acc + Number(assessment.score || 0), 0)
    return {
      average: sum / data.length,
      count: data.length
    }
  },

  /**
   * Get list of all assessment types currently in use
   */
  async getAssessmentTypes(): Promise<string[]> {
    const db = getDb()

    const data = await db
      .select({ assessmentType: assessments.assessmentType })
      .from(assessments)
      .where(isNotNull(assessments.assessmentType))

    const types = new Set<string>()
    data.forEach(assessment => {
      if (assessment.assessmentType) {
        types.add(assessment.assessmentType)
      }
    })

    return Array.from(types)
  }
}
