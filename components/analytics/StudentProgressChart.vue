<!-- components/analytics/StudentProgressChart.vue -->
 <!-- TODO fix this logic missing -->
<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Student Progress Overview</h3>
        <Dropdown
          v-model="selectedMetric"
          :options="metricOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48 text-sm"
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
      
      <!-- Progress Metrics -->
      <div class="mt-4 grid grid-cols-3 gap-4">
        <div v-for="(metric, index) in progressMetrics" :key="index" class="border rounded-lg p-3">
          <div class="text-sm text-gray-500">{{ metric.label }}</div>
          <div class="text-lg font-semibold mt-1">{{ metric.value }}</div>
          <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              class="h-2 rounded-full" 
              :style="`width: ${metric.percentage}%`"
              :class="getProgressColorClass(metric.percentage)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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

// Metric selection
const selectedMetric = ref('assessments');
const metricOptions = [
  { label: 'Assessment Scores', value: 'assessments' },
  { label: 'Attendance Rates', value: 'attendance' },
  { label: 'Certification Completion', value: 'certifications' },
  { label: 'Hours Completed', value: 'hours' }
];

// Chart type based on selected metric
const chartType = computed(() => {
  switch (selectedMetric.value) {
    case 'assessments':
    case 'attendance':
      return 'line';
    case 'certifications':
    case 'hours':
      return 'bar';
    default:
      return 'line';
  }
});

// Sample data for each metric type
const assessmentData = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June'],
  datasets: [
    {
      label: 'Average Score',
      data: [75, 78, 80, 79, 85, 88],
      borderColor: 'rgba(79, 70, 229, 1)',
      backgroundColor: 'rgba(79, 70, 229, 0.2)',
      tension: 0.4,
      fill: true
    }
  ]
};

const attendanceData = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June'],
  datasets: [
    {
      label: 'Attendance Rate',
      data: [92, 89, 94, 91, 95, 97],
      borderColor: 'rgba(52, 211, 153, 1)',
      backgroundColor: 'rgba(52, 211, 153, 0.2)',
      tension: 0.4,
      fill: true
    }
  ]
};

const certificationData = {
  labels: ['First Aid', 'CPR', 'Safety', 'Technical', 'Advanced'],
  datasets: [
    {
      label: 'Completion Rate (%)',
      data: [85, 92, 78, 65, 45],
      backgroundColor: 'rgba(251, 191, 36, 0.7)',
      borderColor: 'rgba(251, 191, 36, 1)',
      borderWidth: 1
    }
  ]
};

const hoursData = {
  labels: ['0-100', '101-200', '201-300', '301-400', '401-500', '501+'],
  datasets: [
    {
      label: 'Number of Students',
      data: [18, 25, 42, 35, 22, 15],
      backgroundColor: 'rgba(99, 102, 241, 0.7)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1
    }
  ]
};

// Dynamic chart data based on selected metric
const chartData = computed(() => {
  switch (selectedMetric.value) {
    case 'assessments':
      return assessmentData;
    case 'attendance':
      return attendanceData;
    case 'certifications':
      return certificationData;
    case 'hours':
      return hoursData;
    default:
      return assessmentData;
  }
});

// Chart options
const chartOptions = computed(() => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };

  // Add specific options based on chart type
  if (chartType.value === 'line') {
    return {
      ...baseOptions,
      scales: {
        y: {
          min: selectedMetric.value === 'attendance' ? 60 : 0,
          ticks: {
            callback: function(value) {
              return value + (selectedMetric.value === 'attendance' ? '%' : '');
            }
          }
        }
      }
    };
  } else {
    return {
      ...baseOptions,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return selectedMetric.value === 'certifications' ? value + '%' : value;
            }
          }
        }
      }
    };
  }
});

// Progress metrics (shown below chart)
const progressMetrics = ref([
  {
    label: 'Overall Progress',
    value: '82%',
    percentage: 82
  },
  {
    label: 'Certification Rate',
    value: '68%',
    percentage: 68
  },
  {
    label: 'Course Completion',
    value: '76%',
    percentage: 76
  }
]);

// Helper function to get color class based on percentage
function getProgressColorClass(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  if (percentage >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

// Watch for metric changes (in a real app, this would fetch new data)
watch(selectedMetric, () => {
  // In a real app, you would fetch new data based on the selected metric
  console.log(`Selected metric changed to: ${selectedMetric.value}`);
});
</script>