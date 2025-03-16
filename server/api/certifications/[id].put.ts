import { H3Event, defineEventHandler, readBody } from 'h3'
import { certificationService } from '~/server/services/certificationService'
import type { TablesUpdate } from '~/types/supabase'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = event.context.params?.id
    if (!id) {
      throw new Error('Certification ID is required')
    }
    
    const certificationData = await readBody(event) as TablesUpdate<'student_certifications'>
    return await certificationService.updateCertification(id, certificationData)
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }
})