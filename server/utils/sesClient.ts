// AWS SES Client for email sending
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

let sesClient: SESClient | null = null

export function getSESClient(): SESClient {
  if (sesClient) {
    return sesClient
  }

  const config = useRuntimeConfig()

  sesClient = new SESClient({
    region: config.awsRegion || 'us-east-1'
  })

  return sesClient
}

export interface EmailParams {
  to: string
  from: string
  subject: string
  html: string
}

export interface EmailResult {
  messageId?: string
  success: boolean
  error?: string
}

export const sesService = {
  /**
   * Send a single email via SES
   */
  async sendEmail(params: EmailParams): Promise<EmailResult> {
    const client = getSESClient()

    try {
      const command = new SendEmailCommand({
        Source: params.from,
        Destination: {
          ToAddresses: [params.to]
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: params.html,
              Charset: 'UTF-8'
            }
          }
        }
      })

      const response = await client.send(command)

      return {
        messageId: response.MessageId,
        success: true
      }
    } catch (error: any) {
      console.error('SES send error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}
