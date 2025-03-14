import { H3Event, readBody } from 'h3'
import { attendanceService } from '~/server/services/attendanceService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event) as {
      studentId: string,
      date?: string,
      status: 'present' | 'absent' | 'excused',
      reason?: string
    }
    
    if (!body.studentId || !body.status) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Student ID and status are required'
      })
    }
    
    // Use provided date or default to today
    const date = body.date || new Date().toISOString().split('T')[0]
    
    let attendanceRecord
    
    // Call the appropriate service method based on status
    switch (body.status) {
      case 'absent':
        attendanceRecord = await attendanceService.markAbsent(body.studentId, date, body.reason)
        break
      case 'excused':
        attendanceRecord = await attendanceService.markExcused(body.studentId, date, body.reason)
        break
      case 'present':
        // If marked present without clock-in time, just create a record with status
        attendanceRecord = await attendanceService.createAttendance({
          student_id: body.studentId,
          attendance_date: date,
          status: 'present'
        })
        break
      default:
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid status: ${body.status}`
        })
    }
    
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