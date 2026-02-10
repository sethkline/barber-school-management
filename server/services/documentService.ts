import { eq, desc } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import { studentDocuments } from '~/server/db/schema'
import { uploadFileToS3, deleteFileFromS3, getPresignedUrl } from '../utils/s3Client'

export interface Document {
  id: string
  student_id: string
  document_name: string
  file_url: string
  expiration_date: string | null
  uploaded_at: string
}

export const documentService = {
  async uploadDocument(studentId: string, file: Buffer, fileName: string, fileType: string, fileSize: number, uploadedBy: string) {
    const db = getDb()

    // Generate unique S3 key
    const timestamp = Date.now()
    const s3Key = `students/${studentId}/${timestamp}-${fileName}`

    // Upload to S3
    await uploadFileToS3(file, s3Key, fileType)

    // Store metadata in database
    const [record] = await db
      .insert(studentDocuments)
      .values({
        studentId: studentId,
        documentName: fileName,
        fileUrl: s3Key,
      })
      .returning()

    if (!record) {
      // Cleanup S3 if database insert fails
      await deleteFileFromS3(s3Key)
      throw new Error('Failed to save document metadata')
    }

    return record
  },

  async getDocumentsByStudentId(studentId: string) {
    const db = getDb()

    const data = await db
      .select()
      .from(studentDocuments)
      .where(eq(studentDocuments.studentId, studentId))
      .orderBy(desc(studentDocuments.uploadedAt))

    return data
  },

  async getDocumentById(documentId: string) {
    const db = getDb()

    const records = await db
      .select()
      .from(studentDocuments)
      .where(eq(studentDocuments.id, documentId))
      .limit(1)

    if (records.length === 0) throw new Error('Document not found')
    return records[0]
  },

  async getDocumentDownloadUrl(documentId: string) {
    const document = await this.getDocumentById(documentId)
    return await getPresignedUrl(document.fileUrl!)
  },

  async deleteDocument(documentId: string) {
    const db = getDb()

    // Get document info
    const document = await this.getDocumentById(documentId)

    // Delete from S3
    await deleteFileFromS3(document.fileUrl!)

    // Delete from database
    await db
      .delete(studentDocuments)
      .where(eq(studentDocuments.id, documentId))

    return { success: true }
  },
}
