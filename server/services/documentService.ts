import { getSupabaseClient } from '../utils/supabaseClient'
import { uploadFileToS3, deleteFileFromS3, getPresignedUrl } from '../utils/s3Client'

export interface Document {
  id: string
  student_id: string
  document_name: string
  document_type: string
  s3_key: string
  file_size: number
  uploaded_at: string
  uploaded_by: string
}

export const documentService = {
  async uploadDocument(studentId: string, file: Buffer, fileName: string, fileType: string, fileSize: number, uploadedBy: string) {
    const supabase = getSupabaseClient()

    // Generate unique S3 key
    const timestamp = Date.now()
    const s3Key = `students/${studentId}/${timestamp}-${fileName}`

    // Upload to S3
    await uploadFileToS3(file, s3Key, fileType)

    // Store metadata in Supabase
    const { data, error } = await supabase
      .from('documents')
      .insert({
        student_id: studentId,
        document_name: fileName,
        document_type: fileType,
        s3_key: s3Key,
        file_size: fileSize,
        uploaded_by: uploadedBy,
      })
      .select()
      .single()

    if (error) {
      // Cleanup S3 if database insert fails
      await deleteFileFromS3(s3Key)
      throw error
    }

    return data
  },

  async getDocumentsByStudentId(studentId: string) {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('student_id', studentId)
      .order('uploaded_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getDocumentById(documentId: string) {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error) throw error
    return data
  },

  async getDocumentDownloadUrl(documentId: string) {
    const document = await this.getDocumentById(documentId)
    return await getPresignedUrl(document.s3_key)
  },

  async deleteDocument(documentId: string) {
    const supabase = getSupabaseClient()

    // Get document info
    const document = await this.getDocumentById(documentId)

    // Delete from S3
    await deleteFileFromS3(document.s3_key)

    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) throw error

    return { success: true }
  },
}
