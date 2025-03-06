// server/api/students/index.post.ts
import { H3Event } from 'h3'
import { studentService } from '~/server/services/studentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const createData = await readBody(event)
    
    // Remove id if it's null or undefined when creating a new student
    // Supabase will auto-generate the UUID
    if ('id' in createData) {
      delete createData.id
    }

    return await studentService.createStudent(createData)
  } catch (error: any) {
    console.error('Error creating student:', error)
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})