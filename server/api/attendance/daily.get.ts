import { H3Event, getQuery } from 'h3'
import { attendanceService } from '~/server/services/attendanceService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get date from query parameter, default to today if not provided
    const query = getQuery(event)
    const date = (query.date as string) || new Date().toISOString().split('T')[0]
    
    // Fetch daily attendance with student details
    const attendanceData = await attendanceService.getDailyAttendance(date)
    
    return {
      date,
      students: attendanceData
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})