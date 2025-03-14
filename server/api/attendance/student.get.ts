import { H3Event, getQuery } from 'h3'
import { attendanceService } from '~/server/services/attendanceService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    const studentId = query.studentId as string
    
    if (!studentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Student ID is required'
      })
    }
    
    // Default date range to current month if not provided
    const today = new Date()
    const startDate = (query.startDate as string) || 
      new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const endDate = (query.endDate as string) || 
      new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
    
    // Get detailed attendance records
    const { data: records } = await attendanceService.getAttendance({
      studentId,
      startDate,
      endDate
    })
    
    // Get attendance summary statistics
    const summary = await attendanceService.getStudentAttendanceSummary(
      studentId,
      startDate,
      endDate
    )
    
    return {
      studentId,
      startDate,
      endDate,
      records,
      summary
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})