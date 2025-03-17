import { getSupabaseClient } from '~/server/utils/supabaseClient'
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from '~/types/supabase'

// Define type aliases for convenience
type StudentHours = Tables<'student_hours'>
type StudentHoursInsert = TablesInsert<'student_hours'>
type StudentHoursUpdate = TablesUpdate<'student_hours'>
type Student = Tables<'students'>

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
  }: ListHoursParams): Promise<{ data: StudentHours[]; count: number }> {
    const supabase = getSupabaseClient()

    // Begin building the query for the "student_hours" table.
    let query = supabase
      .from<StudentHours>('student_hours')
      .select('*, students(first_name, last_name)', { count: 'exact' })

    // Apply a filter by student ID if provided.
    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    // Apply date range filters if provided
    if (startDate) {
      query = query.gte('date_recorded', startDate)
    }
    
    if (endDate) {
      query = query.lte('date_recorded', endDate)
    }

    // Calculate pagination offsets.
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    
    // Order by date (newest first)
    query = query.order('date_recorded', { ascending: false })

    // Execute the query.
    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch hours records: ${error.message}`)
    }

    return { data: data ?? [], count: count ?? 0 }
  },

  /**
   * Retrieve a single hours record by ID.
   */
  async getHoursRecordById(id: string): Promise<StudentHours> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<StudentHours>('student_hours')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to get hours record with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Create a new hours record.
   */
  async createHoursRecord(hoursData: StudentHoursInsert): Promise<StudentHours> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<StudentHours>('student_hours')
      .insert(hoursData)
      .single()

    if (error) {
      throw new Error(`Failed to create hours record: ${error.message}`)
    }
    return data!
  },

  /**
   * Update an existing hours record.
   */
  async updateHoursRecord(id: string, hoursData: StudentHoursUpdate): Promise<StudentHours> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<StudentHours>('student_hours')
      .update(hoursData)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to update hours record with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Delete an hours record.
   */
  async deleteHoursRecord(id: string): Promise<StudentHours> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<StudentHours>('student_hours')
      .delete()
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to delete hours record with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Get a student's total completed hours.
   */
  async getStudentTotalHours(studentId: string): Promise<number> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from<StudentHours>('student_hours')
      .select('hours_completed')
      .eq('student_id', studentId)
    
    if (error) {
      throw new Error(`Failed to get total hours for student ${studentId}: ${error.message}`)
    }
    
    // Calculate total hours
    const totalHours = data?.reduce((sum, record) => sum + (record.hours_completed || 0), 0) || 0
    
    return totalHours
  },

  /**
   * Get a summary of a student's hours progress toward requirements.
   * The default requirement is 1000 hours, but this can be customized per program or student.
   */
  async getStudentHoursSummary(studentId: string, requirementHours: number = 1000): Promise<HoursSummary> {
    const supabase = getSupabaseClient()
    
    // Get all hours records for the student
    const { data, error } = await supabase
      .from<StudentHours>('student_hours')
      .select('hours_completed, date_recorded')
      .eq('student_id', studentId)
      .order('date_recorded', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch hours summary for student ${studentId}: ${error.message}`)
    }
    
    // Calculate total hours
    const totalHours = data?.reduce((sum, record) => sum + (record.hours_completed || 0), 0) || 0
    
    // Get last recorded date
    const lastRecorded = data && data.length > 0 ? data[0].date_recorded : null
    
    // Calculate progress percentage
    const progressPercentage = Math.min(Math.round((totalHours / requirementHours) * 100), 100)
    
    // Determine if requirement has been met
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
    const supabase = getSupabaseClient()
    
    // Build query with optional date range filters
    let query = supabase
      .from<StudentHours>('student_hours')
      .select('date_recorded, hours_completed')
      .eq('student_id', studentId)
    
    if (startDate) {
      query = query.gte('date_recorded', startDate)
    }
    
    if (endDate) {
      query = query.lte('date_recorded', endDate)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(`Failed to fetch monthly hours for student ${studentId}: ${error.message}`)
    }
    
    // Group by month and calculate totals
    const monthlyData: Record<string, number> = {}
    
    data?.forEach(record => {
      if (record.date_recorded && record.hours_completed) {
        // Extract YYYY-MM from the date
        const monthKey = record.date_recorded.substring(0, 7)
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0
        }
        
        monthlyData[monthKey] += record.hours_completed
      }
    })
    
    // Convert to array format for frontend charts
    const result = Object.entries(monthlyData).map(([month, total]) => ({
      month,
      total
    }))
    
    // Sort by month (chronologically)
    result.sort((a, b) => a.month.localeCompare(b.month))
    
    return result
  },

  /**
   * Generate a PDF certificate of hours completion.
   * This is a stub function that would typically integrate with a PDF generation service.
   */
  async generateCompletionCertificate(studentId: string): Promise<{ certificateUrl: string }> {
    // First, verify the student has met the requirements
    const summary = await this.getStudentHoursSummary(studentId)
    
    if (!summary.requirementMet) {
      throw new Error('Hours requirement not met. Unable to generate completion certificate.')
    }
    
    // This is where you would integrate with a PDF generation service
    // For now, we'll just return a mock URL
    
    // In a real implementation, you would:
    // 1. Get student details
    // 2. Generate a PDF with appropriate styling and content
    // 3. Store the PDF in a storage service (S3, Supabase Storage, etc.)
    // 4. Return the URL to the stored PDF
    
    // Mock implementation
    const certificateUrl = `/api/certificates/${studentId}/hours-completion.pdf`
    
    return { certificateUrl }
  },

  /**
   * Get students who have completed their hours requirements.
   */
  async getStudentsWithCompletedHours(requirementHours: number = 1000): Promise<Array<Student & { total_hours: number }>> {
    const supabase = getSupabaseClient()
    
    // This is an approach using a raw SQL query with a JOIN and GROUP BY
    // In production, you might want to create a database view for this
    const { data, error } = await supabase.rpc('get_students_with_completed_hours', {
      requirement: requirementHours
    })
    
    if (error) {
      throw new Error(`Failed to fetch students with completed hours: ${error.message}`)
    }
    
    return data || []
  }
}