import { H3Event, defineEventHandler, readBody } from 'h3'
import { certificationService } from '~/server/services/certificationService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = event.context.params?.id
    if (!id) {
      throw new Error('Certification ID is required')
    }
    
    const { studentId } = await readBody(event) as { studentId: string }
    if (!studentId) {
      throw new Error('Student ID is required')
    }
    
    await certificationService.sendRenewalNotification(studentId, id)
    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }
})