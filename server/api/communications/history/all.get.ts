import { H3Event, getQuery } from 'h3';
import { communicationService } from '~/server/services/communicationsService';

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event);
    const limit = query.limit ? parseInt(query.limit as string) : 10;
    const page = query.page ? parseInt(query.page as string) : 1;
    const search = query.search as string | undefined;
    const type = query.type as string | undefined;
    const fromDate = query.fromDate as string | undefined;
    const toDate = query.toDate as string | undefined;
    const recipientType = query.recipientType as string | undefined;

    const history = await communicationService.getAllCommunications({
      limit,
      page,
      search,
      type,
      fromDate,
      toDate,
      recipientType
    });

    return history;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    });
  }
});
