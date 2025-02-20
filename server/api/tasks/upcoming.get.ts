// server/api/tasks/upcoming.ts
import { getSupabaseClient } from '~/server/utils/supabaseClient'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 5
    
    const supabase = getSupabaseClient()
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`status.eq.pending,status.eq.in_progress`)
      .gte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(limit)
    
    if (error) throw new Error(`Failed to fetch upcoming tasks: ${error.message}`)
    
    // Determine priority based on due date proximity
    const result = data?.map(task => {
      const dueDate = new Date(task.due_date)
      const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      
      let priority = 'medium'
      if (daysUntilDue <= 1) {
        priority = 'high'
      } else if (daysUntilDue > 7) {
        priority = 'low'
      }
      
      return {
        ...task,
        priority
      }
    }) || []
    
    return {
      data: result
    }
    
  } catch (error: any) {
    console.error('Error fetching upcoming tasks:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch upcoming tasks'
    })
  }
})