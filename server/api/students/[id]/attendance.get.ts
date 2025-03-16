import { H3Event } from 'h3'
import { attendanceService } from '~/server/services/attendanceService'

export default defineEventHandler(async (event: H3Event) => {
  const studentId = event.context.params.id
  const query = getQuery(event)
  const period = query.period as string || '30days'
  
  try {
    // For a period-based query, we need to calculate the date range
    let startDate, endDate = new Date().toISOString().split('T')[0]
    
    switch(period) {
      case '30days':
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        startDate = thirtyDaysAgo.toISOString().split('T')[0]
        break
      case 'month':
        const firstDayOfMonth = new Date()
        firstDayOfMonth.setDate(1)
        startDate = firstDayOfMonth.toISOString().split('T')[0]
        break
      case 'semester':
        // Assuming a semester is roughly 4 months
        const fourMonthsAgo = new Date()
        fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4)
        startDate = fourMonthsAgo.toISOString().split('T')[0]
        break
      case 'all':
        startDate = undefined
        endDate = undefined
        break
    }
    
    const { data, count } = await attendanceService.getAttendance({
      studentId,
      startDate,
      endDate,
      page: 1,
      limit: 100 // Reasonable limit for a student detail view
    })
    
    return { data, count }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: `Error fetching attendance records: ${error.message}`
    })
  }
})