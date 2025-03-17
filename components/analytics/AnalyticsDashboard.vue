<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Analytics Dashboard Header -->
      <div class="mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <p class="mt-1 text-sm text-gray-500">
              Advanced metrics and KPIs to track your school's performance
            </p>
          </div>
          <div class="flex space-x-2">
            <Dropdown
              v-model="dateRange"
              :options="dateRangeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Date Range"
              class="w-44"
              @change="loadAllData"
            />
            <Button
              icon="pi pi-refresh"
              @click="refreshData"
              :loading="isAnyLoading"
              aria-label="Refresh"
            />
          </div>
        </div>
      </div>

      <!-- Key Metrics Cards -->
      <div class="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Student Retention"
          :value="metrics.retentionRate + '%'"
          icon="pi pi-users"
          color="blue"
          :trend="metrics.retentionTrend"
          subtitle="Current period"
        />
        
        <StatCard
          title="Lead Conversion"
          :value="metrics.conversionRate + '%'"
          icon="pi pi-percentage"
          color="purple"
          :trend="metrics.conversionTrend"
          subtitle="vs. previous period"
        />
        
        <StatCard
          title="Avg. Completion Rate"
          :value="metrics.completionRate + '%'"
          icon="pi pi-check-circle"
          color="green"
          :trend="metrics.completionTrend"
          subtitle="Student completion"
        />
        
        <StatCard
          title="Revenue Per Student"
          :value="formatCurrency(metrics.revenuePerStudent)"
          icon="pi pi-dollar"
          color="yellow"
          :trend="metrics.revenueTrend"
          subtitle="Average"
        />
      </div>
      
      <!-- Primary Analytics Charts -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <!-- Student Enrollment Trends -->
        <AnalyticsEnrollementTrendsChart 
          :loading="loadingEnrollment" 
          :error="errorEnrollment"
          @refresh="loadEnrollmentData"
        />
        
        <!-- Lead Conversion Funnel -->
        <AnalyticsLeadConversionChart 
          :loading="loadingLeads" 
          :error="errorLeads"
          @refresh="loadLeadsData"
        />
      </div>
      
      <!-- Secondary Analytics Charts -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Student Progress -->
        <AnalyticsStudentProgressChart 
          :loading="loadingProgress" 
          :error="errorProgress"
          @refresh="loadProgressData"
        />
        
        <!-- Revenue Analysis -->
        <AnalyticsRevenueAnalysisChart 
          :loading="loadingRevenue" 
          :error="errorRevenue"
          @refresh="loadRevenueData"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import StatCard from '~/components/dashboard/StatCard.vue';

const toast = useToast();

// Date range selection
const dateRange = ref('last30days');
const dateRangeOptions = [
  { label: 'Last 30 Days', value: 'last30days' },
  { label: 'Last Quarter', value: 'lastQuarter' },
  { label: 'Last 6 Months', value: 'last6months' },
  { label: 'This Year', value: 'thisYear' },
  { label: 'Last Year', value: 'lastYear' },
  { label: 'All Time', value: 'allTime' }
];

// Loading states for each chart
const loadingEnrollment = ref(true);
const loadingLeads = ref(true);
const loadingProgress = ref(true);
const loadingRevenue = ref(true);

// Error states for each chart
const errorEnrollment = ref('');
const errorLeads = ref('');
const errorProgress = ref('');
const errorRevenue = ref('');

// Combined loading state
const isAnyLoading = computed(() => {
  return loadingEnrollment.value || 
         loadingLeads.value || 
         loadingProgress.value || 
         loadingRevenue.value;
});

// Key metrics data
const metrics = ref({
  retentionRate: 85,
  retentionTrend: 2.5,
  conversionRate: 32,
  conversionTrend: 4.2,
  completionRate: 78,
  completionTrend: -1.3,
  revenuePerStudent: 2450,
  revenueTrend: 5.7
});

onMounted(() => {
  loadAllData();
});

// Load all data based on selected date range
function loadAllData() {
  loadMetricsData();
  loadEnrollmentData();
  loadLeadsData();
  loadProgressData();
  loadRevenueData();
}

// Refresh all data
function refreshData() {
  toast.add({
    severity: 'info',
    summary: 'Refreshing',
    detail: 'Updating all analytics data...',
    life: 3000
  });
  
  loadAllData();
}

// Load core metrics data
async function loadMetricsData() {
  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    // const response = await $fetch('/api/analytics/metrics', {
    //   params: {
    //     period: dateRange.value
    //   }
    // });
    
    // metrics.value = response.data;
  } catch (err) {
    console.error('Failed to fetch metrics data:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load metrics data',
      life: 3000
    });
  }
}

// Load enrollment trends data
async function loadEnrollmentData() {
  loadingEnrollment.value = true;
  errorEnrollment.value = '';
  
  try {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulated API delay
    // Replace with actual API call:
    // await $fetch('/api/analytics/enrollment', {
    //   params: { period: dateRange.value }
    // });
    
    // Simulation successful
  } catch (err: any) {
    console.error('Failed to fetch enrollment data:', err);
    errorEnrollment.value = err.message || 'Failed to load enrollment data';
  } finally {
    loadingEnrollment.value = false;
  }
}

// Load lead conversion data
async function loadLeadsData() {
  loadingLeads.value = true;
  errorLeads.value = '';
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simulated API delay
    // Replace with actual API call:
    // await $fetch('/api/analytics/leads', {
    //   params: { period: dateRange.value }
    // });
    
    // Simulation successful
  } catch (err: any) {
    console.error('Failed to fetch lead conversion data:', err);
    errorLeads.value = err.message || 'Failed to load lead conversion data';
  } finally {
    loadingLeads.value = false;
  }
}

// Load student progress data
async function loadProgressData() {
  loadingProgress.value = true;
  errorProgress.value = '';
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API delay
    // Replace with actual API call:
    // await $fetch('/api/analytics/progress', {
    //   params: { period: dateRange.value }
    // });
    
    // Simulation successful
  } catch (err: any) {
    console.error('Failed to fetch student progress data:', err);
    errorProgress.value = err.message || 'Failed to load student progress data';
  } finally {
    loadingProgress.value = false;
  }
}

// Load revenue analysis data
async function loadRevenueData() {
  loadingRevenue.value = true;
  errorRevenue.value = '';
  
  try {
    await new Promise(resolve => setTimeout(resolve, 900)); // Simulated API delay
    // Replace with actual API call:
    // await $fetch('/api/analytics/revenue', {
    //   params: { period: dateRange.value }
    // });
    
    // Simulation successful
  } catch (err: any) {
    console.error('Failed to fetch revenue data:', err);
    errorRevenue.value = err.message || 'Failed to load revenue data';
  } finally {
    loadingRevenue.value = false;
  }
}

// Format currency values
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}
</script>