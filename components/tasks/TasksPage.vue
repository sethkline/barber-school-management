<template>
  <div class="container mx-auto px-4 py-8">
    <Toast />
    <ConfirmDialog />

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Task Management</h1>
      <Button label="Add New Task" icon="pi pi-plus" @click="showNewTaskModal = true" severity="primary" />
    </div>

    <!-- Filter Section -->
    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Status Filter -->
          <div class="field">
            <label for="status" class="font-medium">Status</label>
            <Dropdown
              id="status"
              v-model="statusFilter"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Statuses"
              class="w-full"
              @change="fetchTasks(1)"
            />
          </div>

          <!-- Assignee Filter -->
          <div class="field">
            <label for="assignee" class="font-medium">Assigned To</label>
            <InputText
              id="assignee"
              v-model="assigneeFilter"
              placeholder="Filter by assignee"
              class="w-full"
              @input="debounceFilter"
            />
          </div>
        </div>
      </template>
    </Card>

    <Tabs v-model:value="activeTabIndex">
      <TabList>
        <Tab v-for="(tab, index) in tabItems" :key="index" :value="index">
          <div class="flex items-center gap-2">
            <i :class="tab.icon"></i>
            <span>{{ tab.label }}</span>
          </div>
        </Tab>
      </TabList>
    </Tabs>

    <!-- Tasks Table -->
    <DataTable
      :value="filteredTasks"
      :loading="loading"
      stripedRows
      paginator
      :rows="pageSize"
      :totalRecords="totalTasks"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      v-model:first="first"
      @page="onPageChange($event)"
      tableStyle="min-width: 50rem"
      class="p-datatable-sm"
      removableSort
    >
      <template #empty>
        <div class="text-center py-4">No tasks found</div>
      </template>
      <template #loading>
        <div class="text-center py-4">Loading tasks data...</div>
      </template>

      <Column field="status" header="Status" style="width: 12rem">
        <template #body="{ data }">
          <div class="flex items-center">
            <Checkbox
              :modelValue="data.status === 'completed'"
              @update:modelValue="toggleTaskStatus(data)"
              :binary="true"
            />
            <Tag :value="data.status" :severity="data.status === 'completed' ? 'success' : 'warning'" class="ml-2" />
          </div>
        </template>
      </Column>

      <Column field="description" header="Description" sortable>
        <template #body="{ data }">
          <span :class="{ 'line-through text-gray-500': data.status === 'completed' }">
            {{ data.description }}
          </span>
        </template>
      </Column>

      <Column field="lead" header="Related Lead" style="width: 14rem">
        <template #body="{ data }">
          <div v-if="data.lead_id">
            <Button
              :label="getLeadName(data.lead_id)"
              link
            />
            <!-- @click="router.push(`/leads/${data.lead_id}`)" TODO add this when have more detailed lead page -->

          </div>
          <div v-else class="text-sm text-gray-500">No lead</div>
        </template>
      </Column>

      <Column field="due_date" header="Due Date" sortable style="width: 12rem">
        <template #body="{ data }">
          <Tag
            :value="data.due_date ? formatDate(data.due_date) : 'No due date'"
            :severity="getDateSeverity(data.due_date)"
          />
        </template>
      </Column>

      <Column field="assigned_to" header="Assigned To" sortable style="width: 12rem">
        <template #body="{ data }">
          {{ data.assigned_to || 'Unassigned' }}
        </template>
      </Column>

      <Column header="Actions" style="width: 8rem">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" @click="editTask(data)" text severity="primary" size="small" />
            <Button icon="pi pi-trash" @click="confirmDeleteTask(data.id)" text severity="danger" size="small" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Task Dialog -->
    <Dialog
      :visible="showNewTaskModal || showEditTaskModal"
      :header="showEditTaskModal ? 'Edit Task' : 'Add New Task'"
      :modal="true"
      :style="{ width: '40rem' }"
      :closeOnEscape="false"
      @update:visible="(value) => handleDialogVisibility(value)"
    >
      <form @submit.prevent="saveTask" class="p-4">
        <!-- Task Details Section -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Task Details</h3>

          <div class="grid grid-cols-1 gap-4">
            <div class="field">
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <InputText
                id="description"
                v-model="taskForm.description"
                required
                placeholder="Task description"
                autocomplete="off"
                class="w-full"
              />
            </div>

            <div class="field" v-if="!editingTaskId">
              <label for="lead_id" class="block text-sm font-medium text-gray-700 mb-1">Related Lead</label>
              <Dropdown
                id="lead_id"
                v-model="taskForm.lead_id"
                :options="leads"
                optionLabel="display_name"
                optionValue="id"
                placeholder="Select a lead"
                :filter="true"
                filterPlaceholder="Search lead"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Assignment Section -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Schedule & Assignment</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="field">
              <label for="due_date" class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <Calendar
                id="due_date"
                v-model="taskFormDate"
                dateFormat="yy-mm-dd"
                showIcon
                class="w-full"
                placeholder="Select due date"
              />
            </div>

            <div class="field">
              <label for="assigned_to" class="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <InputText
                id="assigned_to"
                v-model="taskForm.assigned_to"
                placeholder="Name of assignee"
                autocomplete="off"
                class="w-full"
              />
            </div>

            <div class="field md:col-span-2">
              <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Dropdown
                id="status"
                v-model="taskForm.status"
                :options="taskStatusOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Priority Section (New) -->
        <!-- <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Priority & Reminders</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="field">
              <label for="priority" class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <Dropdown
                id="priority"
                v-model="taskForm.priority"
                :options="[
                  { label: 'High', value: 'high' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'Low', value: 'low' }
                ]"
                optionLabel="label"
                optionValue="value"
                placeholder="Select priority"
                class="w-full"
              />
            </div>

            <div class="field">
              <label for="send_reminder" class="block text-sm font-medium text-gray-700 mb-1">Reminder</label>
              <div class="flex items-center bg-gray-50 p-2 rounded h-10">
                <Checkbox id="send_reminder" v-model="taskForm.send_reminder" :binary="true" />
                <label for="send_reminder" class="ml-2 text-sm text-gray-700"> Send email reminder </label>
              </div>
            </div>
          </div>
        </div> -->

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 mt-6 border-t pt-4">
          <Button label="Cancel" @click="cancelTaskModal" text class="px-4 py-2 text-gray-700 hover:text-gray-900" />
          <Button
            :label="showEditTaskModal ? 'Update Task' : 'Add Task'"
            type="submit"
            severity="primary"
            class="px-4 py-2"
          />
        </div>
      </form>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="showDeleteModal" header="Confirm Delete" :modal="true" :style="{ width: '30rem' }">
      <p class="text-gray-700">Are you sure you want to delete this task? This action cannot be undone.</p>
      <template #footer>
        <Button label="Cancel" @click="showDeleteModal = false" text />
        <Button label="Delete" @click="confirmDelete" severity="danger" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Tables, TablesInsert, TablesUpdate } from '~/types/supabase';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import type { MenuItem } from 'primevue/menuitem';

