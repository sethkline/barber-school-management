// server/api/students/[id]/documents.post.ts
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
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file provided',
      })
    }

    const file = formData[0]
    const fileName = file.filename || 'document'
    const fileType = file.type || 'application/octet-stream'
    const fileData = file.data
    const fileSize = fileData.length

    // Get user from context (set by auth middleware)
    const uploadedBy = event.context.user?.id || 'system'

    const document = await documentService.uploadDocument(
      studentId,
      fileData,
      fileName,
      fileType,
      fileSize,
      uploadedBy
    )

    return {
      success: true,
      document,
    }
  } catch (error: any) {
    console.error('Document upload error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to upload document',
    })
  }
})