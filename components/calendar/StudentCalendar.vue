<template>
  <div>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
      <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
      <div class="flex gap-2">
        <Button 
          v-if="showAddButton"
          label="Add Event" 
          icon="pi pi-plus" 
          size="small"
          @click="openEventDialog(null)"
        />
        <Button
          v-if="showViewAll"
          label="View Full Calendar"
          icon="pi pi-calendar"
          link
          size="small"
          @click="navigateToCalendar"
        />
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <CalendarWidget
        ref="calendarWidget"
        :title="''"
        :showViewAll="false"
        :height="height"
        :relatedId="studentId"
        relatedType="student"
        @event-click="handleEventClick"
        @date-click="handleDateClick"
      />
    </div>
    
    <!-- Event Dialog -->
    <Dialog 
      v-model:visible="eventDialogVisible" 
      :style="{ width: '500px' }" 
      :header="dialogMode === 'create' ? 'Create Event' : 'Edit Event'" 
      :modal="true" 
      :closable="!loading"
      @hide="resetEventForm"
    >
      <EventForm
        ref="eventForm"
        :event="selectedEvent"
        :loading="loading"
        :showRelatedFields="false"
        relatedType="student"
        :defaultStart="selectedDate"
        @save="saveEvent"
        @cancel="eventDialogVisible = false"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import CalendarWidget from '~/components/calendar/CalendarWidget.vue';
import EventForm from '~/components/calendar/EventForm.vue';
import useCalendar from '~/composables/useCalendar';

interface StudentCalendarProps {
  studentId: string;
  title?: string;
  height?: string;
  showAddButton?: boolean;
  showViewAll?: boolean;
}

const props = withDefaults(defineProps<StudentCalendarProps>(), {
  title: 'Student Calendar',
  height: '400px',
  showAddButton: true,
  showViewAll: true
});

const emit = defineEmits(['event-added', 'event-updated', 'event-deleted']);

// Composables
const toast = useToast();
const confirm = useConfirm();
const router = useRouter();
const { createEvent, updateEvent, deleteEvent } = useCalendar();

// Component refs
const calendarWidget = ref(null);
const eventForm = ref(null);

// Local state
const loading = ref(false);
const eventDialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const selectedEvent = ref(null);
const selectedDate = ref<Date | null>(null);

// Methods
const openEventDialog = (event: any, date?: Date) => {
  if (event) {
    dialogMode.value = 'edit';
    selectedEvent.value = event;
  } else {
    dialogMode.value = 'create';
    selectedEvent.value = null;
    selectedDate.value = date || null;
  }
  
  eventDialogVisible.value = true;
};

const resetEventForm = () => {
  if (eventForm.value) {
    eventForm.value.resetForm();
  }
};

const refreshCalendar = () => {
  if (calendarWidget.value) {
    calendarWidget.value.refreshEvents();
  }
};

const navigateToCalendar = () => {
  router.push({
    path: '/calendar',
    query: { related_id: props.studentId, related_type: 'student' }
  });
};

const handleEventClick = (event: any) => {
  openEventDialog(event);
};

const handleDateClick = (date: Date) => {
  openEventDialog(null, date);
};

const saveEvent = async (eventData: any) => {
  loading.value = true;
  
  try {
    // Add student relation
    eventData.relatedId = props.studentId;
    eventData.relatedType = 'student';
    
    if (dialogMode.value === 'create') {
      // Create new event
      await createEvent(eventData);
      emit('event-added');
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Event created successfully',
        life: 3000
      });
    } else {
      // Update existing event
      await updateEvent(eventData.id, eventData);
      emit('event-updated');
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Event updated successfully',
        life: 3000
      });
    }
    
    // Close dialog and refresh calendar
    eventDialogVisible.value = false;
    refreshCalendar();
  } catch (error) {
    console.error('Error saving event:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save event. Please try again.',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const confirmDeleteEvent = () => {
  if (!selectedEvent.value) return;
  
  confirm.require({
    message: 'Are you sure you want to delete this event?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      deleteSelectedEvent();
    }
  });
};

const deleteSelectedEvent = async () => {
  if (!selectedEvent.value) return;
  
  loading.value = true;
  
  try {
    await deleteEvent(selectedEvent.value.id);
    
    emit('event-deleted');
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Event deleted successfully',
      life: 3000
    });
    
    // Close dialog and refresh calendar
    eventDialogVisible.value = false;
    refreshCalendar();
  } catch (error) {
    console.error('Error deleting event:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete event. Please try again.',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Expose methods to parent component
defineExpose({
  refreshCalendar,
  openEventDialog
});
</script>