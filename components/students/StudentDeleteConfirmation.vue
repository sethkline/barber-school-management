<!-- components/students/StudentDeleteConfirmation.vue -->
<template>
  <Dialog
    :visible="visible"
    :style="{width: '450px'}"
    header="Confirm Deletion"
    :modal="true"
    :closable="!loading"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="p-4">
      <div class="flex items-start">
        <i class="pi pi-exclamation-triangle text-red-500 text-2xl mr-4 mt-0.5"></i>
        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Delete Student Record</h3>
          <p class="text-gray-600">
            Are you sure you want to delete 
            <span class="font-medium text-gray-900">
              {{ student?.first_name }} {{ student?.last_name }}
            </span>
            from the system?
          </p>
          <div class="mt-3">
            <p class="text-sm text-red-600">This action cannot be undone.</p>
          </div>
          <div v-if="archiveOption" class="mt-4">
            <Checkbox v-model="archiveInstead" :binary="true" id="archive-option" />
            <label for="archive-option" class="ml-2 text-sm text-gray-700">
              Archive instead of permanently deleting
            </label>
            <div class="mt-1 text-xs text-gray-500">
              Archiving will move this student to the legacy system but preserve their records.
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="$emit('update:visible', false)"
          class="p-button-text"
          :disabled="loading"
        />
        <Button
          :label="archiveInstead ? 'Archive' : 'Delete'"
          :icon="archiveInstead ? 'pi pi-inbox' : 'pi pi-trash'"
          severity="danger"
          :loading="loading"
          @click="confirmDelete"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import type { Tables } from '~/types/supabase';

type Student = Tables<'students'>;

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  student: {
    type: Object as () => Student,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  archiveOption: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['update:visible', 'confirm-delete']);

// State
const archiveInstead = ref(true);

// Methods
function confirmDelete() {
  emit('confirm-delete', {
    studentId: props.student?.id,
    archive: archiveInstead.value
  });
}
</script>