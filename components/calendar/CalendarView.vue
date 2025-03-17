<template>
  <div class="p-4 md:p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Calendar</h1>
      <p class="text-gray-600 mt-1">Manage and view all scheduled events</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Calendar Sidebar -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <!-- Mini Calendar for Navigation -->
          <div class="mb-4">
            <Calendar v-model="selectedDate" inline @date-select="handleDateSelect" />
          </div>

          <!-- Create Event Button -->
          <Button 
            label="Create Event" 
            icon="pi pi-plus" 
            class="w-full mb-4 custom-button" 
            @click="openEventDialog(null)"
          />

          <!-- Category Filters -->
          <div class="mb-4">
            <h3 class="text-lg font-medium mb-2">Event Categories</h3>
            <div class="space-y-2">
              <div v-for="category in categories" :key="category.id" class="flex items-center">
                <Checkbox 
                  v-model="selectedCategories" 
                  :value="category.id" 
                  :inputId="category.id" 
                  :binary="false"
                />
                <label :for="category.id" class="ml-2 flex items-center">
                  <span 
                    class="inline-block w-3 h-3 rounded-full mr-2" 
                    :style="{ backgroundColor: category.color }"
                  ></span>
                  {{ category.name }}
                </label>
              </div>
            </div>
          </div>

          <!-- Upcoming Events -->
          <div>
            <h3 class="text-lg font-medium mb-2">Upcoming Events</h3>
            <div v-if="upcomingEvents.length === 0" class="text-gray-500 text-sm">
              No upcoming events
            </div>
            <div v-else class="space-y-3">
              <div 
                v-for="event in upcomingEvents" 
                :key="event.id" 
                class="p-3 rounded-lg border-l-4 cursor-pointer"
                :class="getEventBorderClass(event)"
                @click="openEventDialog(event)"
              >
                <div class="font-medium text-gray-900">{{ event.title }}</div>
                <div class="text-sm text-gray-500">{{ formatEventDateTime(event) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Calendar Area -->
      <div class="lg:col-span-3">
        <div class="bg-white rounded-lg shadow p-4">
          <!-- Calendar Header -->
          <div class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div class="flex items-center">
              <Button 
                icon="pi pi-chevron-left" 
                text 
                rounded 
                aria-label="Previous" 
                @click="handlePrev"
              />
              <h2 class="text-xl font-bold mx-4">{{ currentViewTitle }}</h2>
              <Button 
                icon="pi pi-chevron-right" 
                text 
                rounded 
                aria-label="Next" 
                @click="handleNext"
              />
              <Button 
                label="Today" 
                text 
                @click="handleToday" 
                class="ml-2"
              />
            </div>

            <div class="flex items-center gap-2">
              <SelectButton v-model="currentView" :options="viewOptions" optionLabel="label" aria-label="View" />
            </div>
          </div>

          <!-- FullCalendar Component -->
          <div class="calendar-container">
            <FullCalendar 
              ref="fullCalendar"
              :options="calendarOptions"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Event Dialog -->
    <Dialog 
      v-model:visible="eventDialogVisible" 
      :style="{ width: '500px' }" 
      :header="dialogMode === 'create' ? 'Create Event' : 'Edit Event'" 
      :modal="true" 
      :closable="!isLoading"
      @hide="resetEventForm"
    >
      <EventForm
        ref="eventForm"
        :event="selectedEvent"
        :loading="isLoading"
        :showRelatedFields="true"
        :relatedOptions="relatedOptions"
        @save="saveEvent"
        @cancel="eventDialogVisible = false"
      />
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import ConfirmDialog from 'primevue/confirmdialog';
import useCalendar from '~/composables/useCalendar';
import EventForm from '~/components/calendar/EventForm.vue';

// Composables
const toast = useToast();
const confirm = useConfirm();

// Use calendar composable
const {
  events,
  categories,
  selectedCategories,
  isLoading,
  error,
  filteredEvents,
  upcomingEvents,
  currentView,
  currentViewTitle,
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  formatEventDateTime
} = useCalendar();

// Calendar references
const fullCalendar = ref(null);
const eventForm = ref(null);

// State for calendar view and navigation
const selectedDate = ref(new Date());

// Event handling state
const eventDialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const selectedEvent = ref<any>(null);

// Calendar view options
const viewOptions = [
  { label: 'Month', value: 'dayGridMonth' },
  { label: 'Week', value: 'timeGridWeek' },
  { label: 'Day', value: 'timeGridDay' }
];

// Mock data for related options (in a real app, this would be fetched)
const relatedOptions = ref([
  { id: '1', name: 'Jane Smith' },
  { id: '2', name: 'John Doe' },
  { id: '3', name: 'Maria Garcia' }
]);

// Calendar configuration
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: currentView.value,
  headerToolbar: false, // Custom header implemented in template
  events: filteredEvents.value,
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  nowIndicator: true,
  eventTimeFormat: {
    hour: 'numeric',
    minute: '2-digit',
    meridiem: 'short'
  },
  // Handlers for calendar interactions
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize
}));

// Initialize
onMounted(async () => {
  // Fetch events
  await fetchEvents();
  
  // In a real app, you would fetch related entities here
  // For example: relatedOptions.value = await $fetch('/api/students')
});

// Watch for view changes to update the title
watch(currentView, () => {
  updateCalendar();
});

// Methods for calendar navigation
function handlePrev() {
  if (fullCalendar.value) {
    const calendarApi = fullCalendar.value.getApi();
    calendarApi.prev();
  }
}

