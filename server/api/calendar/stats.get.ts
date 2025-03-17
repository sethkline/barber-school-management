import { H3Event } from 'h3';
import { calendarService } from '~/server/services/calendarService';

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get the current user from session
    const user = event.context.user;
    
    // If user exists, get events for this user
    // If not, get all events (for dashboard overview)
    const userId = user?.id;
    
    // Get event statistics
    const stats = await calendarService.getEventStats(userId);
    
    // Get today's events
    const todayEvents = await calendarService.getTodayEvents(userId);
    
    // Get upcoming events
    const upcomingEvents = await calendarService.getUpcomingEvents(5, userId);
    
    return {
      success: true,
      data: {
        stats,
        todayEvents,
        upcomingEvents
      }
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch calendar statistics'
    });
  }
});