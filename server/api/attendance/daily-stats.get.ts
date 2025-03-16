import { H3Event, getQuery } from 'h3'
import { attendanceService } from '~/server/services/attendanceService'

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
    
    // Calculate date range
    const start = new Date(startDate)
    const end = new Date(endDate)
    const dayCount = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    // Create array to store daily attendance counts
    const dailyStats = []
    
    // For each day in the range, fetch attendance data
    for (let i = 0; i <= dayCount; i++) {
      const currentDate = new Date(start)
      currentDate.setDate(start.getDate() + i)
      
      // Skip weekends
      const day = currentDate.getDay()
      if (day === 0 || day === 6) continue
      
      const dateString = currentDate.toISOString().split('T')[0]
      
      // Fetch daily attendance for this date
      const dailyAttendance = await attendanceService.getDailyAttendance(dateString)
      
      // Count status types
      const present = dailyAttendance.filter(record => record.status === 'present').length
      const absent = dailyAttendance.filter(record => record.status === 'absent').length
      const excused = dailyAttendance.filter(record => record.status === 'excused').length
      
      dailyStats.push({
        date: dateString,
        present,
        absent,
        excused
      })
    }
    
    return dailyStats
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})