function handleNext() {
  if (fullCalendar.value) {
    const calendarApi = fullCalendar.value.getApi();
    calendarApi.next();
  }
}

function handleToday() {
  if (fullCalendar.value) {
    const calendarApi = fullCalendar.value.getApi();
    calendarApi.today();
  }
}

function handleDateSelect(selectInfo: any) {
  // If selecting from the main calendar
  if (selectInfo.view) {
    openEventDialog(null, selectInfo.startStr, selectInfo.endStr);
    selectInfo.view.calendar.unselect(); // Clear selection
  } else {
    // If selecting from the mini calendar
    if (fullCalendar.value) {
      const calendarApi = fullCalendar.value.getApi();
      calendarApi.gotoDate(selectInfo);
    }
  }
}

function handleEventClick(clickInfo: any) {
  openEventDialog(clickInfo.event);
}

function handleEventDrop(dropInfo: any) {
  const eventId = dropInfo.event.id;
  const eventData = {
    start: dropInfo.event.start,
    end: dropInfo.event.end || dropInfo.event.start
  };
  
  updateEvent(eventId, eventData)
    .then(() => {
      toast.add({
        severity: 'success',
        summary: 'Event Updated',
        detail: 'Event has been rescheduled',
        life: 3000
      });
    });
}

function handleEventResize(resizeInfo: any) {
  const eventId = resizeInfo.event.id;
  const eventData = {
    start: resizeInfo.event.start,
    end: resizeInfo.event.end
  };
  
  updateEvent(eventId, eventData)
    .then(() => {
      toast.add({
        severity: 'success',
        summary: 'Event Updated',
        detail: 'Event duration has been updated',
        life: 3000
      });
    });
}

// Event CRUD operations
function openEventDialog(event: any, startStr?: string, endStr?: string) {
  if (event) {
    // Edit existing event
    dialogMode.value = 'edit';
    selectedEvent.value = event;
  } else {
    // Create new event
    dialogMode.value = 'create';
    selectedEvent.value = null;
    
    // If start and end times provided (from calendar select)
    if (startStr && endStr) {
      selectedEvent.value = {
        start: startStr,
        end: endStr
      };
    }
  }
  
  eventDialogVisible.value = true;
}

function resetEventForm() {
  if (eventForm.value) {
    eventForm.value.resetForm();
  }
}

async function saveEvent(eventData: any) {
  try {
    if (dialogMode.value === 'create') {
      // Create new event
      await createEvent(eventData);
    } else {
      // Update existing event
      await updateEvent(eventData.id, eventData);
    }
    
    // Close dialog
    eventDialogVisible.value = false;
  } catch (err) {
    console.error('Error saving event:', err);
  }
}

function confirmDeleteEvent(eventId: string) {
  confirm.require({
    message: 'Are you sure you want to delete this event?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      deleteEvent(eventId)
        .then(() => {
          // Close dialog if open
          if (eventDialogVisible.value) {
            eventDialogVisible.value = false;
          }
        });
    }
  });
}

// Helper methods
function updateCalendar() {
  if (fullCalendar.value) {
    const calendarApi = fullCalendar.value.getApi();
    calendarApi.refetchEvents();
  }
}

function getEventBorderClass(event: any): string {
  const categoryId = event.extendedProps?.categoryId;
  switch (categoryId) {
    case 'class':
      return 'border-green-500';
    case 'appointment':
      return 'border-purple-500';
    case 'assessment':
      return 'border-red-500';
    case 'task':
      return 'border-blue-500';
    case 'meeting':
      return 'border-yellow-500';
    default:
      return 'border-gray-500';
  }
}
</script>

<style>
.calendar-container {
  height: calc(100vh - 250px);
  min-height: 500px;
}

/* Calendar Custom Styling */
:deep(.fc) {
  --fc-border-color: #e5e7eb;
  --fc-event-border-color: transparent;
  --fc-today-bg-color: rgba(96, 165, 250, 0.1);
  font-family: inherit;
}

:deep(.fc-theme-standard td), :deep(.fc-theme-standard th) {
  border-color: var(--fc-border-color);
}

:deep(.fc-daygrid-day) {
  min-height: 100px;
}

:deep(.fc-event) {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 0.875rem;
}

:deep(.fc-event-title) {
  font-weight: 500;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.fc-event-time) {
  font-size: 0.75rem;
  margin-right: 4px;
}

:deep(.fc-toolbar-title) {
  font-size: 1.25rem;
  font-weight: 600;
}

:deep(.fc-button) {
  background-color: var(--p-primary-color) !important;
  border-color: var(--p-primary-color) !important;
}

:deep(.fc-button-active) {
  background-color: var(--p-primary-color) !important;
  border-color: var(--p-primary-color) !important;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .calendar-container {
    height: 500px;
    min-height: auto;
  }

  :deep(.fc-toolbar-title) {
    font-size: 1rem;
  }
}

/* Custom button styling */
.custom-button {
  background: var(--p-primary-color) !important;
  border-color: var(--p-primary-color) !important;
  color: var(--p-primary-contrast-color) !important;
}

.custom-button:hover {
  background: var(--p-primary-hover-color) !important;
  border-color: var(--p-primary-hover-color) !important;
}

.custom-button:active {
  background: var(--p-primary-active-color) !important;
  border-color: var(--p-primary-active-color) !important;
}
</style>