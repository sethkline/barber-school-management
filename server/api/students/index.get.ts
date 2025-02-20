// server/api/students/index.get.ts
import { H3Event, getQuery } from 'h3'
import { studentService } from '~/server/services/studentService'

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const { page, limit, search, status } = query

  // Use your service layer to fetch data with pagination, filtering, etc.
  const students = await studentService.getStudents({ page, limit, search, status })
  return students
})
