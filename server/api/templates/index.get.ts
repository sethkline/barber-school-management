import { H3Event } from 'h3'
import { communicationService } from '~/server/services/communicationsService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const templates = await communicationService.getTemplates()
    return templates
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})