// Types
type Task = Tables<'tasks'>;
type Lead = Tables<'leads'>;

// Router
const router = useRouter();

// Services
const toast = useToast();
const confirm = useConfirm();

// State variables
const tasks = ref<Task[]>([]);
const leads = ref<Lead[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalTasks = ref(0);
const totalPages = ref(1);
const loading = ref(false);
const statusFilter = ref('');
const assigneeFilter = ref('');
const filterTimeout = ref<NodeJS.Timeout | null>(null);
const first = ref(0); // For DataTable pagination

// View/Filter Options
const currentView = ref('all'); // all, today, overdue, upcoming
const activeTabIndex = ref(0);
const tabItems = ref([
  { label: 'All Tasks', icon: 'pi pi-list', view: 'all' },
  { label: 'Due Today', icon: 'pi pi-calendar', view: 'today' },
  { label: 'Overdue', icon: 'pi pi-exclamation-triangle', view: 'overdue' },
  { label: 'Upcoming', icon: 'pi pi-calendar-plus', view: 'upcoming' }
]);

// Watch for tab changes
watch(activeTabIndex, (newIndex) => {
  currentView.value = tabItems.value[newIndex].view;
});

// Watch for view changes to sync tab index
watch(currentView, (newView) => {
  const index = tabItems.value.findIndex((tab) => tab.view === newView);
  if (index !== -1) {
    activeTabIndex.value = index;
  }
});

// Status options for dropdown
const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' }
];

