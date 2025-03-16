import { H3Event, defineEventHandler, readBody } from 'h3'
import { certificationService } from '~/server/services/certificationService'
import type { TablesInsert } from '~/types/supabase'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const certificationData = await readBody(event) as TablesInsert<'student_certifications'>
    return await certificationService.createCertification(certificationData)
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }
})