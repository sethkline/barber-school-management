import { H3Event, defineEventHandler, getQuery } from 'h3'
import { certificationService, ListCertificationsParams } from '~/server/services/certificationService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    const params: ListCertificationsParams = {
      studentId: query.studentId as string || undefined,
      page: query.page ? parseInt(query.page as string) : 1,
      limit: query.limit ? parseInt(query.limit as string) : 10,
      includeExpired: query.includeExpired ? (query.includeExpired === 'true') : true,
      search: query.search as string || ''
    }
    
    return await certificationService.getCertifications(params)
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }
})