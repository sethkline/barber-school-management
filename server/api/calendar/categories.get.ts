import { H3Event } from 'h3';
import { calendarService } from '~/server/services/calendarService';

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get categories
    const categories = await calendarService.getCategories();
    
    return {
      success: true,
      data: categories
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch event categories'
    });
  }
});