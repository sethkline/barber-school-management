// server/api/attendance/stats.get.ts
import { H3Event, getQuery } from 'h3'
import { attendanceService } from '~/server/services/attendanceService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    
    // Default date range to current month if not provided
    const today = new Date()
    const startDate = (query.startDate as string) || 
      new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const endDate = (query.endDate as string) || 
      new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
    
    // Get attendance statistics for the date range
    const stats = await attendanceService.getAttendanceStats(startDate, endDate)
    
    return {
      startDate,
      endDate,
      stats
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})