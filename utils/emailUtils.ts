import type { Tables } from '~/types/supabase'

type Student = Tables<'students'>
type Lead = Tables<'leads'>

/**
 * Generate template variables for a student
 */
export function generateStudentVariables(student: Student): Record<string, string> {
  return {
    firstName: student.first_name,
    lastName: student.last_name,
    fullName: `${student.first_name} ${student.last_name}`,
    email: student.email,
    phone: student.phone || '',
    address: student.address || '',
    city: student.city || '',
    zipCode: student.zip_code || '',
    enrollmentDate: student.enrollment_date || '',
    expectedGraduationDate: student.expected_graduation_date || '',
    status: student.status || '',
  }
}

/**
 * Generate template variables for a lead
 */
export function generateLeadVariables(lead: Lead): Record<string, string> {
  return {
    firstName: lead.first_name,
    lastName: lead.last_name,
    fullName: `${lead.first_name} ${lead.last_name}`,
    email: lead.email,
    phone: lead.phone || '',
    address: lead.address || '',
    city: lead.city || '',
    zipCode: lead.zip_code || '',
    message: lead.message || '',
    status: lead.status || '',
    contactedDate: lead.contacted_date || '',
    followUpDate: lead.follow_up_date || '',
  }
}

/**
 * Process template string with variable substitution
 * Replaces variables like {{firstName}} with actual values
 */
export function processTemplate(content: string, variables: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return variables[variable] || match
  })
}

/**
 * Get available template variables with descriptions
 */
export function getAvailableVariables(): Record<string, string> {
  return {
    firstName: "Recipient's first name",
    lastName: "Recipient's last name",
    fullName: "Recipient's full name",
    email: "Recipient's email address",
    phone: "Recipient's phone number",
    address: "Recipient's street address",
    city: "Recipient's city",
    zipCode: "Recipient's ZIP code",
    enrollmentDate: "Student's enrollment date",
    expectedGraduationDate: "Student's expected graduation date",
    status: "Student or lead status",
    message: "Lead's initial message",
    contactedDate: "Date the lead was contacted",
    followUpDate: "Scheduled follow-up date for lead",
  }
}