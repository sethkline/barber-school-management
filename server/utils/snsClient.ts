// AWS SNS Client for SMS messaging
import {
  SNSClient,
  PublishCommand,
  PublishBatchCommand,
  type PublishBatchRequestEntry
} from '@aws-sdk/client-sns'

let snsClient: SNSClient | null = null

export function getSNSClient(): SNSClient {
  if (snsClient) {
    return snsClient
  }

  const config = useRuntimeConfig()

  snsClient = new SNSClient({
    region: config.awsRegion || 'us-east-1'
  })

  return snsClient
}

export interface SMSMessage {
  phoneNumber: string
  message: string
}

export interface SMSResult {
  phoneNumber: string
  messageId?: string
  success: boolean
  error?: string
}

export const snsService = {
  /**
   * Send a single SMS message
   */
  async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    const client = getSNSClient()

    // Ensure phone number is in E.164 format
    const formattedPhone = formatPhoneNumber(phoneNumber)

    try {
      const command = new PublishCommand({
        PhoneNumber: formattedPhone,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional' // or 'Promotional' for marketing
          }
        }
      })

      const response = await client.send(command)

      return {
        phoneNumber: formattedPhone,
        messageId: response.MessageId,
        success: true
      }
    } catch (error: any) {
      console.error('SMS send error:', error)
      return {
        phoneNumber: formattedPhone,
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Send bulk SMS messages (up to 10 at a time using batch)
   */
  async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResult[]> {
    const results: SMSResult[] = []

    // Process in batches of 10 (SNS batch limit)
    const batchSize = 10
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize)
      const batchResults = await this.sendSMSBatch(batch)
      results.push(...batchResults)
    }

    return results
  },

  /**
   * Send a batch of SMS messages (internal helper)
   */
  async sendSMSBatch(messages: SMSMessage[]): Promise<SMSResult[]> {
    const results: SMSResult[] = []

    // SNS doesn't support batch SMS to phone numbers directly
    // We need to send individual messages
    const promises = messages.map(async (msg) => {
      return this.sendSMS(msg.phoneNumber, msg.message)
    })

    const batchResults = await Promise.allSettled(promises)

    for (let i = 0; i < batchResults.length; i++) {
      const result = batchResults[i]
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          phoneNumber: messages[i].phoneNumber,
          success: false,
          error: result.reason?.message || 'Unknown error'
        })
      }
    }

    return results
  },

  /**
   * Publish a message to an SNS topic (for topic-based messaging)
   */
  async publishToTopic(topicArn: string, message: string, subject?: string): Promise<string | undefined> {
    const client = getSNSClient()

    try {
      const command = new PublishCommand({
        TopicArn: topicArn,
        Message: message,
        Subject: subject
      })

      const response = await client.send(command)
      return response.MessageId
    } catch (error: any) {
      console.error('Topic publish error:', error)
      throw error
    }
  }
}

/**
 * Format phone number to E.164 format
 * Assumes US numbers if no country code provided
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '')

  // If it starts with 1 and has 11 digits, it's already in correct format
  if (digits.length === 11 && digits.startsWith('1')) {
    return '+' + digits
  }

  // If it has 10 digits, assume US and add +1
  if (digits.length === 10) {
    return '+1' + digits
  }

  // If it already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone
  }

  // Otherwise, return with + prefix
  return '+' + digits
}
