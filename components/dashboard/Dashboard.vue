<!-- components/Dashboard.vue -->
<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Dashboard Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p class="mt-1 text-sm text-gray-500">
          Welcome back{{ userGreeting }}. Here's what's happening at your school today.
        </p>
      </div>
      
      <!-- Stats Cards -->
      <div class="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          :value="stats.totalStudents"
          icon="pi pi-users"
          color="blue"
          :trend="stats.studentsTrend"
          subtitle="Current enrollment"
        />
        
        <StatCard
          title="New Leads"
          :value="stats.newLeads"
          icon="pi pi-bell"
          color="purple"
          :trend="stats.leadsTrend"
          subtitle="Last 30 days"
        />
        
        <StatCard
          title="Today's Attendance"
          :value="stats.attendanceRate + '%'"
          icon="pi pi-check-circle"
          color="green"
          :trend="stats.attendanceTrend"
          subtitle="vs. last week"
        />
        
        <StatCard
          title="Upcoming Certifications"
          :value="stats.upcomingCerts"
          icon="pi pi-file"
          color="yellow"
          :trend="undefined"
          subtitle="Next 30 days"
        />
      </div>
      
      <!-- Main Dashboard Content - Two Column Layout -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Left Column -->
        <div class="space-y-6">
          <!-- Attendance Card -->
          <AttendanceCard />
          
          <!-- Recent Students -->
          <RecentStudentsTable :limit="5" />
        </div>
        
        <!-- Right Column -->
        <div class="space-y-6">
          <!-- Student Status Distribution -->
          <StudentStatusChart />
          
          <!-- Upcoming Tasks -->
          <UpcomingTasksCard :limit="5" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '~/stores/user';
import StatCard from '~/components/dashboard/StatCard.vue';
import RecentStudentsTable from '~/components/dashboard/RecentStudentsTable.vue';
import StudentStatusChart from '~/components/dashboard/StudentStatusChart.vue';
import UpcomingTasksCard from '~/components/dashboard/UpcomingTasksCard.vue';
import AttendanceCard from '~/components/dashboard/AttendanceCard.vue';

const userStore = useUserStore();
const loading = ref(true);
const stats = ref({
  totalStudents: '0',
  studentsTrend: 0,
  newLeads: '0',
  leadsTrend: 0,
  attendanceRate: 0,
  attendanceTrend: 0,
  upcomingCerts: '0'
});

const userGreeting = computed(() => {
  return userStore.firstName ? `, ${userStore.firstName}` : '';
});

onMounted(async () => {
  try {
    const response = await $fetch('/api/dashboard/stats');
    stats.value = response.data;
  } catch (err) {
    console.error('Failed to fetch dashboard stats:', err);
  } finally {
    loading.value = false;
  }
});
</script>