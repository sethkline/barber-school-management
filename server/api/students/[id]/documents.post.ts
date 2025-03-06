// server/api/students/[id]/documents.post.ts
import { H3Event } from 'h3'
import { studentService } from '~/server/services/studentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const studentId = event.context.params?.id
    const formData = await readBody(event)
    return await studentService.uploadStudentDocument(studentId as string, formData)
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})