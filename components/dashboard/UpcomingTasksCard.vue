<!-- components/dashboard/UpcomingTasksCard.vue -->
<template>
  <div class="bg-white rounded-lg shadow">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Upcoming Tasks</h3>
        <NuxtLink to="/tasks" class="text-sm text-primary-600 hover:text-primary-800 flex items-center">
          View all
          <i class="pi pi-arrow-right ml-1"></i>
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center p-6">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
    </div>

    <div v-else-if="error" class="p-6 text-center text-red-600">
      <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
      <p>{{ error }}</p>
      <Button label="Try Again" icon="pi pi-refresh" class="mt-2" severity="secondary" @click="loadTasks" />
    </div>

    <div v-else-if="!tasks.length" class="p-6 text-center text-gray-500">
      <i class="pi pi-check-circle text-3xl mb-2 text-gray-400"></i>
      <p>No upcoming tasks</p>
    </div>

    <div v-else class="divide-y divide-gray-200">
      <div v-for="task in tasks" :key="task.id" class="p-4 hover:bg-gray-50">
        <div class="flex items-start">
          <div class="mt-1">
            <span class="h-8 w-8 rounded-full flex items-center justify-center" :class="priorityClass(task.priority)">
              <i :class="priorityIcon(task.priority)"></i>
            </span>
          </div>
          <div class="ml-3 flex-1">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-900">{{ task.description }}</p>
              <p class="text-xs text-gray-500">{{ formatDueDate(task.due_date) }}</p>
            </div>
            <div class="mt-1 flex items-center justify-between">
              <div class="flex items-center">
                <span class="text-xs" :class="statusClass(task.status)">
                  {{ formatStatus(task.status) }}
                </span>
                <span class="mx-2 text-gray-300">•</span>
                <span class="text-xs text-gray-500">
                  {{ task.assigned_to || 'Unassigned' }}
                </span>
              </div>
              <div>
                <Button
                  v-if="task.status !== 'completed'"
                  icon="pi pi-check"
                  rounded
                  text
                  severity="success"
                  aria-label="Mark Complete"
                  class="p-1"
                  @click="markComplete(task.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

interface Task {
  id: string;
  description: string;
  due_date: string | null;
  assigned_to: string | null;
  status: string | null;
  priority?: string;
  lead_id?: string;
}

const props = defineProps({
  limit: {
    type: Number,
    default: 5
  }
});

const tasks = ref<Task[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const toast = useToast();

onMounted(() => {
  loadTasks();
});

async function loadTasks() {
  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch('/api/tasks/upcoming', {
      params: {
        limit: props.limit
      }
    });
    tasks.value = response.data;
  } catch (err: any) {
    console.error('Failed to load upcoming tasks:', err);
    error.value = err.message || 'Failed to load tasks';
  } finally {
    loading.value = false;
  }
}

function formatDueDate(dateString: string | null): string {
  if (!dateString) return 'No due date';

  const dueDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dueDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (dueDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else if (dueDate < today) {
    const days = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days > 1 ? 's' : ''} overdue`;
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: dueDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    }).format(dueDate);
  }
}

function formatStatus(status: string | null): string {
  if (!status) return 'Pending';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

function statusClass(status: string | null): string {
  if (!status) return 'text-yellow-600';

  switch (status.toLowerCase()) {
    case 'pending':
      return 'text-yellow-600';
    case 'in_progress':
      return 'text-blue-600';
    case 'completed':
      return 'text-green-600';
    case 'cancelled':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}

function priorityClass(priority: string | undefined): string {
  if (!priority) return 'bg-gray-100 text-gray-600';

  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-600';
    case 'medium':
      return 'bg-yellow-100 text-yellow-600';
    case 'low':
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function priorityIcon(priority: string | undefined): string {
  if (!priority) return 'pi pi-flag';

  switch (priority.toLowerCase()) {
    case 'high':
      return 'pi pi-flag-fill';
    case 'medium':
      return 'pi pi-flag';
    case 'low':
      return 'pi pi-flag';
    default:
      return 'pi pi-flag';
  }
}

async function markComplete(taskId: string) {
  try {
    // Use the PUT endpoint instead and send the updated status
    await $fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: {
        status: 'completed'
      }
    });

    // Update local task status
    const taskIndex = tasks.value.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      tasks.value[taskIndex].status = 'completed';
    }

    toast.add({
      severity: 'success',
      summary: 'Task Completed',
      detail: 'Task has been marked as complete',
      life: 3000
    });
  } catch (err: any) {
    console.error('Failed to complete task:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to complete task. Please try again.',
      life: 3000
    });
  }
}
</script>
