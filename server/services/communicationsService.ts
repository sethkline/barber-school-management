import { getSupabaseClient } from '~/server/utils/supabaseClient';
import type { Tables, TablesInsert } from '~/types/supabase';
import mailgun from 'mailgun-js';

// Define type aliases for convenience
type CommunicationTemplate = Tables<'communication_templates'>;
type CommunicationTemplateInsert = TablesInsert<'communication_templates'>;
type CommunicationTemplateUpdate = TablesInsert<'communication_templates'>;

type Communication = Tables<'communications'>;
type CommunicationInsert = TablesInsert<'communications'>;

type Student = Tables<'students'>;
type Lead = Tables<'leads'>;

// Interface for email options
interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  recipientType?: 'student' | 'lead';
  recipientId?: string;
}

// Interface for bulk email options
interface BulkEmailOptions {
  recipients: Array<{
    to: string;
    recipientType?: 'student' | 'lead';
    recipientId?: string;
    variables?: Record<string, string>;
  }>;
  templateId: string;
}

export const communicationService = {
  /**
   * Get all communication templates
   */
  async getTemplates(): Promise<CommunicationTemplate[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from<CommunicationTemplate>('communication_templates')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch communication templates: ${error.message}`);
    }

    return data ?? [];
  },

  /**
   * Get a single template by ID
   */
  async getTemplateById(id: string): Promise<CommunicationTemplate> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from<CommunicationTemplate>('communication_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch template with ID ${id}: ${error.message}`);
    }

    return data;
  },

  /**
   * Create a new communication template
   */
  async createTemplate(template: CommunicationTemplateInsert): Promise<CommunicationTemplate> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from<CommunicationTemplate>('communication_templates')
      .insert(template)
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return data;
  },

  /**
   * Update an existing communication template
   */
  async updateTemplate(id: string, template: CommunicationTemplateUpdate): Promise<CommunicationTemplate> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from<CommunicationTemplate>('communication_templates')
      .update(template)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to update template with ID ${id}: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete a communication template
   */
  async deleteTemplate(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from<CommunicationTemplate>('communication_templates').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete template with ID ${id}: ${error.message}`);
    }
  },

  /**
   * Get communication history
   */
  async getCommunicationHistory(
    options: { studentId?: string; leadId?: string; limit?: number; page?: number } = {}
  ): Promise<{ data: Communication[]; count: number }> {
    const { studentId, leadId, limit = 10, page = 1 } = options;
    const supabase = getSupabaseClient();

    let query = supabase
      .from<Communication>('communications')
      .select('*', { count: 'exact' })
      .order('sent_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    // Calculate pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch communication history: ${error.message}`);
    }

    return { data: data ?? [], count: count ?? 0 };
  },

  // Add this method to your communicationService.ts file

  /**
   * Get all communications with optional filtering
   */
  async getAllCommunications(
    options: {
      limit?: number;
      page?: number;
      search?: string;
      type?: string;
      fromDate?: string;
      toDate?: string;
      recipientType?: string;
    } = {}
  ): Promise<{ data: Communication[]; count: number }> {
    const { limit = 10, page = 1, search, type, fromDate, toDate, recipientType } = options;

    const supabase = getSupabaseClient();

    let query = supabase
      .from<Communication>('communications')
      .select('*', { count: 'exact' })
      .order('sent_at', { ascending: false });

    // Apply filters if provided
    if (search) {
      query = query.or(`subject.ilike.%${search}%,body.ilike.%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (fromDate && toDate) {
      query = query.gte('sent_at', fromDate).lte('sent_at', toDate);
    } else if (fromDate) {
      query = query.gte('sent_at', fromDate);
    } else if (toDate) {
      query = query.lte('sent_at', toDate);
    }

    if (recipientType === 'student') {
      query = query.not('student_id', 'is', null);
    } else if (recipientType === 'lead') {
      query = query.not('lead_id', 'is', null);
    }

    // Calculate pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch communication history: ${error.message}`);
    }

    return { data: data ?? [], count: count ?? 0 };
  },

  /**
   * Process template variables for personalization
   * Replaces variables like {{firstName}} with actual values
   */
  processTemplate(templateContent: string, variables: Record<string, string>): string {
    return templateContent.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return variables[variable] || match;
    });
  },

  /**
   * Send an email and track it in communications table
   */
  async sendEmail(options: EmailOptions): Promise<Communication> {
    const { to, subject, body, templateId, recipientType, recipientId } = options;

    try {
      // For development/testing, we can just console.log the email
      // In production, you would use Mailgun or another email service
      if (process.env.NODE_ENV === 'development') {
        console.log('Sending email:');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body}`);
      } else {
        // Uncomment and configure for production use with Mailgun
        const mg = mailgun({
          apiKey: process.env.MAILGUN_API_KEY || '',
          domain: process.env.MAILGUN_DOMAIN || ''
        });

        await mg.messages().send({
          from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
          to,
          subject,
          html: body
        });
      }

      // Record the communication in the database
      const communicationRecord: CommunicationInsert = {
        to_email: to,
        subject,
        body,
        template_id: templateId,
        type: 'email',
        sent_at: new Date().toISOString()
      };

      if (recipientType === 'student' && recipientId) {
        communicationRecord.student_id = recipientId;
      } else if (recipientType === 'lead' && recipientId) {
        communicationRecord.lead_id = recipientId;
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from<Communication>('communications').insert(communicationRecord).single();

      if (error) {
        throw new Error(`Failed to record communication: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  /**
   * Send bulk emails using a template
   */
  async sendBulkEmails(options: BulkEmailOptions): Promise<Communication[]> {
    const { recipients, templateId } = options;

    try {
      // Get the template
      const template = await this.getTemplateById(templateId);

      // Send emails to each recipient
      const promises = recipients.map(async (recipient) => {
        const variables = recipient.variables || {};

        // Process the template with the recipient's variables
        const processedSubject = this.processTemplate(template.subject, variables);
        const processedBody = this.processTemplate(template.body, variables);

        // Send the email
        return this.sendEmail({
          to: recipient.to,
          subject: processedSubject,
          body: processedBody,
          templateId,
          recipientType: recipient.recipientType,
          recipientId: recipient.recipientId
        });
      });

      return Promise.all(promises);
    } catch (error: any) {
      throw new Error(`Failed to send bulk emails: ${error.message}`);
    }
  },

  /**
   * Generate variables for a student
   */
  generateStudentVariables(student: Student): Record<string, string> {
    return {
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      phone: student.phone || '',
      enrollmentDate: student.enrollment_date || '',
      expectedGraduationDate: student.expected_graduation_date || '',
      status: student.status || '',
      fullName: `${student.first_name} ${student.last_name}`
    };
  },

  /**
   * Generate variables for a lead
   */
  generateLeadVariables(lead: Lead): Record<string, string> {
    return {
      firstName: lead.first_name,
      lastName: lead.last_name,
      email: lead.email,
      phone: lead.phone || '',
      message: lead.message || '',
      status: lead.status || '',
      fullName: `${lead.first_name} ${lead.last_name}`
    };
  }
};
