<template>
  <div class="bg-white rounded-lg shadow">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
        <NuxtLink v-if="showViewAll" to="/calendar" class="text-sm text-primary-600 hover:text-primary-800 flex items-center">
          View all
          <i class="pi pi-arrow-right ml-1"></i>
        </NuxtLink>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center p-4">
      <ProgressSpinner style="width:40px;height:40px" strokeWidth="4" />
    </div>
    
    <div v-else-if="error" class="p-4 text-center text-red-600">
      <i class="pi pi-exclamation-circle text-2xl mb-2"></i>
      <p>{{ error }}</p>
    </div>
    
    <div v-else-if="events.length === 0" class="p-4 text-center text-gray-500">
      <i class="pi pi-calendar text-2xl text-gray-300 mb-2"></i>
      <p>No upcoming events</p>
    </div>
    
    <div v-else class="divide-y divide-gray-200">
      <div 
        v-for="event in events" 
        :key="event.id" 
        class="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
        @click="$emit('event-click', event)"
      >
        <div class="flex items-start">
          <div 
            class="w-3 h-3 mt-1.5 rounded-full flex-shrink-0" 
            :style="{ backgroundColor: event.backgroundColor }"
          ></div>
          <div class="ml-3">
            <div class="font-medium text-gray-900">{{ event.title }}</div>
            <div class="text-sm text-gray-500">{{ formatEventDateTime(event) }}</div>
            <div v-if="event.extendedProps.location" class="text-sm text-gray-500 mt-1 flex items-center">
              <i class="pi pi-map-marker mr-1 text-xs"></i>
              {{ event.extendedProps.location }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showActions && events.length > 0" class="p-4 border-t border-gray-200">
      <Button
        label="Add Event"
        icon="pi pi-plus"
        class="w-full"
        @click="$emit('add-event')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
import useCalendar from '~/composables/useCalendar';

const props = defineProps({
  title: {
    type: String,
    default: 'Upcoming Events'
  },
  limit: {
    type: Number,
    default: 5
  },
  showViewAll: {
    type: Boolean,
    default: true
  },
  showActions: {
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

const emit = defineEmits(['event-click', 'add-event']);

// Get calendar service
const { 
  events, 
  fetchEvents, 
  isLoading, 
  error,
  formatEventDateTime
} = useCalendar();

// Filtered events based on props
const filteredEvents = computed(() => {
  // Sort by start date and limit to specified count
  return events.value
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, props.limit);
});

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

// Expose refresh method to parent component
defineExpose({
  refreshEvents: fetchEvents
});
</script>