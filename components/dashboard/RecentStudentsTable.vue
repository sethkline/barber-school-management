<!-- components/dashboard/RecentStudentsTable.vue -->
<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Recent Students</h3>
        <NuxtLink to="/students" class="text-sm text-primary-600 hover:text-primary-800 flex items-center">
          View all
          <i class="pi pi-arrow-right ml-1"></i>
        </NuxtLink>
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-center items-center p-6">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>
    
    <div v-else-if="error" class="p-6 text-center text-red-600">
      <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
      <p>{{ error }}</p>
      <Button 
        label="Try Again" 
        icon="pi pi-refresh" 
        class="mt-2" 
        severity="secondary"
        @click="loadStudents"
      />
    </div>
    
    <div v-else-if="!students.length" class="p-6 text-center text-gray-500">
      <i class="pi pi-users text-3xl mb-2 text-gray-400"></i>
      <p>No students found</p>
    </div>
    
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Enrolled
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="student in students" :key="student.id">
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center">
                <div v-if="student.photo_url" class="flex-shrink-0 h-8 w-8">
                  <img :src="student.photo_url" alt="" class="h-8 w-8 rounded-full">
                </div>
                <div v-else class="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <i class="pi pi-user text-gray-400"></i>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ student.first_name }} {{ student.last_name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ student.email }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                :class="statusClass(student.status)">
                {{ capitalizeFirstLetter(student.status) }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(student.enrollment_date) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
              <NuxtLink :to="`/students/${student.id}`" class="text-primary-600 hover:text-primary-900 mr-2">
                <i class="pi pi-eye"></i>
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { ref, onMounted } from 'vue';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
import type { Tables } from '~/types/supabase';

type Student = Tables<'students'>;

const props = defineProps({
  limit: {
    type: Number,
    default: 5
  },
  mockData: {
    type: Array as PropType<Student[]>,
    default: () => []
  },
  isTesting: {
    type: Boolean,
    default: false
  },
  mockError: {
    type: String,
    default: ''
  }
});

const students = ref<Student[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(() => {
  loadStudents();
});

async function loadStudents() {
  // Handle mock error first
  if (props.isTesting && props.mockError) {
    students.value = [];
    loading.value = false;
    error.value = props.mockError;
    return;
  }
  
  // Handle mock data
  if (props.isTesting && props.mockData.length >= 0) {
    students.value = props.mockData;
    loading.value = false;
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    const response = await $fetch('/api/students/recent', {
      params: {
        limit: props.limit
      }
    });
    students.value = response.data;
  } catch (err: any) {
    console.error('Failed to load recent students:', err);
    error.value = err.message || 'Failed to load students';
  } finally {
    loading.value = false;
  }
}

function statusClass(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  switch (status.toLowerCase()) {
    case 'current':
      return 'bg-green-100 text-green-800';
    case 'on_leave':
      return 'bg-yellow-100 text-yellow-800';
    case 'withdrawn':
      return 'bg-red-100 text-red-800';
    case 'graduated':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function capitalizeFirstLetter(str: string | null): string {
  if (!str) return 'Unknown';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}
</script>