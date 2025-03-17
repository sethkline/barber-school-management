import { H3Event } from 'h3';
import { calendarService } from '~/server/services/calendarService';

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get the current user from session
    const user = event.context.user;
    
    if (!user || !user.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      });
    }
    
    // Parse request body
    const body = await readBody(event);
    
    // Validate required fields
    if (!body.title || !body.start || !body.end || !body.category_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: title, start, end, or category_id'
      });
    }
    
    // Format data for service
    const eventData = {
      title: body.title,
      start: body.start,
      end: body.end,
      all_day: body.all_day || false,
      category_id: body.category_id,
      location: body.location,
      description: body.description,
      related_id: body.related_id,
      related_type: body.related_type,
      is_recurring: body.is_recurring || false,
      recurrence_frequency: body.recurrence_frequency,
      recurrence_until: body.recurrence_until,
      created_by: user.id
    };
    
    // Handle recurring events
    if (eventData.is_recurring && eventData.recurrence_frequency) {
      const events = await calendarService.createRecurringEvents(eventData);
      return {
        success: true,
        data: events,
        message: 'Recurring events created successfully'
      };
    } else {
      // Create a single event
      const createdEvent = await calendarService.createEvent(eventData);
      return {
        success: true,
        data: createdEvent,
        message: 'Event created successfully'
      };
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to create event'
    });
  }
});