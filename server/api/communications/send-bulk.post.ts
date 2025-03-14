import { H3Event, readBody } from 'h3'
import { communicationService } from '~/server/services/communicationsService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const bulkEmailData = await readBody(event) as {
      recipients: Array<{
        to: string
        recipientType?: 'student' | 'lead'
        recipientId?: string
        variables?: Record<string, string>
      }>
      templateId: string
    }
    
    // Validate required fields
    if (!bulkEmailData.recipients || !bulkEmailData.recipients.length || !bulkEmailData.templateId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Recipients and templateId are required'
      })
    }
    
    const results = await communicationService.sendBulkEmails({
      recipients: bulkEmailData.recipients,
      templateId: bulkEmailData.templateId
    })
    
    return results
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})