// Task status options for form
const taskStatusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' }
];

// Modal control
const showNewTaskModal = ref(false);
const showEditTaskModal = ref(false);
const showDeleteModal = ref(false);
const editingTaskId = ref<string | null>(null);
const taskToDeleteId = ref<string | null>(null);

// Form state
const taskForm = ref<Partial<TablesInsert<'tasks'>>>({
  description: '',
  due_date: null,
  assigned_to: '',
  lead_id: '',
  status: 'pending'
});

// Handle due date separately for Calendar component
const taskFormDate = ref<Date | null>(null);

// Watch for changes in the date picker and update taskForm
watch(taskFormDate, (newDate) => {
  if (newDate) {
    // Format date to ISO string and take just the date part (YYYY-MM-DD)
    taskForm.value.due_date = newDate.toISOString().split('T')[0];
  } else {
    taskForm.value.due_date = null;
  }
});

// Fetch tasks and leads on component mount
onMounted(async () => {
  await fetchLeads();
  fetchTasks(1);
});

// Computed properties
const filteredTasks = computed(() => {
  let filtered = [...tasks.value];
  const today = new Date().toISOString().split('T')[0];

  // Filter based on tab view
  if (currentView.value === 'today') {
    filtered = filtered.filter((task) => task.due_date === today);
  } else if (currentView.value === 'overdue') {
    filtered = filtered.filter((task) => task.due_date && task.due_date < today && task.status !== 'completed');
  } else if (currentView.value === 'upcoming') {
    filtered = filtered.filter((task) => task.due_date && task.due_date > today);
  }

  return filtered;
});

// Format date helper function
function formatDate(dateString: string | null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// Check if date is today
function isToday(dateString: string | null) {
  if (!dateString) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateString === today;
}

// Check if date is overdue
function isOverdue(dateString: string | null) {
  if (!dateString) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateString < today;
}

// Get date tag severity
function getDateSeverity(dateString: string | null) {
  if (!dateString) return 'secondary';
  if (isOverdue(dateString)) return 'danger';
  if (isToday(dateString)) return 'success';
  return 'info';
}

// Handle DataTable pagination
function onPageChange(event: any) {
  const page = Math.floor(event.first / event.rows) + 1;
  fetchTasks(page);
}

// Debounce filter input to prevent too many API calls
function debounceFilter() {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }

  filterTimeout.value = setTimeout(() => {
    fetchTasks(1);
  }, 300);
}

// Fetch all leads for the task association dropdown
async function fetchLeads() {
  try {
    const response = await fetch('/api/leads?limit=100');

    if (!response.ok) {
      throw new Error('Failed to fetch leads');
    }

    const data = await response.json();
    console.log(data, 'data');
    // Add display_name property for dropdown
    leads.value = data.leads.map((lead: Lead) => ({
      ...lead,
      display_name: `${lead.first_name} ${lead.last_name}`
    }));
  } catch (error) {
    console.error('Error fetching leads:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load leads',
      life: 3000
    });
  }
}

