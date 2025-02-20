// server/api/students/[id].get.ts
import { H3Event } from 'h3'
import { studentService } from '~/server/services/studentService'

export default defineEventHandler(async (event: H3Event) => {
  // Extract the student ID from the URL parameter
  const { id } = event.context.params
  const student = await studentService.getStudentById(id)
  return student
})
