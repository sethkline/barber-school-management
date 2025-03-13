import { getSupabaseClient } from '~/server/utils/supabaseClient'
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from '~/types/supabase'

// Define type aliases for convenience
type Lead = Tables<'leads'>
type LeadInsert = TablesInsert<'leads'>
type LeadUpdate = TablesUpdate<'leads'>

export interface ListLeadsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  fromDate?: string
  toDate?: string
}

export const leadService = {
  /**
   * Retrieve a paginated list of leads.
   */
  async getLeads({
    page = 1,
    limit = 10,
    search = '',
    status = '',
    fromDate = '',
    toDate = ''
  }: ListLeadsParams): Promise<{ data: Lead[]; count: number }> {
    const supabase = getSupabaseClient()

    // Begin building the query for the "leads" table.
    let query = supabase
      .from<Lead>('leads')
      .select('*', { count: 'exact' })

    // Apply a filter by status if provided.
    if (status) {
      query = query.eq('status', status)
    }

    // Apply date range filters if provided
    if (fromDate) {
      query = query.gte('created_at', fromDate)
    }
    
    if (toDate) {
      query = query.lte('created_at', toDate)
    }

    // Apply a search filter against first_name, last_name, or email.
    if (search) {
      // Using the OR filter with ilike to match patterns
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    // Calculate pagination offsets.
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    
    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false })

    // Execute the query.
    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch leads: ${error.message}`)
    }

    return { data: data ?? [], count: count ?? 0 }
  },

  /**
   * Retrieve a single lead by ID.
   */
  async getLeadById(id: string): Promise<Lead> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Lead>('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to get lead with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Create a new lead record.
   */
  async createLead(leadData: LeadInsert): Promise<Lead> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Lead>('leads')
      .insert(leadData)
      .single()

    if (error) {
      throw new Error(`Failed to create lead: ${error.message}`)
    }
    return data!
  },

  /**
   * Update an existing lead record.
   */
  async updateLead(id: string, leadData: LeadUpdate): Promise<Lead> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Lead>('leads')
      .update(leadData)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to update lead with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Delete a lead record.
   */
  async deleteLead(id: string): Promise<Lead> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Lead>('leads')
      .delete()
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to delete lead with ID ${id}: ${error.message}`)
    }
    return data!
  },
  
  /**
   * Convert a lead to a student.
   */
  async convertLeadToStudent(id: string): Promise<{ student: Tables<'students'>; lead: Lead }> {
    const supabase = getSupabaseClient()
    
    // First, get the lead data
    const { data: lead, error: leadError } = await supabase
      .from<Lead>('leads')
      .select('*')
      .eq('id', id)
      .single()
      
    if (leadError) {
      throw new Error(`Failed to get lead for conversion: ${leadError.message}`)
    }
    
    // Create a new student record from the lead data
    const studentData = {
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      city: lead.city,
      zip_code: lead.zip_code,
      enrollment_date: new Date().toISOString().split('T')[0], // Today's date
      status: 'new'
    }
    
    // Insert the new student
    const { data: student, error: studentError } = await supabase
      .from<Tables<'students'>>('students')
      .insert(studentData)
      .single()
      
    if (studentError) {
      throw new Error(`Failed to create student from lead: ${studentError.message}`)
    }
    
    // Update the lead status to 'converted'
    const { data: updatedLead, error: updateError } = await supabase
      .from<Lead>('leads')
      .update({ status: 'converted' })
      .eq('id', id)
      .single()
      
    if (updateError) {
      throw new Error(`Failed to update lead status after conversion: ${updateError.message}`)
    }
    
    return { student, lead: updatedLead }
  }
}