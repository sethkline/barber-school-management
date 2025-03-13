import { H3Event, readBody, sendError, createError } from 'h3'
import { leadService } from '~/server/services/leadService'
import type { TablesUpdate } from '~/types/supabase'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get the lead ID from the URL params
    const id = event.context.params?.id
    
    if (!id) {
      return sendError(event, createError({ 
        statusCode: 400, 
        statusMessage: 'Lead ID is required' 
      }))
    }
    
    // Parse the lead data from the request body
    const leadData = await readBody(event) as TablesUpdate<'leads'>
    
    // Update the lead using the lead service
    const lead = await leadService.updateLead(id, leadData)
    
    return { lead }
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 500, 
      statusMessage: error.message 
    }))
  }
})