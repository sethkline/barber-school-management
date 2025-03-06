// server/api/students/[id].delete.ts
import { H3Event } from 'h3'
import { studentService } from '~/server/services/studentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = event.context.params.id
    const { archive = false } = getQuery(event)
    
    if (archive) {
      // Archive the student instead of deleting
      const studentData = await studentService.getStudentById(id)
      await studentService.archiveStudent(id, studentData)
      return { success: true, message: 'Student archived successfully' }
    }
    
    await studentService.deleteStudent(id)
    return { success: true, message: 'Student deleted successfully' }
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})