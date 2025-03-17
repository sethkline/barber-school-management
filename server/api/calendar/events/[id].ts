// server/api/calendar/events/[id].ts

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
    
    // Get event ID from route params
    const id = event.context.params?.id;
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      });
    }
    
    // Handle different HTTP methods
    const method = event.node.req.method;
    
    if (method === 'GET') {
      // Get a specific event
      const calendarEvent = await calendarService.getEventById(id);
      
      return {
        success: true,
        data: calendarEvent
      };
    } else if (method === 'PUT') {
      // Update an event
      const body = await readBody(event);
      
      // Get the existing event to check permissions
      const existingEvent = await calendarService.getEventById(id);
      
      // Check if the user is the creator of the event
      // In a real app, you would also check for admin permissions
      if (existingEvent.created_by !== user.id) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You do not have permission to update this event'
        });
      }
      
      // Update the event
      const updatedEvent = await calendarService.updateEvent(id, body);
      
      return {
        success: true,
        data: updatedEvent,
        message: 'Event updated successfully'
      };
    } else if (method === 'DELETE') {
      // Delete an event
      // Get the existing event to check permissions
      const existingEvent = await calendarService.getEventById(id);
      
      // Check if the user is the creator of the event
      // In a real app, you would also check for admin permissions
      if (existingEvent.created_by !== user.id) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You do not have permission to delete this event'
        });
      }
      
      // Delete the event
      await calendarService.deleteEvent(id);
      
      return {
        success: true,
        message: 'Event deleted successfully'
      };
    } else {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      });
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to process event request'
    });
  }
});