import { getSupabaseClient } from '~/server/utils/supabaseClient'
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from '~/types/supabase'

// Define type aliases for convenience
type Certification = Tables<'student_certifications'>
type CertificationInsert = TablesInsert<'student_certifications'>
type CertificationUpdate = TablesUpdate<'student_certifications'>

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
  }: ListCertificationsParams): Promise<{ data: Certification[]; count: number }> {
    const supabase = getSupabaseClient()
    
    // Begin building the query for the "student_certifications" table.
    let query = supabase
      .from('student_certifications')
      .select('*, students(first_name, last_name)', { count: 'exact' })

    // Filter by student ID if provided.
    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    // Filter out expired certifications if required
    if (!includeExpired) {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      query = query.or(`expiration_date.gt.${today},expiration_date.is.null`)
    }

    // Apply a search filter against certification name
    if (search) {
      query = query.ilike('certification_name', `%${search}%`)
    }

    // Calculate pagination offsets.
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Execute the query.
    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch certifications: ${error.message}`)
    }

    return { data: data ?? [], count: count ?? 0 }
  },

  /**
   * Retrieve a single certification by ID.
   */
  async getCertificationById(id: string): Promise<Certification> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('student_certifications')
      .select('*, students(first_name, last_name)')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to get certification with ID ${id}: ${error.message}`)
    }
    return data
  },

  /**
   * Create a new certification record.
   */
  async createCertification(certificationData: CertificationInsert): Promise<Certification> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('student_certifications')
      .insert(certificationData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create certification: ${error.message}`)
    }
    return data
  },

  /**
   * Update an existing certification record.
   */
  async updateCertification(id: string, certificationData: CertificationUpdate): Promise<Certification> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('student_certifications')
      .update(certificationData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update certification with ID ${id}: ${error.message}`)
    }
    return data
  },

  /**
   * Delete a certification record.
   */
  async deleteCertification(id: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('student_certifications')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete certification with ID ${id}: ${error.message}`)
    }
  },

  /**
   * Get certifications that are about to expire within a specified number of days.
   */
  async getExpiringCertifications(daysToExpiration: number = 30): Promise<Certification[]> {
    const supabase = getSupabaseClient()
    
    // Calculate the date range for soon-to-expire certifications
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysToExpiration)
    
    const todayStr = today.toISOString().split('T')[0]
    const futureDateStr = futureDate.toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('student_certifications')
      .select('*, students(first_name, last_name, email)')
      .gte('expiration_date', todayStr)
      .lte('expiration_date', futureDateStr)
    
    if (error) {
      throw new Error(`Failed to get expiring certifications: ${error.message}`)
    }
    
    return data ?? []
  },
  
  /**
   * Send renewal notification for an expiring certification.
   */
  async sendRenewalNotification(studentId: string, certificationId: string): Promise<void> {
    // This would integrate with your communications service
    // For now we'll just implement a stub that logs the action
    console.log(`Sending renewal notification for certification ${certificationId} to student ${studentId}`)
    
    // In a real implementation, you might do something like:
    // 1. Get the certification details and student details
    // 2. Use a communications service to send an email
    // 3. Record that a notification was sent
  }
}