import { H3Event, defineEventHandler, getQuery } from 'h3'
import { certificationService } from '~/server/services/certificationService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    const days = query.days ? parseInt(query.days as string) : 30
    
    return await certificationService.getExpiringCertifications(days)
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }
})