import { H3Event, readBody, sendError, createError } from 'h3'
import { leadService } from '~/server/services/leadService'
import type { TablesInsert } from '~/types/supabase'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Parse the lead data from the request body
    const leadData = await readBody(event) as TablesInsert<'leads'>
    
    // Create the lead using the lead service
    const lead = await leadService.createLead(leadData)
    
    return { lead }
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 500, 
      statusMessage: error.message 
    }))
  }
})