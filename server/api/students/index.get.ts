// server/api/students/index.get.ts
import { H3Event } from 'h3'
import { studentService } from '~/server/services/studentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = getQuery(event)
    return await studentService.getStudents({
      page: Number(page),
      limit: Number(limit),
      search: String(search),
      status: String(status)
    })
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})