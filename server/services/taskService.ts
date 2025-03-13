import { getSupabaseClient } from '~/server/utils/supabaseClient'
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from '~/types/supabase'

// Define type aliases for convenience
type Task = Tables<'tasks'>
type TaskInsert = TablesInsert<'tasks'>
type TaskUpdate = TablesUpdate<'tasks'>

export interface ListTasksParams {
  page?: number
  limit?: number
  leadId?: string
  status?: string
  assignedTo?: string
}

export const taskService = {
  /**
   * Retrieve a paginated list of tasks.
   */
  async getTasks({
    page = 1,
    limit = 10,
    leadId = '',
    status = '',
    assignedTo = ''
  }: ListTasksParams): Promise<{ data: Task[]; count: number }> {
    const supabase = getSupabaseClient()

    // Begin building the query for the "tasks" table.
    let query = supabase
      .from<Task>('tasks')
      .select('*', { count: 'exact' })

    // Apply a filter by lead ID if provided.
    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    // Apply a filter by status if provided.
    if (status) {
      query = query.eq('status', status)
    }

    // Apply a filter by assignee if provided.
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    // Calculate pagination offsets.
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    
    // Order by due date
    query = query.order('due_date', { ascending: true })

    // Execute the query.
    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    return { data: data ?? [], count: count ?? 0 }
  },

  /**
   * Retrieve tasks for a specific lead.
   */
  async getTasksByLeadId(leadId: string): Promise<Task[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Task>('tasks')
      .select('*')
      .eq('lead_id', leadId)
      .order('due_date', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch tasks for lead ${leadId}: ${error.message}`)
    }
    return data ?? []
  },

  /**
   * Retrieve a single task by ID.
   */
  async getTaskById(id: string): Promise<Task> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Task>('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to get task with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Create a new task.
   */
  async createTask(taskData: TaskInsert): Promise<Task> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Task>('tasks')
      .insert(taskData)
      .single()

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }
    return data!
  },

  /**
   * Update an existing task.
   */
  async updateTask(id: string, taskData: TaskUpdate): Promise<Task> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Task>('tasks')
      .update(taskData)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to update task with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Delete a task.
   */
  async deleteTask(id: string): Promise<Task> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Task>('tasks')
      .delete()
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to delete task with ID ${id}: ${error.message}`)
    }
    return data!
  }
}