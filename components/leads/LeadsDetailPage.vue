<template>
  <div class="container mx-auto px-4 py-8">
    <Toast />
    <ConfirmDialog />
    
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center">
        <Button 
          icon="pi pi-arrow-left" 
          label="Back to Leads" 
          @click="router.push('/leads')" 
          text
          class="mr-4"
        />
        <h1 class="text-2xl font-bold">Lead Details</h1>
      </div>
      <div class="flex gap-2">
        <Button 
          v-if="lead && lead.status !== 'converted'"
          icon="pi pi-user-plus" 
          label="Convert to Student" 
          @click="convertToStudent" 
          severity="success"
        />
        <Button 
          icon="pi pi-pencil" 
          label="Edit Lead" 
          @click="editLead" 
          severity="primary"
        />
      </div>
    </div>
    
    <!-- Loading state -->
    <ProgressSpinner v-if="loading" class="flex justify-center py-8" />
    
    <!-- Lead details -->
    <Card v-else-if="lead">
      <template #header>
        <div class="flex justify-between items-center p-4">
          <h2 class="text-xl font-semibold">{{ lead.first_name }} {{ lead.last_name }}</h2>
          <Tag 
            :severity="getTagSeverity(lead.status)" 
            :value="lead.status || 'New'"
          />
        </div>
      </template>
      
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Contact Information -->
          <div>
            <h3 class="text-lg font-medium mb-3">Contact Information</h3>
            <div class="space-y-2">
              <div>
                <span class="text-gray-500">Email:</span>
                <span class="ml-2">{{ lead.email }}</span>
              </div>
              <div>
                <span class="text-gray-500">Phone:</span>
                <span class="ml-2">{{ lead.phone || 'Not provided' }}</span>
              </div>
              <div>
                <span class="text-gray-500">Address:</span>
                <span class="ml-2">{{ formatAddress(lead) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Lead Information -->
          <div>
            <h3 class="text-lg font-medium mb-3">Lead Information</h3>
            <div class="space-y-2">
              <div>
                <span class="text-gray-500">Created:</span>
                <span class="ml-2">{{ formatDate(lead.created_at) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Last Contacted:</span>
                <span class="ml-2">{{ lead.contacted_date ? formatDate(lead.contacted_date) : 'Not contacted' }}</span>
              </div>
              <div>
                <span class="text-gray-500">Follow-up Date:</span>
                <span class="ml-2">{{ lead.follow_up_date ? formatDate(lead.follow_up_date) : 'None scheduled' }}</span>
              </div>
              <div>
                <span class="text-gray-500">Schedule Interview:</span>
                <span class="ml-2">{{ lead.schedule_interview ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Message/Notes -->
        <div class="mt-6 pt-4 border-t border-gray-200">
          <h3 class="text-lg font-medium mb-3">Message/Notes</h3>
          <p class="text-gray-700 whitespace-pre-line">{{ lead.message || 'No message or notes' }}</p>
        </div>
        
        <!-- Tasks Section -->
        <div class="mt-6 pt-4 border-t border-gray-200">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-medium">Tasks</h3>
            <Button 
              icon="pi pi-plus" 
              label="Add Task" 
              @click="showNewTaskModal = true" 
              text
            />
          </div>
          
          <Message v-if="tasks.length === 0" severity="info" text="No tasks assigned to this lead" class="w-full" />
          
          <div v-else>
            <div v-for="task in tasks" :key="task.id" class="py-3 border-bottom-1 border-gray-200">
              <div class="flex justify-between items-start">
                <div>
                  <div class="flex items-center">
                    <Checkbox 
                      :modelValue="task.status === 'completed'" 
                      @update:modelValue="toggleTaskStatus(task)" 
                      :binary="true"
                    />
                    <p 
                      class="ml-2 text-sm"
                      :class="{ 'line-through text-gray-500': task.status === 'completed' }"
                    >
                      {{ task.description }}
                    </p>
                  </div>
                  <div class="ml-6 text-xs text-gray-500 mt-1">
                    Due: {{ task.due_date ? formatDate(task.due_date) : 'No due date' }}
                    <span v-if="task.assigned_to" class="ml-2">
                      | Assigned to: {{ task.assigned_to }}
                    </span>
                  </div>
                </div>
                <Button 
                  icon="pi pi-trash" 
                  @click="deleteTask(task)" 
                  text
                  severity="danger"
                  size="small"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
    
    <!-- Error state -->
    <Message v-else severity="error" text="Failed to load lead details. Please try again." class="w-full" />
    
    <!-- Edit Lead Dialog -->
    <Dialog 
      v-model:visible="showEditModal" 
      header="Edit Lead" 
      :modal="true"
      :style="{ width: '50rem' }"
      :closeOnEscape="false"
    >
      <form @submit.prevent="saveLead" class="p-fluid">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="field">
            <label for="first_name" class="font-medium">First Name *</label>
            <InputText 
              id="first_name"
              v-model="leadForm.first_name" 
              required 
            />
          </div>
          <div class="field">
            <label for="last_name" class="font-medium">Last Name *</label>
            <InputText 
              id="last_name"
              v-model="leadForm.last_name" 
              required 
            />
          </div>
          <div class="field">
            <label for="email" class="font-medium">Email *</label>
            <InputText 
              id="email"
              v-model="leadForm.email" 
              required 
              type="email"
            />
          </div>
          <div class="field">
            <label for="phone" class="font-medium">Phone</label>
            <InputText 
              id="phone"
              v-model="leadForm.phone" 
              type="tel"
            />
          </div>
          <div class="field">
            <label for="address" class="font-medium">Address</label>
            <InputText 
              id="address"
              v-model="leadForm.address" 
            />
          </div>
          <div class="field">
            <label for="city" class="font-medium">City</label>
            <InputText 
              id="city"
              v-model="leadForm.city" 
            />
          </div>
          <div class="field">
            <label for="zip_code" class="font-medium">Zip Code</label>
            <InputText 
              id="zip_code"
              v-model="leadForm.zip_code" 
            />
          </div>
          <div class="field">
            <label for="status" class="font-medium">Status</label>
            <Dropdown 
              id="status"
              v-model="leadForm.status" 
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
            />
          </div>
          <div class="field">
            <label for="contacted_date" class="font-medium">Contacted Date</label>
            <Calendar 
              id="contacted_date"
              v-model="leadForm.contacted_date" 
              dateFormat="yy-mm-dd"
            />
          </div>
          <div class="field">
            <label for="follow_up_date" class="font-medium">Follow-up Date</label>
            <Calendar 
              id="follow_up_date"
              v-model="leadForm.follow_up_date" 
              dateFormat="yy-mm-dd"
            />
          </div>
          <div class="field md:col-span-2">
            <label for="message" class="font-medium">Message/Notes</label>
            <Textarea 
              id="message"
              v-model="leadForm.message" 
              rows="3" 
              autoResize
            />
          </div>
          <div class="field md:col-span-2">
            <div class="flex items-center">
              <Checkbox 
                id="schedule_interview" 
                v-model="leadForm.schedule_interview" 
                :binary="true"
              />
              <label for="schedule_interview" class="ml-2 font-medium">
                Schedule Interview
              </label>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-4">
          <Button 
            label="Cancel" 
            @click="showEditModal = false" 
            text
          />
          <Button 
            label="Update Lead" 
            type="submit" 
            severity="primary"
          />
        </div>
      </form>
    </Dialog>
    
    <!-- New Task Dialog -->
    <Dialog 
      v-model:visible="showNewTaskModal" 
      header="Add New Task" 
      :modal="true"
      :style="{ width: '30rem' }"
    >
      <form @submit.prevent="saveTask" class="p-fluid">
        <div class="field">
          <label for="description" class="font-medium">Description *</label>
          <InputText 
            id="description"
            v-model="taskForm.description" 
            required 
            placeholder="Task description"
          />
        </div>
        <div class="field">
          <label for="due_date" class="font-medium">Due Date</label>
          <Calendar 
            id="due_date"
            v-model="taskForm.due_date" 
            dateFormat="yy-mm-dd"
          />
        </div>
        <div class="field">
          <label for="assigned_to" class="font-medium">Assigned To</label>
          <InputText 
            id="assigned_to"
            v-model="taskForm.assigned_to" 
            placeholder="Name of assignee"
          />
        </div>
        
        <div class="flex justify-end gap-2 mt-4">
          <Button 
            label="Cancel" 
            @click="showNewTaskModal = false" 
            text
          />
          <Button 
            label="Add Task" 
            type="submit" 
            severity="primary"
          />
        </div>
      </form>
    </Dialog>
    
    <!-- Convert to Student Confirmation Dialog -->
    <Dialog 
      v-model:visible="showConvertModal" 
      header="Convert to Student" 
      :modal="true"
      :style="{ width: '30rem' }"
    >
      <p class="text-gray-700">
        Are you sure you want to convert this lead to a student? This will create a new student record with the lead's information.
      </p>
      <template #footer>
        <Button 
          label="Cancel" 
          @click="showConvertModal = false" 
          text
        />
        <Button 
          label="Convert" 
          @click="confirmConvert" 
          severity="success"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Tables, TablesInsert, TablesUpdate } from '~/types/supabase'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

// Types
type Lead = Tables<'leads'>
type Task = Tables<'tasks'>

// Router and route
const router = useRouter()
const route = useRoute()
const leadId = route.params.id as string

// Services
const toast = useToast()
const confirm = useConfirm()

// State variables
const lead = ref<Lead | null>(null)
const tasks = ref<Task[]>([])
const loading = ref(true)

// Modal control
const showEditModal = ref(false)
const showNewTaskModal = ref(false)
const showConvertModal = ref(false)

// Form state
const leadForm = ref<Partial<TablesUpdate<'leads'>>>({})
const taskForm = ref<Partial<TablesInsert<'tasks'>>>({
  description: '',
  due_date: '',
  assigned_to: '',
  status: 'pending'
})

// Status options for dropdown
const statusOptions = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Closed', value: 'closed' }
]

// Fetch lead details on component mount
onMounted(async () => {
  await fetchLeadDetails()
  await fetchTasks()
})

// Get tag severity based on lead status
function getTagSeverity(status: string | null) {
  switch(status) {
    case 'qualified': return 'success'
    case 'contacted': return 'info'
    case 'new': return 'warning'
    case 'converted': return 'primary'
    case 'closed': return 'secondary'
    default: return 'warning'
  }
}

// Fetch lead details
async function fetchLeadDetails() {
  loading.value = true
  
  try {
    const response = await fetch(`/api/leads/${leadId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch lead details')
    }
    
    const data = await response.json()
    lead.value = data.lead
    
    // Initialize the form with lead data
    leadForm.value = { ...data.lead }
  } catch (error) {
    console.error('Error fetching lead details:', error)
    lead.value = null
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load lead details',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Fetch tasks for this lead
async function fetchTasks() {
  try {
    const response = await fetch(`/api/leads/${leadId}/tasks`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch tasks')
    }
    
    const data = await response.json()
    tasks.value = data.tasks
  } catch (error) {
    console.error('Error fetching tasks:', error)
    tasks.value = []
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load tasks',
      life: 3000
    })
  }
}

// Format address helper function
function formatAddress(lead: Lead) {
  const parts = []
  if (lead.address) parts.push(lead.address)
  if (lead.city) parts.push(lead.city)
  if (lead.zip_code) parts.push(lead.zip_code)
  
  return parts.length > 0 ? parts.join(', ') : 'Not provided'
}

// Format date helper function
function formatDate(dateString: string | null) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Edit lead
function editLead() {
  leadForm.value = { ...lead.value }
  showEditModal.value = true
}

// Save lead changes
async function saveLead() {
  if (!lead.value) return
  
  try {
    const response = await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadForm.value)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update lead')
    }
    
    const data = await response.json()
    lead.value = data.lead
    
    // Close the modal
    showEditModal.value = false
    
    // Show success notification
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Lead updated successfully',
      life: 3000
    })
  } catch (error) {
    console.error('Error updating lead:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update lead',
      life: 3000
    })
  }
}

// Show convert confirmation modal
function convertToStudent() {
  showConvertModal.value = true
}

// Convert lead to student
async function confirmConvert() {
  try {
    const response = await fetch(`/api/leads/${leadId}/convert`, {
      method: 'POST'
    })
    
    if (!response.ok) {
      throw new Error('Failed to convert lead')
    }
    
    const data = await response.json()
    
    // Show success notification
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Lead successfully converted to student',
      life: 3000
    })
    
    showConvertModal.value = false
    
    // Redirect to the new student's page
    router.push(`/students/${data.student.id}`)
  } catch (error) {
    console.error('Error converting lead:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to convert lead to student',
      life: 3000
    })
  }
}

// Save a new task
async function saveTask() {
  if (!taskForm.value.description) return
  
  try {
    // Set the lead_id
    taskForm.value.lead_id = leadId
    
    const response = await fetch(`/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskForm.value)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create task')
    }
    
    // Reset form and close modal
    taskForm.value = {
      description: '',
      due_date: '',
      assigned_to: '',
      status: 'pending'
    }
    showNewTaskModal.value = false
    
    // Refresh tasks
    await fetchTasks()
    
    // Show success notification
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Task created successfully',
      life: 3000
    })
  } catch (error) {
    console.error('Error creating task:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create task',
      life: 3000
    })
  }
}

// Toggle task status
async function toggleTaskStatus(task: Task) {
  try {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    })
    
    if (!response.ok) {
      throw new Error('Failed to update task status')
    }
    
    // Update task in the local list
    const index = tasks.value.findIndex(t => t.id === task.id)
    if (index !== -1) {
      tasks.value[index].status = newStatus
    }
    
    // Show success notification
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Task marked as ${newStatus}`,
      life: 3000
    })
  } catch (error) {
    console.error('Error updating task status:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update task status',
      life: 3000
    })
  }
}

// Delete a task
function deleteTask(task: Task) {
  confirm.require({
    message: 'Are you sure you want to delete this task?',
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete task')
        }
        
        // Remove task from the local list
        tasks.value = tasks.value.filter(t => t.id !== task.id)
        
        // Show success notification
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Task deleted successfully',
          life: 3000
        })
      } catch (error) {
        console.error('Error deleting task:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete task',
          life: 3000
        })
      }
    }
  })
}
</script>