import { getSupabaseClient } from '~/server/utils/supabaseClient'
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from '~/types/supabase'

// Define type aliases for convenience
type Assessment = Tables<'assessments'>
type AssessmentInsert = TablesInsert<'assessments'>
type AssessmentUpdate = TablesUpdate<'assessments'>
type Student = Tables<'students'>

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
   * Retrieve a paginated list of assessments, with optional filtering.
   */
  async getAssessments({
    page = 1,
    limit = 10,
    studentId = '',
    assessmentType = '',
    startDate = '',
    endDate = ''
  }: ListAssessmentsParams): Promise<{ data: Assessment[]; count: number }> {
    const supabase = getSupabaseClient()

    // Begin building the query for the "assessments" table.
    let query = supabase
      .from<Assessment>('assessments')
      .select('*', { count: 'exact' })

    // Apply filters if provided
    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType)
    }

    if (startDate) {
      query = query.gte('assessment_date', startDate)
    }

    if (endDate) {
      query = query.lte('assessment_date', endDate)
    }

    // Calculate pagination offsets.
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    
    // Order by assessment date, most recent first
    query = query.order('assessment_date', { ascending: false })

    // Execute the query.
    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch assessments: ${error.message}`)
    }

    return { data: data ?? [], count: count ?? 0 }
  },

  /**
   * Retrieve a single assessment by ID.
   */
  async getAssessmentById(id: string): Promise<Assessment> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Assessment>('assessments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to get assessment with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Create a new assessment record.
   */
  async createAssessment(assessmentData: AssessmentInsert): Promise<Assessment> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Assessment>('assessments')
      .insert(assessmentData)
      .single()

    if (error) {
      throw new Error(`Failed to create assessment: ${error.message}`)
    }
    return data!
  },

  /**
   * Update an existing assessment record.
   */
  async updateAssessment(id: string, assessmentData: AssessmentUpdate): Promise<Assessment> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Assessment>('assessments')
      .update(assessmentData)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to update assessment with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Delete an assessment record.
   */
  async deleteAssessment(id: string): Promise<Assessment> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Assessment>('assessments')
      .delete()
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to delete assessment with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Get a student's progress over time for a specific assessment type
   */
  async getStudentProgress(studentId: string, assessmentType?: string): Promise<Assessment[]> {
    const supabase = getSupabaseClient()
    
    let query = supabase
      .from<Assessment>('assessments')
      .select('*')
      .eq('student_id', studentId)
      .order('assessment_date', { ascending: true })
    
    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(`Failed to get progress for student ${studentId}: ${error.message}`)
    }
    
    return data ?? []
  },
  
  /**
   * Get average scores across all students for an assessment type
   */
  async getAverageScores(assessmentType: string): Promise<{ average: number, count: number }> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from<Assessment>('assessments')
      .select('score')
      .eq('assessment_type', assessmentType)
      .not('score', 'is', null)
    
    if (error) {
      throw new Error(`Failed to calculate average scores: ${error.message}`)
    }
    
    if (!data || data.length === 0) {
      return { average: 0, count: 0 }
    }
    
    const sum = data.reduce((acc, assessment) => acc + (assessment.score || 0), 0)
    return { 
      average: sum / data.length, 
      count: data.length 
    }
  },
  
  /**
   * Get list of all assessment types currently in use
   */
  async getAssessmentTypes(): Promise<string[]> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from<Assessment>('assessments')
      .select('assessment_type')
      .not('assessment_type', 'is', null)
    
    if (error) {
      throw new Error(`Failed to get assessment types: ${error.message}`)
    }
    
    // Extract unique assessment types
    const types = new Set<string>()
    data?.forEach(assessment => {
      if (assessment.assessment_type) {
        types.add(assessment.assessment_type)
      }
    })
    
    return Array.from(types)
  }
}