// server/api/students/[id].put.ts
import { H3Event } from 'h3'
import { studentService } from '~/server/services/studentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = event.context.params?.id
    const updateData = await readBody(event)
    return await studentService.updateStudent(id as string, updateData)
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})