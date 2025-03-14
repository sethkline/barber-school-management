import { H3Event, readBody } from 'h3'
import { attendanceService } from '~/server/services/attendanceService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event) as {
      studentId: string,
      date?: string
    }
    
    if (!body.studentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Student ID is required'
      })
    }
    
    // Use provided date or default to today
    const date = body.date || new Date().toISOString().split('T')[0]
    
    const attendanceRecord = await attendanceService.clockOut(body.studentId, date)
    
    return {
      success: true,
      data: attendanceRecord
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})