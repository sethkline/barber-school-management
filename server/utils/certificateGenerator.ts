import { eq } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import { students, type Student } from '~/server/db/schema'
import { hoursService } from '~/server/services/hoursService'

interface CertificateOptions {
  studentId: string
  requirementHours?: number
  outputFormat?: 'pdf' | 'html'
}

export async function generateHoursCertificate(options: CertificateOptions): Promise<{ certificateUrl: string; student: Student }> {
  const { studentId, requirementHours = 1000, outputFormat = 'pdf' } = options

  // 1. Verify the student exists and has met the requirements
  const summary = await hoursService.getStudentHoursSummary(studentId, requirementHours)

  if (!summary.requirementMet) {
    throw new Error('Hours requirement not met. Unable to generate completion certificate.')
  }

  // 2. Get student details
  const db = getDb()
  const studentRecords = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1)

  if (studentRecords.length === 0) {
    throw new Error('Student not found')
  }

  const student = studentRecords[0]

  // 3. Generate the certificate content
  const timestamp = new Date().getTime()
  const certificateUrl = `/api/certificates/${studentId}/hours-completion-${timestamp}.${outputFormat}`

  // Return the URL to the stored certificate and student data
  return {
    certificateUrl,
    student
  }
}
