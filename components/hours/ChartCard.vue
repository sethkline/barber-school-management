<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Hours Completed by Month</h3>
        <Dropdown 
          v-model="selectedPeriod" 
          :options="periodOptions" 
          optionLabel="label"
          optionValue="value"
          class="w-36 text-sm"
          @change="loadData"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center p-6" style="height: 300px">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>

    <div v-else-if="error" class="p-6 text-center text-red-600" style="height: 300px">
      <div class="h-full flex flex-col justify-center items-center">
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
    </div>

    <div v-else-if="!monthlyData.length" class="p-6 text-center text-gray-500" style="height: 300px">
      <div class="h-full flex flex-col justify-center items-center">
        <i class="pi pi-chart-bar text-3xl mb-2 text-gray-400"></i>
        <p>No hours data available for this period</p>
      </div>
    </div>

    <div v-else class="p-4">
      <Chart 
        type="bar" 
        :data="chartData" 
        :options="chartOptions" 
        style="height: 300px"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Chart from 'primevue/chart';
import Dropdown from 'primevue/dropdown';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';

interface MonthlyHoursData {
  month: string;
  total: number;
}

const props = defineProps({
  studentId: {
    type: String,
    required: true
  }
});

// State
const loading = ref(true);
const error = ref('');
const monthlyData = ref<MonthlyHoursData[]>([]);
const selectedPeriod = ref('year');

// Period options for dropdown
const periodOptions = [
  { label: 'Last 3 Months', value: '3months' },
  { label: 'Last 6 Months', value: '6months' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' }
];

// Chart data computed from monthly data
const chartData = computed(() => {
  const formattedLabels = monthlyData.value.map(item => formatMonthLabel(item.month));
  
  return {
    labels: formattedLabels,
    datasets: [
      {
        label: 'Hours Completed',
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        data: monthlyData.value.map(item => item.total)
      }
    ]
  };
});

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 5
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return `${context.dataset.label}: ${context.raw} hours`;
        }
      }
    }
  }
};

// Watch for student ID changes
watch(() => props.studentId, () => {
  if (props.studentId) {
    loadData();
  }
});

// Load data on component mount
onMounted(() => {
  if (props.studentId) {
    loadData();
  }
});

// Load monthly hours data based on selected period
async function loadData() {
  if (!props.studentId) return;
  
  loading.value = true;
  error.value = '';
  
  // Calculate start date based on selected period
  let startDate = '';
  const today = new Date();
  
  if (selectedPeriod.value === '3months') {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    startDate = threeMonthsAgo.toISOString().split('T')[0];
  } else if (selectedPeriod.value === '6months') {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    startDate = sixMonthsAgo.toISOString().split('T')[0];
  } else if (selectedPeriod.value === 'year') {
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    startDate = startOfYear.toISOString().split('T')[0];
  }
  
  try {
    // Build query params
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate);
    }
    
    const response = await fetch(`/api/hours/monthly/${props.studentId}?${params.toString()}`);
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.statusMessage || 'Failed to load monthly hours data');
    }
    
    const data = await response.json();
    monthlyData.value = data;
  } catch (err: any) {
    console.error('Error loading monthly hours data:', err);
    error.value = err.message || 'Failed to load chart data';
  } finally {
    loading.value = false;
  }
}

// Format month label (from YYYY-MM to MMM YYYY)
function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}
</script>