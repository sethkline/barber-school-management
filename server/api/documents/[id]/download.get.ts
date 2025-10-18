import { documentService } from '~/server/services/documentService'

export default defineEventHandler(async (event) => {
  const documentId = getRouterParam(event, 'id')

  if (!documentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Document ID is required',
    })
  }

  try {
    const downloadUrl = await documentService.getDocumentDownloadUrl(documentId)

    return {
      success: true,
      url: downloadUrl,
    }
  } catch (error: any) {
    console.error('Document download error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get download URL',
    })
  }
})
