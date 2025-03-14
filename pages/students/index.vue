<template>
   <StudentsPage />
</template>

<!-- <script setup lang="ts">
import { ref, onMounted } from 'vue'

// Local state for pagination and student data.
const page = ref(1)
const limit = ref(10)
const totalRecords = ref(0)
const students = ref<any[]>([])

// Function to fetch students from the API endpoint.
const loadStudents = async () => {
  const url = `/api/students?page=${page.value}&limit=${limit.value}`
  const response = await $fetch(url)
  
  // if (error.value) {
  //   console.error('Error fetching students:', error.value)
  //   return
  // }
  console.log(response, 'data')
  
  // Assuming the API returns an object with data and count properties.
  students.value = response?.data || []
  totalRecords.value = response?.count || 0
}

// Load the students when the component mounts.
onMounted(() => {
  loadStudents()
})

// Event handler for the paginator.
const onPageChange = (event: { page: number; rows: number }) => {
  // PrimeVue uses a zero-indexed page; adjust if your API expects 1-indexed pages.
  page.value = event.page + 1
  limit.value = event.rows
  loadStudents()
}
</script> -->


