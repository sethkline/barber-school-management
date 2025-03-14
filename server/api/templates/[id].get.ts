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
    
    const template = await communicationService.getTemplateById(id)
    return template
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})