<template>
  <div>
    <BarberButton label="Back" icon="pi pi-arrow-left" @click="router.back()" />
    <StudentsStudentDetailContent
      :student="student"
      :loading="loading"
      :showFooter="false"
      @edit-student="handleEditStudent"
      @add-assessment="handleAddAssessment"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const studentId = route.params.id
const student = ref({})
const loading = ref(true)

onMounted(async () => {
  await fetchStudentDetails()
})

async function fetchStudentDetails() {
  loading.value = true
  try {
    const response = await fetch(`/api/students/${studentId}`)
    if (!response.ok) throw new Error('Failed to fetch student')
    const data = await response.json()
    student.value = data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleAddAssessment = () => {
  console.log('Add assessment')
}
const handleEditStudent = () => {
  console.log('Edit Student')
}
</script>