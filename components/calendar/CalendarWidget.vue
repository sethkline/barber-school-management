<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
      <NuxtLink v-if="showViewAll" to="/calendar" class="text-sm text-primary-600 hover:text-primary-800 flex items-center">
        View all
        <i class="pi pi-arrow-right ml-1"></i>
      </NuxtLink>
    </div>
    
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <ProgressSpinner style="width:40px;height:40px" strokeWidth="4" />
    </div>
    
    <div v-else>
      <FullCalendar 
        ref="fullCalendar"
        :options="calendarOptions"
        class="calendar-mini"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ProgressSpinner from 'primevue/progressspinner';
import useCalendar from '~/composables/useCalendar';

const props = defineProps({
  title: {
    type: String,
    default: 'Upcoming Events'
  },
  height: {
    type: String,
    default: '300px'
  },
  eventLimit: {
    type: Number,
    default: 3
  },
  defaultView: {
    type: String,
    default: 'dayGridMonth'
  },
  showViewAll: {
    type: Boolean,
    default: true
  },
  relatedId: {
    type: String,
    default: undefined
  },
  relatedType: {
    type: String,
    default: undefined
  },
  categories: {
    type: Array as () => string[],
    default: () => []
  }
});

const emit = defineEmits(['event-click', 'date-click']);

// Get calendar service
const { 
  events, 
  fetchEvents, 
  isLoading, 
  error 
} = useCalendar();

// Calendar reference
const fullCalendar = ref(null);

// Computed calendar options
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: props.defaultView,
  headerToolbar: {
    left: '',
    center: 'title',
    right: 'prev,next'
  },
  height: props.height,
  events: events.value,
  dayMaxEvents: props.eventLimit,
  weekends: true,
  eventTimeFormat: {
    hour: 'numeric',
    minute: '2-digit',
    meridiem: 'short'
  },
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  dayMaxEventRows: true,
}));

// Initialize
onMounted(async () => {
  // Load events with filters if provided
  const params: any = {};
  
  if (props.relatedId) {
    params.relatedId = props.relatedId;
  }
  
  if (props.relatedType) {
    params.relatedType = props.relatedType;
  }
  
  if (props.categories && props.categories.length > 0) {
    params.categories = props.categories;
  }
  
  await fetchEvents(params);
});

// Methods
function handleDateClick(info: any) {
  emit('date-click', info.date);
}

function handleEventClick(info: any) {
  emit('event-click', info.event);
}

// Expose methods to parent component
defineExpose({
  refreshEvents: fetchEvents,
  gotoDate: (date: Date) => {
    if (fullCalendar.value) {
      const calendarApi = fullCalendar.value.getApi();
      calendarApi.gotoDate(date);
    }
  },
  next: () => {
    if (fullCalendar.value) {
      const calendarApi = fullCalendar.value.getApi();
      calendarApi.next();
    }
  },
  prev: () => {
    if (fullCalendar.value) {
      const calendarApi = fullCalendar.value.getApi();
      calendarApi.prev();
    }
  },
  today: () => {
    if (fullCalendar.value) {
      const calendarApi = fullCalendar.value.getApi();
      calendarApi.today();
    }
  }
});
</script>

<style scoped>
.calendar-mini :deep(.fc-header-toolbar) {
  margin-bottom: 0.5rem;
}

.calendar-mini :deep(.fc-toolbar-title) {
  font-size: 1rem;
}

.calendar-mini :deep(.fc-button) {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.calendar-mini :deep(.fc-daygrid-day-number) {
  font-size: 0.75rem;
  padding: 2px 4px;
}

.calendar-mini :deep(.fc-event-time),
.calendar-mini :deep(.fc-event-title) {
  font-size: 0.7rem;
}

.calendar-mini :deep(.fc-col-header-cell-cushion) {
  font-size: 0.75rem;
  padding: 2px;
}

.calendar-mini :deep(.fc-day-today) {
  background-color: rgba(96, 165, 250, 0.1) !important;
}
</style>