import { H3Event, readBody } from 'h3'
import { communicationService } from '~/server/services/communicationsService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const emailData = await readBody(event) as {
      to: string
      subject: string
      body: string
      templateId?: string
      recipientType?: 'student' | 'lead'
      recipientId?: string
    }
    
    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.body) {
      throw createError({
        statusCode: 400,
        statusMessage: 'To, subject, and body are required'
      })
    }
    
    const result = await communicationService.sendEmail({
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      templateId: emailData.templateId,
      recipientType: emailData.recipientType,
      recipientId: emailData.recipientId
    })
    
    return result
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})
