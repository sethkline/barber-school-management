<!-- components/dashboard/StudentStatusChart.vue -->
<template>
  <div class="bg-white rounded-lg shadow">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Student Status Distribution</h3>
        <Dropdown 
          v-model="selectedPeriod" 
          :options="periodOptions" 
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
        @click="loadData"
      />
    </div>
    
    <div v-else class="p-4">
      <Chart type="doughnut" :data="chartData" :options="chartOptions" class="h-72" />
      
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
        <div v-for="(item, index) in statusCounts" :key="index" class="flex items-center">
          <div class="w-3 h-3 rounded-full mr-2" :style="{ backgroundColor: chartColors[index] }"></div>
          <div class="flex flex-col">
            <span class="text-sm font-medium text-gray-900">{{ formatStatus(item.status) }}</span>
            <div class="flex items-baseline">
              <span class="text-lg font-semibold">{{ item.count }}</span>
              <span class="text-xs text-gray-500 ml-1">{{ getPercentage(item.count) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import Chart from 'primevue/chart';
import Dropdown from 'primevue/dropdown';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';

interface StatusCount {
  status: string;
  count: number;
}

const props = defineProps({
  initialPeriod: {
    type: String,
    default: 'all'
  }
});

const loading = ref(true);
const error = ref<string | null>(null);
const statusCounts = ref<StatusCount[]>([]);
const selectedPeriod = ref(props.initialPeriod);

const periodOptions = [
  { label: 'All Time', value: 'all' },
  { label: 'This Year', value: 'year' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Month', value: 'month' }
];

// Chart colors
const chartColors = [
  '#4ade80', // green (current)
  '#facc15', // yellow (on leave)
  '#f87171', // red (withdrawn)
  '#60a5fa', // blue (graduated)
  '#c084fc', // purple (pending)
  '#94a3b8'  // slate (other)
];

// Compute chart data from status counts
const chartData = computed(() => {
  return {
    labels: statusCounts.value.map(item => formatStatus(item.status)),
    datasets: [
      {
        data: statusCounts.value.map(item => item.count),
        backgroundColor: chartColors.slice(0, statusCounts.value.length),
        hoverBackgroundColor: chartColors.slice(0, statusCounts.value.length).map(color => {
          // Darken the color slightly on hover
          return color + 'dd';
        }),
        borderWidth: 0
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
      callbacks: {
        label: function(context: any) {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  },
  cutout: '70%',
  responsive: true,
  maintainAspectRatio: false
};

// Watch for period changes
watch(selectedPeriod, () => {
  loadData();
});

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await $fetch('/api/students/status-counts', {
      params: {
        period: selectedPeriod.value
      }
    });
    statusCounts.value = response.data;
  } catch (err: any) {
    console.error('Failed to load student status data:', err);
    error.value = err.message || 'Failed to load data';
  } finally {
    loading.value = false;
  }
}

// Format status strings
function formatStatus(status: string): string {
  if (!status) return 'Unknown';
  
  // Replace underscores with spaces and capitalize each word
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Calculate percentage
function getPercentage(count: number): number {
  const total = statusCounts.value.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}
</script>