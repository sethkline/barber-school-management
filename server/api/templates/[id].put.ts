import { H3Event, readBody } from 'h3'
import { communicationService } from '~/server/services/communicationsService'
import type { TablesUpdate } from '~/types/supabase'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = event.context.params?.id
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template ID is required'
      })
    }
    
    const templateData = await readBody(event) as TablesUpdate<'communication_templates'>
    
    // Validate required fields if provided
    if ((templateData.name !== undefined && !templateData.name) || 
        (templateData.subject !== undefined && !templateData.subject) || 
        (templateData.body !== undefined && !templateData.body)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name, subject, and body cannot be empty if provided'
      })
    }
    
    const template = await communicationService.updateTemplate(id, templateData)
    return template
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})