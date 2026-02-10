// server/services/leadService.ts
import { eq, ilike, or, sql, and, gte, lte, desc } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import {
  leads,
  students,
  type Lead,
  type NewLead,
  type Student
} from '~/server/db/schema'

export interface ListLeadsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  fromDate?: string
  toDate?: string
}

export const leadService = {
  /**
   * Retrieve a paginated list of leads.
   */
  async getLeads({
    page = 1,
    limit = 10,
    search = '',
    status = '',
    fromDate = '',
    toDate = ''
  }: ListLeadsParams): Promise<{ data: Lead[]; count: number }> {
    const db = getDb()
    const offset = (page - 1) * limit

    const conditions = []
    if (status) {
      conditions.push(eq(leads.status, status))
    }
    if (fromDate) {
      conditions.push(gte(leads.createdAt, new Date(fromDate)))
    }
    if (toDate) {
      conditions.push(lte(leads.createdAt, new Date(toDate)))
    }
    if (search) {
      conditions.push(
        or(
          ilike(leads.firstName, `%${search}%`),
          ilike(leads.lastName, `%${search}%`),
          ilike(leads.email, `%${search}%`)
        )
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const data = await db
      .select()
      .from(leads)
      .where(whereClause)
      .orderBy(desc(leads.createdAt))
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(whereClause)

    const count = Number(countResult[0]?.count ?? 0)

    return { data, count }
  },

  /**
   * Retrieve a single lead by ID.
   */
  async getLeadById(id: string): Promise<Lead> {
    const db = getDb()
    const result = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error(`Lead with ID ${id} not found`)
    }
    return result[0]
  },

  /**
   * Create a new lead record.
   */
  async createLead(leadData: NewLead): Promise<Lead> {
    const db = getDb()
    const result = await db
      .insert(leads)
      .values(leadData)
      .returning()

    if (!result[0]) {
      throw new Error('Failed to create lead')
    }
    return result[0]
  },

  /**
   * Update an existing lead record.
   */
  async updateLead(id: string, leadData: Partial<NewLead>): Promise<Lead> {
    const db = getDb()
    const result = await db
      .update(leads)
      .set({ ...leadData, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to update lead with ID ${id}`)
    }
    return result[0]
  },

  /**
   * Delete a lead record.
   */
  async deleteLead(id: string): Promise<Lead> {
    const db = getDb()
    const result = await db
      .delete(leads)
      .where(eq(leads.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to delete lead with ID ${id}`)
    }
    return result[0]
  },

  /**
   * Convert a lead to a student.
   */
  async convertLeadToStudent(id: string): Promise<{ student: Student; lead: Lead }> {
    const db = getDb()

    // Get the lead data
    const leadResult = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1)

    if (!leadResult[0]) {
      throw new Error(`Lead with ID ${id} not found`)
    }

    const lead = leadResult[0]

    // Create a new student from the lead
    const studentResult = await db
      .insert(students)
      .values({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        city: lead.city,
        zipCode: lead.zipCode,
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'new'
      })
      .returning()

    if (!studentResult[0]) {
      throw new Error('Failed to create student from lead')
    }

    // Update the lead status to converted
    const updatedLeadResult = await db
      .update(leads)
      .set({ status: 'converted', updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning()

    if (!updatedLeadResult[0]) {
      throw new Error('Failed to update lead status after conversion')
    }

    return { student: studentResult[0], lead: updatedLeadResult[0] }
  }
}
