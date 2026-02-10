// server/services/communicationsService.ts
import { eq, ilike, or, sql, and, gte, lte, desc, isNotNull, asc } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import {
  communications,
  communicationTemplates,
  type Communication,
  type NewCommunication,
  type CommunicationTemplate,
  type NewCommunicationTemplate,
  type Student,
  type Lead
} from '~/server/db/schema'
import { sesService } from '~/server/utils/sesClient'

interface EmailOptions {
  to: string
  subject: string
  body: string
  templateId?: string
  recipientType?: 'student' | 'lead'
  recipientId?: string
}

interface BulkEmailOptions {
  recipients: Array<{
    to: string
    recipientType?: 'student' | 'lead'
    recipientId?: string
    variables?: Record<string, string>
  }>
  templateId: string
}

export const communicationService = {
  /**
   * Get all communication templates
   */
  async getTemplates(): Promise<CommunicationTemplate[]> {
    const db = getDb()
    return db
      .select()
      .from(communicationTemplates)
      .orderBy(asc(communicationTemplates.name))
  },

  /**
   * Get a single template by ID
   */
  async getTemplateById(id: string): Promise<CommunicationTemplate> {
    const db = getDb()
    const result = await db
      .select()
      .from(communicationTemplates)
      .where(eq(communicationTemplates.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error(`Template with ID ${id} not found`)
    }
    return result[0]
  },

  /**
   * Create a new communication template
   */
  async createTemplate(template: NewCommunicationTemplate): Promise<CommunicationTemplate> {
    const db = getDb()
    const result = await db
      .insert(communicationTemplates)
      .values(template)
      .returning()

    if (!result[0]) {
      throw new Error('Failed to create template')
    }
    return result[0]
  },

  /**
   * Update an existing communication template
   */
  async updateTemplate(id: string, template: Partial<NewCommunicationTemplate>): Promise<CommunicationTemplate> {
    const db = getDb()
    const result = await db
      .update(communicationTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(communicationTemplates.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to update template with ID ${id}`)
    }
    return result[0]
  },

  /**
   * Delete a communication template
   */
  async deleteTemplate(id: string): Promise<void> {
    const db = getDb()
    await db.delete(communicationTemplates).where(eq(communicationTemplates.id, id))
  },

  /**
   * Get communication history
   */
  async getCommunicationHistory(
    options: { studentId?: string; leadId?: string; limit?: number; page?: number } = {}
  ): Promise<{ data: Communication[]; count: number }> {
    const { studentId, leadId, limit = 10, page = 1 } = options
    const db = getDb()
    const offset = (page - 1) * limit

    const conditions = []
    if (studentId) {
      conditions.push(eq(communications.studentId, studentId))
    }
    if (leadId) {
      conditions.push(eq(communications.leadId, leadId))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const data = await db
      .select()
      .from(communications)
      .where(whereClause)
      .orderBy(desc(communications.sentAt))
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(communications)
      .where(whereClause)

    const count = Number(countResult[0]?.count ?? 0)

    return { data, count }
  },

  /**
   * Get all communications with optional filtering
   */
  async getAllCommunications(
    options: {
      limit?: number
      page?: number
      search?: string
      type?: string
      fromDate?: string
      toDate?: string
      recipientType?: string
    } = {}
  ): Promise<{ data: Communication[]; count: number }> {
    const { limit = 10, page = 1, search, type, fromDate, toDate, recipientType } = options
    const db = getDb()
    const offset = (page - 1) * limit

    const conditions = []
    if (search) {
      conditions.push(
        or(
          ilike(communications.subject, `%${search}%`),
          ilike(communications.body, `%${search}%`)
        )
      )
    }
    if (type) {
      conditions.push(eq(communications.type, type))
    }
    if (fromDate) {
      conditions.push(gte(communications.sentAt, new Date(fromDate)))
    }
    if (toDate) {
      conditions.push(lte(communications.sentAt, new Date(toDate)))
    }
    if (recipientType === 'student') {
      conditions.push(isNotNull(communications.studentId))
    } else if (recipientType === 'lead') {
      conditions.push(isNotNull(communications.leadId))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const data = await db
      .select()
      .from(communications)
      .where(whereClause)
      .orderBy(desc(communications.sentAt))
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(communications)
      .where(whereClause)

    const count = Number(countResult[0]?.count ?? 0)

    return { data, count }
  },

  /**
   * Process template variables for personalization
   */
  processTemplate(templateContent: string, variables: Record<string, string>): string {
    return templateContent.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return variables[variable] || match
    })
  },

  /**
   * Send an email and track it in communications table
   */
  async sendEmail(options: EmailOptions): Promise<Communication> {
    const { to, subject, body, templateId, recipientType, recipientId } = options
    const db = getDb()

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Sending email:')
        console.log(`To: ${to}`)
        console.log(`Subject: ${subject}`)
        console.log(`Body: ${body}`)
      } else {
        const config = useRuntimeConfig()
        const result = await sesService.sendEmail({
          from: config.sesFromEmail || 'noreply@yourdomain.com',
          to,
          subject,
          html: body
        })

        if (!result.success) {
          throw new Error(result.error || 'SES send failed')
        }
      }

      const communicationRecord: NewCommunication = {
        toEmail: to,
        subject,
        body,
        templateId,
        type: 'email',
        sentAt: new Date()
      }

      if (recipientType === 'student' && recipientId) {
        communicationRecord.studentId = recipientId
      } else if (recipientType === 'lead' && recipientId) {
        communicationRecord.leadId = recipientId
      }

      const result = await db
        .insert(communications)
        .values(communicationRecord)
        .returning()

      if (!result[0]) {
        throw new Error('Failed to record communication')
      }

      return result[0]
    } catch (error: any) {
      throw new Error(`Failed to send email: ${error.message}`)
    }
  },

  /**
   * Send bulk emails using a template
   */
  async sendBulkEmails(options: BulkEmailOptions): Promise<Communication[]> {
    const { recipients, templateId } = options

    try {
      const template = await this.getTemplateById(templateId)

      const promises = recipients.map(async (recipient) => {
        const variables = recipient.variables || {}

        const processedSubject = this.processTemplate(template.subject, variables)
        const processedBody = this.processTemplate(template.body, variables)

        return this.sendEmail({
          to: recipient.to,
          subject: processedSubject,
          body: processedBody,
          templateId,
          recipientType: recipient.recipientType,
          recipientId: recipient.recipientId
        })
      })

      return Promise.all(promises)
    } catch (error: any) {
      throw new Error(`Failed to send bulk emails: ${error.message}`)
    }
  },

  /**
   * Generate variables for a student
   */
  generateStudentVariables(student: Student): Record<string, string> {
    return {
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone || '',
      enrollmentDate: student.enrollmentDate || '',
      expectedGraduationDate: student.expectedGraduationDate || '',
      status: student.status || '',
      fullName: `${student.firstName} ${student.lastName}`
    }
  },

  /**
   * Generate variables for a lead
   */
  generateLeadVariables(lead: Lead): Record<string, string> {
    return {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone || '',
      message: lead.message || '',
      status: lead.status || '',
      fullName: `${lead.firstName} ${lead.lastName}`
    }
  }
}
