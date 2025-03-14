import { H3Event } from 'h3'
import { communicationService } from '~/server/services/communicationsService'
import type { TablesInsert } from '~/types/supabase'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const templateData = await readBody(event) as TablesInsert<'communication_templates'>
    
    // Validate required fields
    if (!templateData.name || !templateData.subject || !templateData.body) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name, subject, and body are required'
      })
    }
    
    const template = await communicationService.createTemplate(templateData)
    return template
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})