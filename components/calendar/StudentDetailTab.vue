<template>
  <div>
    <div v-if="isLoading" class="p-4 flex justify-center">
      <ProgressSpinner style="width:30px;height:30px" strokeWidth="4" />
    </div>
    <div v-else>
      <StudentCalendar
        ref="studentCalendar"
        :studentId="studentId"
        title="Student Schedule"
        height="500px"
        @event-added="handleEventAdded"
        @event-updated="handleEventUpdated"
        @event-deleted="handleEventDeleted"
      />
      
      <div class="mt-6">
        <h4 class="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h4>
        <UpcomingEvents
          :relatedId="studentId"
          relatedType="student"
          :title="''"
          :showViewAll="false"
          :showActions="false"
          @event-click="handleEventClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import ProgressSpinner from 'primevue/progressspinner';
import StudentCalendar from '~/components/calendar/StudentCalendar.vue';
import UpcomingEvents from '~/components/calendar/UpcomingEvents.vue';

const props = defineProps({
  studentId: {
    type: String,
    required: true
  }
});

const toast = useToast();
const studentCalendar = ref(null);
const isLoading = ref(false);

// Methods
const handleEventClick = (event: any) => {
  if (studentCalendar.value) {
    studentCalendar.value.openEventDialog(event);
  }
};

const handleEventAdded = () => {
  toast.add({
    severity: 'success',
    summary: 'Event Added',
    detail: 'New event has been scheduled for this student',
    life: 3000
  });
};

const handleEventUpdated = () => {
  toast.add({
    severity: 'success',
    summary: 'Event Updated',
    detail: 'Event has been updated successfully',
    life: 3000
  });
};

const handleEventDeleted = () => {
  toast.add({
    severity: 'info',
    summary: 'Event Removed',
    detail: 'Event has been removed from schedule',
    life: 3000
  });
};

// Add this method to the existing StudentDetailContent.vue
// This adds a "Calendar" tab to the student detail view
/*
<TabPanel value="calendar">
  <StudentDetailCalendarTab :studentId="student.id" />
</TabPanel>
*/
</script>