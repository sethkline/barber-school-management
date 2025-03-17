import { H3Event } from 'h3';
import { calendarService } from '~/server/services/calendarService';

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get query parameters
    const query = getQuery(event);
    
    // Parse parameters
    const startDate = query.start_date as string | undefined;
    const endDate = query.end_date as string | undefined;
    const categories = query.categories ? 
      Array.isArray(query.categories) ? 
        query.categories as string[] : 
        [query.categories as string] : 
      undefined;
    const relatedId = query.related_id as string | undefined;
    const relatedType = query.related_type as string | undefined;
    const createdBy = query.created_by as string | undefined;
    const page = query.page ? parseInt(query.page as string) : undefined;
    const limit = query.limit ? parseInt(query.limit as string) : undefined;
    
    // Get events with filters
    const result = await calendarService.getEvents({
      start_date: startDate,
      end_date: endDate,
      categories,
      related_id: relatedId,
      related_type: relatedType,
      created_by: createdBy,
      page,
      limit
    });
    
    // Format events for FullCalendar
    const formattedEvents = result.data.map(event => {
      // Get category color
      let backgroundColor = '#94a3b8'; // Default color
      let borderColor = '#94a3b8';
      
      switch (event.category_id) {
        case 'class':
          backgroundColor = '#4ade80';
          borderColor = '#4ade80';
          break;
        case 'appointment':
          backgroundColor = '#a78bfa';
          borderColor = '#a78bfa';
          break;
        case 'assessment':
          backgroundColor = '#f87171';
          borderColor = '#f87171';
          break;
        case 'task':
          backgroundColor = '#60a5fa';
          borderColor = '#60a5fa';
          break;
        case 'meeting':
          backgroundColor = '#fbbf24';
          borderColor = '#fbbf24';
          break;
      }
      
      return {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.all_day,
        backgroundColor,
        borderColor,
        extendedProps: {
          categoryId: event.category_id,
          location: event.location,
          description: event.description,
          relatedId: event.related_id,
          relatedType: event.related_type,
          isRecurring: event.is_recurring,
          recurrenceFrequency: event.recurrence_frequency,
          recurrenceUntil: event.recurrence_until,
          createdBy: event.created_by
        }
      };
    });
    
    return {
      data: formattedEvents,
      count: result.count
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch events'
    });
  }
});