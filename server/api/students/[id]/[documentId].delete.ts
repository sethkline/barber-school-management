// server/api/students/[id]/documents/[documentId].delete.ts
import { H3Event } from 'h3'
import { studentService } from '~/server/services/studentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const { id: studentId, documentId } = event.context.params
    return await studentService.removeStudentDocument(studentId, documentId)
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})