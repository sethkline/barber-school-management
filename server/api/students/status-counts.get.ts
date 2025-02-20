// server/api/students/status-counts.ts
import { getSupabaseClient } from '~/server/utils/supabaseClient'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const period = query.period as string || 'all'
    
    const supabase = getSupabaseClient()
    let studentsQuery = supabase.from('students').select('id, status, created_at')
    
    // Apply time period filter if specified
    const now = new Date()
    if (period !== 'all') {
      let startDate: Date
      
      switch (period) {
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1) // January 1st of current year
          break
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1) // First day of current quarter
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1) // First day of current month
          break
        default:
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()) // Default to 1 year
      }
      
      studentsQuery = studentsQuery.gte('created_at', startDate.toISOString())
    }
    
    const { data, error } = await studentsQuery
    
    if (error) throw new Error(`Failed to fetch student status data: ${error.message}`)
    
    // Count students by status
    const statusCounts: Record<string, number> = {}
    data?.forEach(student => {
      const status = student.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    
    // Convert to expected format
    const result = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }))
    
    return {
      data: result
    }
    
  } catch (error: any) {
    console.error('Error fetching student status counts:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch student status counts'
    })
  }
})