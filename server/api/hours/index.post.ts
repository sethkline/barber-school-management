import { H3Event, defineEventHandler, readBody } from 'h3'
import { hoursService } from '~/server/services/hoursService'
import type { TablesInsert } from '~/types/supabase'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event) as TablesInsert<'student_hours'>
    
    // Validate required fields
    if (!body.student_id) {
      return createError({
        statusCode: 400,
        statusMessage: 'Student ID is required'
      })
    }
    
    if (!body.hours_completed || body.hours_completed <= 0) {
      return createError({
        statusCode: 400,
        statusMessage: 'Hours completed must be greater than 0'
      })
    }
    
    // If no date_recorded is provided, use today's date
    if (!body.date_recorded) {
      body.date_recorded = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    }
    
    const result = await hoursService.createHoursRecord(body)
    
    return result
  } catch (error: any) {
    return createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }
})