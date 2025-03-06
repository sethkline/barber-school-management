// server/api/students/[id].get.ts
import { H3Event } from 'h3'
import { studentService } from '~/server/services/studentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = event.context?.params?.id
    return await studentService.getStudentById(id as string)
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})
