// SMS endpoint for sending SMS messages
import { smsService } from '~/server/services/smsService'

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  // Only admin and staff can send SMS
  if (!['admin', 'instructor', 'staff'].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Insufficient permissions to send SMS'
    })
  }

  const body = await readBody(event)
  const { type, studentId, studentIds, status, phoneNumber, message } = body

  if (!message) {
    throw createError({
      statusCode: 400,
      message: 'Message is required'
    })
  }

  try {
    // Single SMS to a student
    if (type === 'single' && studentId) {
      const result = await smsService.sendToStudent(studentId, message, user.id)
      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      }
    }

    // Single SMS to a phone number
    if (type === 'phone' && phoneNumber) {
      const result = await smsService.sendToPhone(phoneNumber, message)
      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      }
    }

    // Bulk SMS to multiple students
    if (type === 'bulk') {
      const result = await smsService.sendBulkToStudents({
        studentIds,
        status,
        message,
        senderId: user.id
      })

      return {
        success: result.successCount > 0,
        totalRecipients: result.totalRecipients,
        successCount: result.successCount,
        failureCount: result.failureCount,
        results: result.results
      }
    }

    throw createError({
      statusCode: 400,
      message: 'Invalid request type. Use "single", "phone", or "bulk"'
    })
  } catch (error: any) {
    console.error('SMS send error:', error)

    throw createError({
      statusCode: 500,
      message: `Failed to send SMS: ${error.message}`
    })
  }
})
