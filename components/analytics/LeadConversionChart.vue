<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Lead Conversion Funnel</h3>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-500">Overall Conversion: </span>
          <span class="font-medium text-primary-600">{{ overallConversion }}%</span>
        </div>
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
      <div class="flex">
        <!-- Funnel Chart -->
        <div class="w-1/2">
          <Chart type="bar" :data="funnelData" :options="funnelOptions" class="h-72" />
        </div>
        
        <!-- Conversion Rate Chart -->
        <div class="w-1/2 pl-4">
          <Chart type="line" :data="conversionData" :options="conversionOptions" class="h-72" />
        </div>
      </div>
      
      <!-- Detailed Stats -->
      <div class="mt-6 grid grid-cols-4 gap-4">
        <div 
          v-for="(stat, index) in conversionStats" 
          :key="index"
          class="p-3 bg-gray-50 rounded-lg"
        >
          <div class="text-sm text-gray-500">{{ stat.label }}</div>
          <div class="text-lg font-semibold">{{ stat.value }}</div>
          <div class="text-xs flex items-center" :class="stat.change >= 0 ? 'text-green-600' : 'text-red-600'">
            <i :class="stat.change >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="mr-1"></i>
            {{ Math.abs(stat.change) }}% vs previous
          </div>
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

// Sample data - replace with actual API data
const funnelStages = ['Inquiries', 'Contacted', 'Interviewed', 'Enrolled'];
const funnelValues = [120, 85, 47, 32];
const previousMonthConversions = [24, 28, 22, 26, 30, 34];
const currentMonthConversions = [28, 32, 30, 35, 38, 42];

// Overall conversion rate
const overallConversion = computed(() => {
  return Math.round((funnelValues[funnelValues.length - 1] / funnelValues[0]) * 100);
});

// Funnel chart data
const funnelData = computed(() => {
  return {
    labels: funnelStages,
    datasets: [
      {
        data: funnelValues,
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(255, 159, 64)'
        ],
        borderWidth: 1
      }
    ]
  };
});

// Funnel chart options
const funnelOptions = {
  indexAxis: 'y',
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const value = context.raw;
          const total = funnelValues[0];
          const percentage = Math.round((value / total) * 100);
          return `${value} leads (${percentage}% of total)`;
        }
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: {
        display: false
      }
    },
    y: {
      grid: {
        display: false
      }
    }
  },
  responsive: true,
  maintainAspectRatio: false
};

// Conversion trend chart data
const conversionData = computed(() => {
  return {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Previous Period',
        data: previousMonthConversions,
        borderColor: 'rgba(156, 163, 175, 1)',
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 3
      },
      {
        label: 'Current Period',
        data: currentMonthConversions,
        borderColor: 'rgba(79, 70, 229, 1)',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 3
      }
    ]
  };
});

// Conversion chart options
const conversionOptions = {
  plugins: {
    title: {
      display: true,
      text: 'Conversion Rate Trend (%)',
      font: {
        size: 14
      },
      padding: {
        bottom: 20
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return value + '%';
        }
      }
    }
  },
  responsive: true,
  maintainAspectRatio: false
};

// Detailed conversion stats
const conversionStats = ref([
  {
    label: 'Inquiries',
    value: '120',
    change: 8
  },
  {
    label: 'Contact Rate',
    value: '71%',
    change: 5
  },
  {
    label: 'Interview Rate',
    value: '55%',
    change: 12
  },
  {
    label: 'Enrollment Rate',
    value: '68%',
    change: -3
  }
]);
</script>