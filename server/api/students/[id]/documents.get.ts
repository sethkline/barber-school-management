// server/api/students/[id]/documents.get.ts
import { documentService } from '~/server/services/documentService'

export default defineEventHandler(async (event) => {
  const studentId = getRouterParam(event, 'id')

  if (!studentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Student ID is required',
    })
  }

  try {
    const documents = await documentService.getDocumentsByStudentId(studentId)
    return documents
  } catch (error: any) {
    console.error('Error fetching documents:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch documents',
    })
  }
})