import { H3Event, defineEventHandler } from 'h3'
import { hoursService } from '~/server/services/hoursService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const studentId = event.context.params?.studentId
    
    if (!studentId) {
      return createError({
        statusCode: 400,
        statusMessage: 'Student ID is required'
      })
    }
    
    const query = getQuery(event)
    const startDate = query.startDate as string
    const endDate = query.endDate as string
    
    const result = await hoursService.getStudentMonthlyHours(
      studentId,
      startDate,
      endDate
    )
    
    return result
  } catch (error: any) {
    return createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }
})