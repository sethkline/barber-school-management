// server/api/students/recent.ts
import { getSupabaseClient } from '~/server/utils/supabaseClient'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 5
    
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw new Error(`Failed to fetch recent students: ${error.message}`)
    
    return {
      data: data || []
    }
    
  } catch (error: any) {
    console.error('Error fetching recent students:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch recent students'
    })
  }
})