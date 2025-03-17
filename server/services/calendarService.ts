import { getSupabaseClient } from '~/server/utils/supabaseClient';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  all_day: boolean;
  category_id: string;
  location?: string;
  description?: string;
  related_id?: string;
  related_type?: 'student' | 'lead' | 'assessment' | 'task';
  is_recurring: boolean;
  recurrence_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrence_until?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface ListEventsParams {
  start_date?: string;
  end_date?: string;
  categories?: string[];
  related_id?: string;
  related_type?: string;
  created_by?: string;
  page?: number;
  limit?: number;
}

export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  todayEvents: number;
  categoryDistribution: { category: string; count: number }[];
}

const DEFAULT_CATEGORIES: EventCategory[] = [
  { id: 'class', name: 'Class', color: '#4ade80', description: 'Regular class sessions and workshops' },
  { id: 'appointment', name: 'Appointment', color: '#a78bfa', description: 'Individual or group appointments' },
  { id: 'assessment', name: 'Assessment', color: '#f87171', description: 'Tests, quizzes, and other evaluations' },
  { id: 'task', name: 'Task', color: '#60a5fa', description: 'Tasks and deadlines' },
  { id: 'meeting', name: 'Meeting', color: '#fbbf24', description: 'Staff and administrative meetings' }
];

export const calendarService = {
  /**
   * Get all event categories
   */
  async getCategories(): Promise<EventCategory[]> {
    const supabase = getSupabaseClient();
    
    // Try to fetch categories from the database first
    const { data, error } = await supabase
      .from('event_categories')
      .select('*')
      .order('name');
    
    if (error || !data || data.length === 0) {
      // If there's an error or no categories, return default categories
      return DEFAULT_CATEGORIES;
    }
    
    return data;
  },
  
  /**
   * Get events with optional filtering
   */
  async getEvents(params: ListEventsParams = {}): Promise<{ data: CalendarEvent[]; count: number }> {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('calendar_events')
      .select('*', { count: 'exact' });
    
    // Apply filters if provided
    if (params.start_date) {
      query = query.gte('start', params.start_date);
    }
    
    if (params.end_date) {
      query = query.lte('start', params.end_date);
    }
    
    if (params.categories && params.categories.length > 0) {
      query = query.in('category_id', params.categories);
    }
    
    if (params.related_id) {
      query = query.eq('related_id', params.related_id);
    }
    
    if (params.related_type) {
      query = query.eq('related_type', params.related_type);
    }
    
    if (params.created_by) {
      query = query.eq('created_by', params.created_by);
    }
    
    // Apply pagination if needed
    if (params.page && params.limit) {
      const from = (params.page - 1) * params.limit;
      const to = from + params.limit - 1;
      query = query.range(from, to);
    }
    
    // Execute query
    const { data, error, count } = await query.order('start');
    
    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }
    
    return {
      data: data || [],
      count: count || 0
    };
  },
  
  /**
   * Get a specific event by ID
   */
  async getEventById(id: string): Promise<CalendarEvent> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch event with ID ${id}: ${error.message}`);
    }
    
    return data;
  },
  
  /**
   * Create a new event
   */
  async createEvent(eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
    const supabase = getSupabaseClient();
    
    if (!eventData.created_by) {
      throw new Error('Created by user ID is required');
    }
    
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        ...eventData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
    
    return data;
  },
  
  /**
   * Update an existing event
   */
  async updateEvent(id: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        ...eventData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update event with ID ${id}: ${error.message}`);
    }
    
    return data;
  },
  
  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete event with ID ${id}: ${error.message}`);
    }
  },
  
  /**
   * Get events for today
   */
  async getTodayEvents(userId?: string): Promise<CalendarEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const params: ListEventsParams = {
      start_date: today.toISOString(),
      end_date: tomorrow.toISOString()
    };
    
    if (userId) {
      params.created_by = userId;
    }
    
    const { data } = await this.getEvents(params);
    return data;
  },
  
  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit: number = 5, userId?: string): Promise<CalendarEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const params: ListEventsParams = {
      start_date: today.toISOString(),
      limit
    };
    
    if (userId) {
      params.created_by = userId;
    }
    
    const { data } = await this.getEvents(params);
    
    // Sort by start date
    return data.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  },
  
  /**
   * Get event statistics
   */
  async getEventStats(userId?: string): Promise<EventStats> {
    const supabase = getSupabaseClient();
    
    // Get event counts from DB
    let query = supabase.from('calendar_events').select('*');
    
    if (userId) {
      query = query.eq('created_by', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch event statistics: ${error.message}`);
    }
    
    const events = data || [];
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate stats
    const totalEvents = events.length;
    
    const upcomingEvents = events.filter(event => 
      new Date(event.start) >= today
    ).length;
    
    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    }).length;
    
    // Group by category
    const categoryDistribution = events.reduce((acc, event) => {
      const categoryIndex = acc.findIndex(cat => cat.category === event.category_id);
      
      if (categoryIndex !== -1) {
        acc[categoryIndex].count += 1;
      } else {
        acc.push({ category: event.category_id, count: 1 });
      }
      
      return acc;
    }, [] as { category: string; count: number }[]);
    
    return {
      totalEvents,
      upcomingEvents,
      todayEvents,
      categoryDistribution
    };
  },
  
  /**
   * Get events related to a specific entity (student, assessment, etc.)
   */
  async getRelatedEvents(relatedId: string, relatedType: string): Promise<CalendarEvent[]> {
    const { data } = await this.getEvents({
      related_id: relatedId,
      related_type: relatedType
    });
    
    return data;
  },
  
  /**
   * Create events for recurring series
   */
  async createRecurringEvents(
    baseEvent: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>,
    occurrences: number = 10
  ): Promise<CalendarEvent[]> {
    if (!baseEvent.is_recurring || !baseEvent.recurrence_frequency) {
      throw new Error('Event is not recurring');
    }
    
    const events: CalendarEvent[] = [];
    const startDate = new Date(baseEvent.start);
    const endDate = new Date(baseEvent.end);
    const duration = endDate.getTime() - startDate.getTime();
    
    let recurrenceEndDate: Date | null = null;
    if (baseEvent.recurrence_until) {
      recurrenceEndDate = new Date(baseEvent.recurrence_until);
    }
    
    // Create the base event
    const firstEvent = await this.createEvent(baseEvent);
    events.push(firstEvent);
    
    // Create subsequent events
    for (let i = 1; i < occurrences; i++) {
      const newStart = new Date(startDate);
      
      // Calculate new date based on frequency
      switch (baseEvent.recurrence_frequency) {
        case 'daily':
          newStart.setDate(newStart.getDate() + i);
          break;
        case 'weekly':
          newStart.setDate(newStart.getDate() + (i * 7));
          break;
        case 'biweekly':
          newStart.setDate(newStart.getDate() + (i * 14));
          break;
        case 'monthly':
          newStart.setMonth(newStart.getMonth() + i);
          break;
      }
      
      // Stop if we've reached the recurrence end date
      if (recurrenceEndDate && newStart > recurrenceEndDate) {
        break;
      }
      
      // Calculate end date for this occurrence
      const newEnd = new Date(newStart.getTime() + duration);
      
      // Create event data
      const newEvent = {
        ...baseEvent,
        start: newStart.toISOString(),
        end: newEnd.toISOString()
      };
      
      // Create the event
      const createdEvent = await this.createEvent(newEvent);
      events.push(createdEvent);
    }
    
    return events;
  }
};