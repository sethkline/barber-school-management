// composables/useCalendar.ts

import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';

interface EventCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    categoryId: string;
    location?: string;
    description?: string;
    relatedId?: string;
    relatedType?: string;
    isRecurring: boolean;
    recurrenceFrequency?: string;
    recurrenceUntil?: string;
    createdBy: string;
  };
}

interface EventForm {
  id: string | null;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  categoryId: string;
  location?: string;
  description?: string;
  relatedId?: string;
  relatedType?: string;
  isRecurring: boolean;
  recurrenceFrequency?: string;
  recurrenceUntil?: Date | null;
}

interface ListEventParams {
  startDate?: string;
  endDate?: string;
  categories?: string[];
  relatedId?: string;
  relatedType?: string;
  page?: number;
  limit?: number;
}

export default function useCalendar() {
  const toast = useToast();
  
  // State
  const events = ref<CalendarEvent[]>([]);
  const categories = ref<EventCategory[]>([]);
  const selectedCategories = ref<string[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const totalCount = ref(0);
  
  // Current view state
  const currentViewTitle = ref('');
  const currentView = ref('dayGridMonth');
  
  // Selected event
  const selectedEvent = ref<CalendarEvent | null>(null);
  
  // Filtered events based on selected categories
  const filteredEvents = computed(() => {
    if (selectedCategories.value.length === 0) {
      return events.value;
    }
    
    return events.value.filter(event => 
      selectedCategories.value.includes(event.extendedProps.categoryId)
    );
  });
  
  // Upcoming events (sorted by start date)
  const upcomingEvents = computed(() => {
    const now = new Date();
    return events.value
      .filter(event => new Date(event.start) >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  });
  
  // Today's events
  const todayEvents = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return events.value.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate < tomorrow;
    });
  });
  
  // Methods to fetch data
  const fetchCategories = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch('/api/calendar/categories');
      categories.value = response.data;
      
      // Initially select all categories
      selectedCategories.value = categories.value.map(cat => cat.id);
    } catch (err: any) {
      console.error('Failed to fetch event categories:', err);
      error.value = err.message || 'Failed to load event categories';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load event categories',
        life: 3000
      });
    } finally {
      isLoading.value = false;
    }
  };
  
  const fetchEvents = async (params: ListEventParams = {}) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Format query parameters
      const queryParams: Record<string, any> = {};
      
      if (params.startDate) {
        queryParams.start_date = params.startDate;
      }
      
      if (params.endDate) {
        queryParams.end_date = params.endDate;
      }
      
      if (params.categories && params.categories.length > 0) {
        queryParams.categories = params.categories;
      }
      
      if (params.relatedId) {
        queryParams.related_id = params.relatedId;
      }
      
      if (params.relatedType) {
        queryParams.related_type = params.relatedType;
      }
      
      if (params.page) {
        queryParams.page = params.page.toString();
      }
      
      if (params.limit) {
        queryParams.limit = params.limit.toString();
      }
      
      const response = await $fetch('/api/calendar/events', {
        params: queryParams
      });
      
      events.value = response.data;
      totalCount.value = response.count;
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      error.value = err.message || 'Failed to load events';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load events',
        life: 3000
      });
    } finally {
      isLoading.value = false;
    }
  };
  
  const getEventById = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch(`/api/calendar/events/${id}`);
      return response.data;
    } catch (err: any) {
      console.error(`Failed to fetch event with ID ${id}:`, err);
      error.value = err.message || 'Failed to load event details';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load event details',
        life: 3000
      });
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  
  const createEvent = async (eventData: Omit<EventForm, 'id'>) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Format dates for API
      const formattedData = {
        title: eventData.title,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString(),
        all_day: eventData.allDay,
        category_id: eventData.categoryId,
        location: eventData.location,
        description: eventData.description,
        related_id: eventData.relatedId,
        related_type: eventData.relatedType,
        is_recurring: eventData.isRecurring,
        recurrence_frequency: eventData.recurrenceFrequency,
        recurrence_until: eventData.recurrenceUntil ? eventData.recurrenceUntil.toISOString() : undefined
      };
      
      const response = await $fetch('/api/calendar/events', {
        method: 'POST',
        body: formattedData
      });
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Event created successfully',
        life: 3000
      });
      
      // Refresh events
      await fetchEvents();
      
      return response.data;
    } catch (err: any) {
      console.error('Failed to create event:', err);
      error.value = err.message || 'Failed to create event';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to create event',
        life: 3000
      });
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  
  const updateEvent = async (id: string, eventData: Partial<EventForm>) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Format data for API
      const formattedData: Record<string, any> = {};
      
      // Only include fields that are present
      if (eventData.title !== undefined) formattedData.title = eventData.title;
      if (eventData.start !== undefined) formattedData.start = eventData.start.toISOString();
      if (eventData.end !== undefined) formattedData.end = eventData.end.toISOString();
      if (eventData.allDay !== undefined) formattedData.all_day = eventData.allDay;
      if (eventData.categoryId !== undefined) formattedData.category_id = eventData.categoryId;
      if (eventData.location !== undefined) formattedData.location = eventData.location;
      if (eventData.description !== undefined) formattedData.description = eventData.description;
      if (eventData.relatedId !== undefined) formattedData.related_id = eventData.relatedId;
      if (eventData.relatedType !== undefined) formattedData.related_type = eventData.relatedType;
      if (eventData.isRecurring !== undefined) formattedData.is_recurring = eventData.isRecurring;
      if (eventData.recurrenceFrequency !== undefined) formattedData.recurrence_frequency = eventData.recurrenceFrequency;
      if (eventData.recurrenceUntil !== undefined) {
        formattedData.recurrence_until = eventData.recurrenceUntil ? 
          eventData.recurrenceUntil.toISOString() : null;
      }
      
      const response = await $fetch(`/api/calendar/events/${id}`, {
        method: 'PUT',
        body: formattedData
      });
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Event updated successfully',
        life: 3000
      });
      
      // Refresh events
      await fetchEvents();
      
      return response.data;
    } catch (err: any) {
      console.error(`Failed to update event with ID ${id}:`, err);
      error.value = err.message || 'Failed to update event';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to update event',
        life: 3000
      });
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  
  const deleteEvent = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      await $fetch(`/api/calendar/events/${id}`, {
        method: 'DELETE'
      });
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Event deleted successfully',
        life: 3000
      });
      
      // Refresh events
      await fetchEvents();
      
      return true;
    } catch (err: any) {
      console.error(`Failed to delete event with ID ${id}:`, err);
      error.value = err.message || 'Failed to delete event';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to delete event',
        life: 3000
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };
  
  const getCalendarStats = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch('/api/calendar/stats');
      return response.data;
    } catch (err: any) {
      console.error('Failed to fetch calendar statistics:', err);
      error.value = err.message || 'Failed to load calendar statistics';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load calendar statistics',
        life: 3000
      });
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  
  // Helper methods for UI
  const getCategoryById = (categoryId: string) => {
    return categories.value.find(cat => cat.id === categoryId);
  };
  
  const getCategoryColor = (categoryId: string) => {
    const category = getCategoryById(categoryId);
    return category ? category.color : '#94a3b8'; // Default gray color
  };
  
  const formatEventDateTime = (event: CalendarEvent) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    // Format date
    const dateOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    
    // Format time
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    };
    
    // Same day event
    if (start.toDateString() === end.toDateString()) {
      if (event.allDay) {
        return `${start.toLocaleDateString('en-US', dateOptions)} (All day)`;
      }
      return `${start.toLocaleDateString('en-US', dateOptions)} · ${start.toLocaleTimeString('en-US', timeOptions)} - ${end.toLocaleTimeString('en-US', timeOptions)}`;
    }
    
    // Multi-day event
    return `${start.toLocaleDateString('en-US', dateOptions)} - ${end.toLocaleDateString('en-US', dateOptions)}`;
  };
  
  // Initialize
  fetchCategories();
  
  return {
    // State
    events,
    categories,
    selectedCategories,
    isLoading,
    error,
    totalCount,
    currentView,
    currentViewTitle,
    selectedEvent,
    
    // Computed
    filteredEvents,
    upcomingEvents,
    todayEvents,
    
    // Methods
    fetchEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getCalendarStats,
    getCategoryById,
    getCategoryColor,
    formatEventDateTime
  };
}