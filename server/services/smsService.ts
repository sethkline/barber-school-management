// SMS Service for bulk messaging using AWS SNS
import { snsService, type SMSMessage, type SMSResult } from '~/server/utils/snsClient'
import { getDb } from '~/server/utils/db'
import { students, communications } from '~/server/db/schema'
import { eq, inArray, and, isNotNull } from 'drizzle-orm'

export interface BulkSMSParams {
  studentIds?: string[]
  status?: string // Filter students by status (e.g., 'active')
  message: string
  senderId?: string // User ID of the sender
}

export interface BulkSMSResult {
  totalRecipients: number
  successCount: number
  failureCount: number
  results: SMSResult[]
}

export const smsService = {
  /**
   * Send a single SMS to a student
   */
  async sendToStudent(studentId: string, message: string, senderId?: string): Promise<SMSResult> {
    const db = getDb()

    // Get the student's phone number
    const student = await db.select({
      id: students.id,
      phone: students.phone,
      firstName: students.firstName,
      lastName: students.lastName
    })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1)

    if (!student[0] || !student[0].phone) {
      return {
        phoneNumber: '',
        success: false,
        error: 'Student not found or no phone number on file'
      }
    }

    const result = await snsService.sendSMS(student[0].phone, message)

    // Log the communication
    if (senderId) {
      await this.logCommunication({
        recipientId: studentId,
        recipientType: 'student',
        type: 'sms',
        subject: 'SMS Message',
        content: message,
        status: result.success ? 'sent' : 'failed',
        senderId,
        errorMessage: result.error
      })
    }

    return result
  },

  /**
   * Send bulk SMS to multiple students
   */
  async sendBulkToStudents(params: BulkSMSParams): Promise<BulkSMSResult> {
    const db = getDb()
    const { studentIds, status, message, senderId } = params

    // Build query conditions
    const conditions = []

    if (studentIds && studentIds.length > 0) {
      conditions.push(inArray(students.id, studentIds))
    }

    if (status) {
      conditions.push(eq(students.status, status))
    }

    // Only include students with phone numbers
    conditions.push(isNotNull(students.phone))

    // Get students matching criteria
    const studentsWithPhones = await db.select({
      id: students.id,
      phone: students.phone,
      firstName: students.firstName,
      lastName: students.lastName
    })
      .from(students)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    if (studentsWithPhones.length === 0) {
      return {
        totalRecipients: 0,
        successCount: 0,
        failureCount: 0,
        results: []
      }
    }

    // Prepare messages
    const smsMessages: SMSMessage[] = studentsWithPhones
      .filter(s => s.phone)
      .map(s => ({
        phoneNumber: s.phone!,
        message
      }))

    // Send bulk SMS
    const results = await snsService.sendBulkSMS(smsMessages)

    // Calculate stats
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    // Log communications
    if (senderId) {
      const loggingPromises = studentsWithPhones.map((student, index) => {
        const result = results[index]
        return this.logCommunication({
          recipientId: student.id,
          recipientType: 'student',
          type: 'sms',
          subject: 'Bulk SMS Message',
          content: message,
          status: result?.success ? 'sent' : 'failed',
          senderId,
          errorMessage: result?.error
        })
      })

      await Promise.allSettled(loggingPromises)
    }

    return {
      totalRecipients: studentsWithPhones.length,
      successCount,
      failureCount,
      results
    }
  },

  /**
   * Send SMS to a phone number directly
   */
  async sendToPhone(phoneNumber: string, message: string): Promise<SMSResult> {
    return snsService.sendSMS(phoneNumber, message)
  },

  /**
   * Log a communication record
   */
  async logCommunication(params: {
    recipientId: string
    recipientType: 'student' | 'lead'
    type: 'sms' | 'email'
    subject: string
    content: string
    status: string
    senderId?: string
    errorMessage?: string
  }): Promise<void> {
    const db = getDb()

    try {
      await db.insert(communications).values({
        recipientId: params.recipientId,
        recipientType: params.recipientType,
        type: params.type,
        subject: params.subject,
        content: params.content,
        status: params.status,
        sentAt: new Date(),
        sentBy: params.senderId
      })
    } catch (error) {
      console.error('Failed to log communication:', error)
      // Don't throw - logging failure shouldn't break SMS sending
    }
  },

  /**
   * Get SMS statistics
   */
  async getSMSStats(options?: { startDate?: Date; endDate?: Date }): Promise<{
    totalSent: number
    totalFailed: number
    uniqueRecipients: number
  }> {
    const db = getDb()
    const conditions = [eq(communications.type, 'sms')]

    // Note: Date filtering would need to be added based on sentAt field
    // This is a simplified version

    const allSMS = await db.select()
      .from(communications)
      .where(and(...conditions))

    const totalSent = allSMS.filter(c => c.status === 'sent').length
    const totalFailed = allSMS.filter(c => c.status === 'failed').length
    const uniqueRecipients = new Set(allSMS.map(c => c.recipientId)).size

    return {
      totalSent,
      totalFailed,
      uniqueRecipients
    }
  }
}
