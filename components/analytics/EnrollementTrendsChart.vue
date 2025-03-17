<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Student Enrollment Trends</h3>
        <Dropdown
          v-model="chartType"
          :options="chartTypeOptions"
          optionLabel="label"
          optionValue="value"
          class="w-36 text-sm"
        />
      </div>
    </div>
    
    <div v-if="loading" class="h-80 flex justify-center items-center">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>
    
    <div v-else-if="error" class="h-80 p-6 flex flex-col justify-center items-center text-red-600">
      <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
      <p>{{ error }}</p>
      <Button 
        label="Try Again" 
        icon="pi pi-refresh" 
        class="mt-3" 
        severity="secondary"
        @click="$emit('refresh')"
      />
    </div>
    
    <div v-else class="p-4">
      <Chart :type="chartType" :data="chartData" :options="chartOptions" class="h-72" />
      
      <div class="mt-4 flex justify-between items-center px-2">
        <div class="flex items-center text-sm text-gray-500">
          <div class="flex items-center mr-4">
            <div class="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>New Enrollments</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>Withdrawals</span>
          </div>
        </div>
        
        <div class="text-sm text-gray-700">
          <span class="font-medium">Net Growth:</span> 
          <span :class="netGrowth >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ netGrowth >= 0 ? '+' : '' }}{{ netGrowth }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Chart from 'primevue/chart';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits(['refresh']);

// Chart settings
const chartType = ref('line');
const chartTypeOptions = [
  { label: 'Line Chart', value: 'line' },
  { label: 'Bar Chart', value: 'bar' }
];

// Sample data - replace with actual API data
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const enrollmentData = [25, 32, 38, 35, 42, 48, 52, 58, 42, 38, 35, 42];
const withdrawalData = [5, 7, 8, 10, 6, 8, 5, 7, 9, 8, 6, 7];

// Computed net growth percentage
const netGrowth = computed(() => {
  const totalEnrollments = enrollmentData.reduce((sum, value) => sum + value, 0);
  const totalWithdrawals = withdrawalData.reduce((sum, value) => sum + value, 0);
  return totalWithdrawals === 0 ? 100 : Math.round(((totalEnrollments - totalWithdrawals) / totalEnrollments) * 100);
});

// Chart data
const chartData = computed(() => {
  return {
    labels: months,
    datasets: [
      {
        label: 'New Enrollments',
        data: enrollmentData,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      },
      {
        label: 'Withdrawals',
        data: withdrawalData,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };
});

// Chart options
const chartOptions = {
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  },
  responsive: true,
  maintainAspectRatio: false
};
</script>