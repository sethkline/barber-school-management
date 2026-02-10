// server/services/calendarService.ts
import { eq, and, gte, lte, sql, asc, inArray } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import {
  calendarEvents,
  eventCategories,
  type CalendarEvent,
  type NewCalendarEvent,
  type EventCategory
} from '~/server/db/schema'

export interface ListEventsParams {
  start_date?: string
  end_date?: string
  categories?: string[]
  related_id?: string
  related_type?: string
  created_by?: string
  page?: number
  limit?: number
}

export interface EventStats {
  totalEvents: number
  upcomingEvents: number
  todayEvents: number
  categoryDistribution: { category: string; count: number }[]
}

const DEFAULT_CATEGORIES = [
  { id: 'class', name: 'Class', color: '#4ade80', description: 'Regular class sessions and workshops' },
  { id: 'appointment', name: 'Appointment', color: '#a78bfa', description: 'Individual or group appointments' },
  { id: 'assessment', name: 'Assessment', color: '#f87171', description: 'Tests, quizzes, and other evaluations' },
  { id: 'task', name: 'Task', color: '#60a5fa', description: 'Tasks and deadlines' },
  { id: 'meeting', name: 'Meeting', color: '#fbbf24', description: 'Staff and administrative meetings' }
]

export const calendarService = {
  /**
   * Get all event categories
   */
  async getCategories(): Promise<EventCategory[]> {
    const db = getDb()

    const data = await db
      .select()
      .from(eventCategories)
      .orderBy(eventCategories.name)

    if (!data || data.length === 0) {
      return DEFAULT_CATEGORIES as EventCategory[]
    }

    return data
  },

  /**
   * Get events with optional filtering
   */
  async getEvents(params: ListEventsParams = {}): Promise<{ data: CalendarEvent[]; count: number }> {
    const db = getDb()

    const conditions = []
    if (params.start_date) {
      conditions.push(gte(calendarEvents.start, new Date(params.start_date)))
    }
    if (params.end_date) {
      conditions.push(lte(calendarEvents.start, new Date(params.end_date)))
    }
    if (params.categories && params.categories.length > 0) {
      conditions.push(inArray(calendarEvents.categoryId, params.categories))
    }
    if (params.related_id) {
      conditions.push(eq(calendarEvents.relatedId, params.related_id))
    }
    if (params.related_type) {
      conditions.push(eq(calendarEvents.relatedType, params.related_type))
    }
    if (params.created_by) {
      conditions.push(eq(calendarEvents.createdBy, params.created_by))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    let query = db
      .select()
      .from(calendarEvents)
      .where(whereClause)
      .orderBy(calendarEvents.start)

    if (params.page && params.limit) {
      const offset = (params.page - 1) * params.limit
      query = query.limit(params.limit).offset(offset) as typeof query
    }

    const data = await query

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(calendarEvents)
      .where(whereClause)

    const count = Number(countResult[0]?.count ?? 0)

    return { data, count }
  },

  /**
   * Get a specific event by ID
   */
  async getEventById(id: string): Promise<CalendarEvent> {
    const db = getDb()

    const result = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error(`Event with ID ${id} not found`)
    }

    return result[0]
  },

  /**
   * Create a new event
   */
  async createEvent(eventData: Omit<NewCalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    const db = getDb()

    if (!eventData.createdBy) {
      throw new Error('Created by user ID is required')
    }

    const result = await db
      .insert(calendarEvents)
      .values({
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    if (!result[0]) {
      throw new Error('Failed to create event')
    }

    return result[0]
  },

  /**
   * Update an existing event
   */
  async updateEvent(id: string, eventData: Partial<NewCalendarEvent>): Promise<CalendarEvent> {
    const db = getDb()

    const result = await db
      .update(calendarEvents)
      .set({
        ...eventData,
        updatedAt: new Date()
      })
      .where(eq(calendarEvents.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to update event with ID ${id}`)
    }

    return result[0]
  },

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    const db = getDb()
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id))
  },

  /**
   * Get events for today
   */
  async getTodayEvents(userId?: string): Promise<CalendarEvent[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const params: ListEventsParams = {
      start_date: today.toISOString(),
      end_date: tomorrow.toISOString()
    }

    if (userId) {
      params.created_by = userId
    }

    const { data } = await this.getEvents(params)
    return data
  },

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit: number = 5, userId?: string): Promise<CalendarEvent[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const params: ListEventsParams = {
      start_date: today.toISOString(),
      limit
    }

    if (userId) {
      params.created_by = userId
    }

    const { data } = await this.getEvents(params)

    return data.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  },

  /**
   * Get event statistics
   */
  async getEventStats(userId?: string): Promise<EventStats> {
    const db = getDb()

    const conditions = []
    if (userId) {
      conditions.push(eq(calendarEvents.createdBy, userId))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const events = await db
      .select()
      .from(calendarEvents)
      .where(whereClause)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalEvents = events.length

    const upcomingEvents = events.filter(event =>
      new Date(event.start) >= today
    ).length

    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.start)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() === today.getTime()
    }).length

    const categoryDistribution = events.reduce((acc, event) => {
      const categoryIndex = acc.findIndex(cat => cat.category === event.categoryId)

      if (categoryIndex !== -1) {
        acc[categoryIndex].count += 1
      } else if (event.categoryId) {
        acc.push({ category: event.categoryId, count: 1 })
      }

      return acc
    }, [] as { category: string; count: number }[])

    return {
      totalEvents,
      upcomingEvents,
      todayEvents,
      categoryDistribution
    }
  },

  /**
   * Get events related to a specific entity
   */
  async getRelatedEvents(relatedId: string, relatedType: string): Promise<CalendarEvent[]> {
    const { data } = await this.getEvents({
      related_id: relatedId,
      related_type: relatedType
    })

    return data
  },

  /**
   * Create events for recurring series
   */
  async createRecurringEvents(
    baseEvent: Omit<NewCalendarEvent, 'id' | 'createdAt' | 'updatedAt'>,
    occurrences: number = 10
  ): Promise<CalendarEvent[]> {
    if (!baseEvent.isRecurring || !baseEvent.recurrenceFrequency) {
      throw new Error('Event is not recurring')
    }

    const events: CalendarEvent[] = []
    const startDate = new Date(baseEvent.start)
    const endDate = new Date(baseEvent.end)
    const duration = endDate.getTime() - startDate.getTime()

    let recurrenceEndDate: Date | null = null
    if (baseEvent.recurrenceUntil) {
      recurrenceEndDate = new Date(baseEvent.recurrenceUntil)
    }

    const firstEvent = await this.createEvent(baseEvent)
    events.push(firstEvent)

    for (let i = 1; i < occurrences; i++) {
      const newStart = new Date(startDate)

      switch (baseEvent.recurrenceFrequency) {
        case 'daily':
          newStart.setDate(newStart.getDate() + i)
          break
        case 'weekly':
          newStart.setDate(newStart.getDate() + (i * 7))
          break
        case 'biweekly':
          newStart.setDate(newStart.getDate() + (i * 14))
          break
        case 'monthly':
          newStart.setMonth(newStart.getMonth() + i)
          break
      }

      if (recurrenceEndDate && newStart > recurrenceEndDate) {
        break
      }

      const newEnd = new Date(newStart.getTime() + duration)

      const newEvent = {
        ...baseEvent,
        start: newStart,
        end: newEnd
      }

      const createdEvent = await this.createEvent(newEvent)
      events.push(createdEvent)
    }

    return events
  }
}
