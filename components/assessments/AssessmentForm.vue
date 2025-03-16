<template>
  <div class="assessment-form bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-xl font-semibold mb-4">
      {{ isEditing ? 'Edit Assessment' : 'Create New Assessment' }}
    </h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Student Selection -->
      <div v-if="!studentId" class="form-group">
        <label for="student" class="block text-sm font-medium text-gray-700 mb-1">Student</label>
        <select 
          id="student"
          v-model="form.student_id"
          class="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
          required
        >
          <option value="" disabled>Select a student</option>
          <option v-for="student in students" :key="student.id" :value="student.id">
            {{ student.first_name }} {{ student.last_name }}
          </option>
        </select>
      </div>
      
      <!-- Assessment Type -->
      <div class="form-group">
        <label for="assessment_type" class="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
        <div class="flex space-x-2">
          <select 
            id="assessment_type"
            v-model="form.assessment_type"
            class="flex-1 p-2 border rounded-md focus:ring-primary focus:border-primary"
            required
          >
            <option value="" disabled>Select type</option>
            <option v-for="type in assessmentTypes" :key="type" :value="type">
              {{ type }}
            </option>
            <option value="custom">Custom Type</option>
          </select>
          
          <input
            v-if="form.assessment_type === 'custom'"
            v-model="customType"
            placeholder="Enter type"
            class="flex-1 p-2 border rounded-md focus:ring-primary focus:border-primary"
            required
          />
        </div>
      </div>
      
      <!-- Assessment Date -->
      <div class="form-group">
        <label for="assessment_date" class="block text-sm font-medium text-gray-700 mb-1">Assessment Date</label>
        <input 
          id="assessment_date"
          v-model="form.assessment_date"
          type="date"
          class="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
          required
        />
      </div>
      
      <!-- Score -->
      <div class="form-group">
        <label for="score" class="block text-sm font-medium text-gray-700 mb-1">Score</label>
        <input 
          id="score"
          v-model.number="form.score"
          type="number"
          min="0"
          max="100"
          step="0.1"
          class="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
          required
        />
      </div>
      
      <!-- Comments -->
      <div class="form-group">
        <label for="comment" class="block text-sm font-medium text-gray-700 mb-1">Comments</label>
        <textarea 
          id="comment"
          v-model="form.comment"
          rows="4"
          class="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
          placeholder="Add additional notes about the assessment..."
        ></textarea>
      </div>
      
      <!-- Form Actions -->
      <div class="flex justify-end space-x-3 mt-6">
        <button 
          type="button" 
          @click="$emit('cancel')"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAssessments, type Assessment } from '~/composables/useAssessments'

const props = defineProps({
  studentId: {
    type: String,
    default: ''
  },
  assessmentId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['cancel', 'saved'])

// Form state
const isEditing = computed(() => !!props.assessmentId)
const isSubmitting = ref(false)
const customType = ref('')
const assessmentTypes = ref<string[]>([])
const students = ref<any[]>([])

const { 
  fetchAssessmentById,
  createAssessment, 
  updateAssessment,
  fetchAssessmentTypes
} = useAssessments()

// Default form values
const defaultForm = {
  student_id: props.studentId || '',
  assessment_type: '',
  assessment_date: new Date().toISOString().split('T')[0],
  score: 0,
  comment: ''
}

const form = reactive<Partial<Assessment>>({ ...defaultForm })

// Load assessment types on mount
onMounted(async () => {
  // Get assessment types
  const types = await fetchAssessmentTypes()
  assessmentTypes.value = types

  // If editing, load assessment data
  if (props.assessmentId) {
    const assessment = await fetchAssessmentById(props.assessmentId)
    if (assessment) {
      Object.assign(form, assessment)
    }
  }

  // If not in a student context, load student list
  if (!props.studentId) {
    try {
      const response = await fetch('/api/students')
      const data = await response.json()
      students.value = data.data || []
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }
})

// Watch custom type changes
watch(customType, (newValue) => {
  if (form.assessment_type === 'custom' && newValue) {
    form.assessment_type = newValue
  }
})

// Form submission
async function handleSubmit() {
  isSubmitting.value = true

  try {
    let result

    if (isEditing.value) {
      result = await updateAssessment(props.assessmentId, form)
    } else {
      result = await createAssessment(form)
    }

    if (result) {
      emit('saved', result)
    }
  } catch (error) {
    console.error('Error saving assessment:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.assessment-form {
  max-width: 800px;
  margin: 0 auto;
}
</style>