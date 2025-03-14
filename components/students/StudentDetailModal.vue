<template>
  <Dialog
    :visible="visible"
    :style="{ width: '800px' }"
    header="Student Details"
    :modal="true"
    :closable="!loading"
    @update:visible="onUpdateVisible"
  >
    <StudentsStudentDetailContent 
      :student="student" 
      :loading="loading"
      @edit-student="(s) => $emit('edit-student', s)"
      @close="closeModal"
      @add-assessment="$emit('add-assessment')"
    />
  </Dialog>
</template>

<script setup lang="ts">

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  student: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:visible',
  'edit-student',
  'add-assessment'
  // add any additional events you want to forward
]);

function onUpdateVisible(val: boolean) {
  emit('update:visible', val);
}

function closeModal() {
  emit('update:visible', false);
}
</script>
