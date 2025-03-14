import { H3Event } from 'h3'
import { communicationService } from '~/server/services/communicationsService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = event.context.params?.id
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template ID is required'
      })
    }
    
    await communicationService.deleteTemplate(id)
    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})