const getLeadName = (leadId: string):string => {
  const leadInfo = leads.value.find((lead) => lead.id === leadId)
  console.log(leadInfo, 'leadInfo');
  if (leadInfo?.first_name && leadInfo?.last_name) {
    return `${leadInfo.first_name} ${leadInfo.last_name}`
  }
  return '';
}

// Fetch tasks from the API
async function fetchTasks(page: number) {
  if (page < 1 || (totalPages.value > 0 && page > totalPages.value)) {
    return;
  }

  loading.value = true;
  currentPage.value = page;
  first.value = (page - 1) * pageSize.value;

  try {
    const response = await fetch(
      `/api/tasks?page=${page}&limit=${pageSize.value}&status=${statusFilter.value}&assignedTo=${assigneeFilter.value}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }

    const data = await response.json();
    tasks.value = data.tasks;
    totalTasks.value = data.total;
    totalPages.value = data.totalPages;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load tasks',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
}

// Reset the task form
function resetTaskForm() {
  taskForm.value = {
    description: '',
    due_date: null,
    assigned_to: '',
    lead_id: '',
    status: 'pending'
  };
  taskFormDate.value = null;
  editingTaskId.value = null;
}

// Handle dialog visibility changes
function handleDialogVisibility(value: boolean) {
  if (!value) {
    cancelTaskModal();
  }
}

// Edit a task
function editTask(task: Task) {
  editingTaskId.value = task.id;
  taskForm.value = { ...task };

  // Convert string date to Date object for Calendar
  if (task.due_date) {
    taskFormDate.value = new Date(task.due_date);
  } else {
    taskFormDate.value = null;
  }

  showEditTaskModal.value = true;
}

// Save a task (create or update)
async function saveTask() {
  if (!taskForm.value.description) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Task description is required',
      life: 3000
    });
    return;
  }

  try {
    if (editingTaskId.value) {
      // Update existing task
      const response = await fetch(`/api/tasks/${editingTaskId.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskForm.value)
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      showEditTaskModal.value = false;
      
      // Then update the local data
      const updatedTask = await response.json();
      const index = tasks.value.findIndex((t) => t.id === editingTaskId.value);
      if (index !== -1) {
        tasks.value[index] = updatedTask.task;
      }

      // Reset the form
      resetTaskForm();

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Task updated successfully',
        life: 3000
      });
    } else {
      // Create new task
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskForm.value)
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      // Close the modal FIRST
      showNewTaskModal.value = false;
      
      // Reset the form
      resetTaskForm();
      
      // Refresh the task list
      fetchTasks(1);

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Task created successfully',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error saving task:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save task',
      life: 3000
    });
  }
}

// Cancel task modal
function cancelTaskModal() {
  showNewTaskModal.value = false;
  showEditTaskModal.value = false;
  resetTaskForm();
}

// Toggle task status
async function toggleTaskStatus(task: Task) {
  try {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    const response = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error('Failed to update task status');
    }

    // Update task in the local list
    const index = tasks.value.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      tasks.value[index].status = newStatus;
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Task marked as ${newStatus}`,
      life: 3000
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update task status',
      life: 3000
    });
  }
}

// Show delete confirmation modal
function confirmDeleteTask(taskId: string) {
  taskToDeleteId.value = taskId;
  showDeleteModal.value = true;
}

// Delete a task
async function confirmDelete() {
  if (!taskToDeleteId.value) return;

  try {
    const response = await fetch(`/api/tasks/${taskToDeleteId.value}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete task');
    }

    // Remove task from the local list
    tasks.value = tasks.value.filter((t) => t.id !== taskToDeleteId.value);
    totalTasks.value--;

    // If we deleted the last item on the page, go to the previous page
    if (tasks.value.length === 0 && currentPage.value > 1) {
      fetchTasks(currentPage.value - 1);
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Task deleted successfully',
      life: 3000
    });

    showDeleteModal.value = false;
    taskToDeleteId.value = null;
  } catch (error) {
    console.error('Error deleting task:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete task',
      life: 3000
    });
  }
}
</script>
