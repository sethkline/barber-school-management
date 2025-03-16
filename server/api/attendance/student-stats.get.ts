import { H3Event, getQuery } from 'h3'
import { attendanceService } from '~/server/services/attendanceService'
import { studentService } from '~/server/services/studentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    const startDate = query.startDate as string
    const endDate = query.endDate as string
    
    if (!startDate || !endDate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Start date and end date are required'
      })
    }
    
    // Get all current students
    const { data: students } = await studentService.getStudents({ 
      status: 'current',
      limit: 100 // Increase as needed
    })
    
    // For each student, calculate attendance statistics
    const studentStats = []
    
    for (const student of students) {
      const summary = await attendanceService.getStudentAttendanceSummary(
        student.id,
        startDate,
        endDate
      )
      
      studentStats.push({
        studentId: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        email: student.email,
        presentCount: summary.presentCount,
        absentCount: summary.absentCount,
        excusedCount: summary.excusedCount,
        attendanceRate: Math.round(summary.presentRate),
        totalHours: summary.totalHours
      })
    }
    
    return studentStats
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})