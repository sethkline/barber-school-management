<!-- components/analytics/RevenueAnalysisChart.vue -->
<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Revenue Analysis</h3>
        <Dropdown
          v-model="viewMode"
          :options="viewModeOptions"
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
      
      <!-- Revenue Summary -->
      <div class="mt-4 grid grid-cols-3 gap-4">
        <div 
          v-for="(item, index) in revenueSummary" 
          :key="index"
          class="p-3 bg-gray-50 rounded-lg"
        >
          <div class="text-sm text-gray-500">{{ item.label }}</div>
          <div class="text-lg font-semibold mt-1">{{ item.value }}</div>
          <div class="flex items-center text-xs mt-1" :class="item.trend >= 0 ? 'text-green-600' : 'text-red-600'">
            <i :class="item.trend >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="mr-1"></i>
            {{ Math.abs(item.trend) }}% vs previous
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

// View mode selection
const viewMode = ref('monthly');
const viewModeOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'By Program', value: 'program' }
];

// Chart type based on view mode
const chartType = computed(() => {
  return viewMode.value === 'program' ? 'pie' : 'bar';
});

// Sample data for each view mode
const monthlyData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      type: 'bar',
      label: 'Revenue',
      backgroundColor: 'rgba(52, 211, 153, 0.7)',
      data: [12500, 14200, 15800, 13400, 16500, 17800, 16200, 17500, 18900, 19200, 18500, 21000]
    },
    {
      type: 'line',
      label: 'Expenses',
      borderColor: 'rgba(244, 63, 94, 1)',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      data: [10200, 11500, 12300, 11800, 13400, 14100, 13800, 14200, 15500, 15900, 15300, 17200]
    }
  ]
};

const quarterlyData = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [
    {
      type: 'bar',
      label: 'Revenue',
      backgroundColor: 'rgba(52, 211, 153, 0.7)',
      data: [42500, 47700, 52600, 58700]
    },
    {
      type: 'line',
      label: 'Expenses',
      borderColor: 'rgba(244, 63, 94, 1)',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      data: [34000, 39300, 43500, 48400]
    }
  ]
};

const programData = {
  labels: ['Cosmetology', 'Barbering', 'Esthetics', 'Nail Technology', 'Instructor'],
  datasets: [
    {
      label: 'Revenue by Program',
      backgroundColor: [
        'rgba(52, 211, 153, 0.7)',
        'rgba(14, 165, 233, 0.7)',
        'rgba(168, 85, 247, 0.7)',
        'rgba(251, 191, 36, 0.7)',
        'rgba(239, 68, 68, 0.7)'
      ],
      data: [85000, 62000, 45000, 38000, 25000]
    }
  ]
};

// Dynamic chart data based on selected view mode
const chartData = computed(() => {
  switch (viewMode.value) {
    case 'monthly':
      return monthlyData;
    case 'quarterly':
      return quarterlyData;
    case 'program':
      return programData;
    default:
      return monthlyData;
  }
});

// Chart options
const chartOptions = computed(() => {
  if (viewMode.value === 'program') {
    return {
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${formatCurrency(value)} (${Math.round((value / 255000) * 100)}%)`;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  } else {
    return {
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              return `${label}: ${formatCurrency(value)}`;
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }
});

// Revenue summary data
const revenueSummary = ref([
  {
    label: 'Total Revenue',
    value: '$201,500',
    trend: 8.5
  },
  {
    label: 'Profit Margin',
    value: '21.3%',
    trend: 2.7
  },
  {
    label: 'Avg. Revenue Per Student',
    value: '$2,450',
    trend: 5.2
  }
]);

// Format currency values
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Watch for view mode changes (in a real app, this would fetch new data)
watch(viewMode, () => {
  // In a real app, you would fetch new data based on the selected view mode
  console.log(`View mode changed to: ${viewMode.value}`);
});
</script>