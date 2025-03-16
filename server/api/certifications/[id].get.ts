import { H3Event, defineEventHandler } from 'h3'
import { certificationService } from '~/server/services/certificationService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = event.context.params?.id
    if (!id) {
      throw new Error('Certification ID is required')
    }
    
    return await certificationService.getCertificationById(id)
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }
})