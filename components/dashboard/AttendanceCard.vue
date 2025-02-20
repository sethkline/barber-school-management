<!-- components/dashboard/AttendanceCard.vue -->
<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Attendance Overview</h3>
        <Dropdown 
          v-model="selectedPeriod" 
          :options="periodOptions" 
          optionLabel="label"
          optionValue="value"
          class="w-36 text-sm"
        />
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-center items-center p-6" style="height: 250px">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>
    
    <div v-else-if="error" class="p-6 text-center text-red-600" style="height: 250px">
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
    
    <div v-else>
      <div class="p-4">
        <Chart type="bar" :data="chartData" :options="chartOptions" height="200" />
      </div>
      
      <div class="px-4 pb-4 grid grid-cols-3 gap-4">
        <div v-for="(stat, index) in attendanceStats" :key="index" 
          class="flex flex-col rounded-lg p-3" 
          :class="getStatBackground(stat.type)">
          <span class="text-sm font-medium mb-1">{{ stat.label }}</span>
          <div class="flex items-baseline">
            <span class="text-xl font-bold">{{ stat.value }}</span>
            <span class="text-sm ml-1">{{ stat.unit }}</span>
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

interface AttendanceStat {
  type: 'present' | 'absent' | 'late';
  label: string;
  value: number;
  unit: string;
}

interface AttendanceData {
  labels: string[];
  present: number[];
  absent: number[];
  late: number[];
  stats: AttendanceStat[];
}

const props = defineProps({
  initialPeriod: {
    type: String,
    default: 'week'
  }
});

const loading = ref(true);
const error = ref<string | null>(null);
const attendanceData = ref<AttendanceData | null>(null);
const selectedPeriod = ref(props.initialPeriod);

const periodOptions = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' }
];

// Compute chart data
const chartData = computed(() => {
  if (!attendanceData.value) {
    return {
      labels: [],
      datasets: []
    };
  }
  
  return {
    labels: attendanceData.value.labels,
    datasets: [
      {
        label: 'Present',
        backgroundColor: 'rgba(74, 222, 128, 0.8)',
        data: attendanceData.value.present
      },
      {
        label: 'Absent',
        backgroundColor: 'rgba(248, 113, 113, 0.8)',
        data: attendanceData.value.absent
      },
      {
        label: 'Late',
        backgroundColor: 'rgba(250, 204, 21, 0.8)',
        data: attendanceData.value.late
      }
    ]
  };
});

// Chart options
const chartOptions = {
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        boxWidth: 10
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false
      }
    },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  },
  responsive: true,
  maintainAspectRatio: false,
  barPercentage: 0.7
};

// Get attendance stats 
const attendanceStats = computed(() => {
  if (!attendanceData.value) return [];
  return attendanceData.value.stats;
});

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
    const response = await $fetch('/api/attendance/dashboard', {
      params: {
        period: selectedPeriod.value
      }
    });
    attendanceData.value = response.data;
  } catch (err: any) {
    console.error('Failed to load attendance data:', err);
    error.value = err.message || 'Failed to load data';
  } finally {
    loading.value = false;
  }
}

function getStatBackground(type: string) {
  switch (type) {
    case 'present':
      return 'bg-green-50 text-green-700';
    case 'absent':
      return 'bg-red-50 text-red-700';
    case 'late':
      return 'bg-yellow-50 text-yellow-700';
    default:
      return 'bg-gray-50 text-gray-700';
  }
}
</script>