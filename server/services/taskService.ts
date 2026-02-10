// server/services/taskService.ts
import { eq, sql, and, asc } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import {
  tasks,
  type Task,
  type NewTask
} from '~/server/db/schema'

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
    const db = getDb()
    const offset = (page - 1) * limit

    const conditions = []
    if (leadId) {
      conditions.push(eq(tasks.leadId, leadId))
    }
    if (status) {
      conditions.push(eq(tasks.status, status))
    }
    if (assignedTo) {
      conditions.push(eq(tasks.assignedTo, assignedTo))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const data = await db
      .select()
      .from(tasks)
      .where(whereClause)
      .orderBy(asc(tasks.dueDate))
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(whereClause)

    const count = Number(countResult[0]?.count ?? 0)

    return { data, count }
  },

  /**
   * Retrieve tasks for a specific lead.
   */
  async getTasksByLeadId(leadId: string): Promise<Task[]> {
    const db = getDb()
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.leadId, leadId))
      .orderBy(asc(tasks.dueDate))
  },

  /**
   * Retrieve a single task by ID.
   */
  async getTaskById(id: string): Promise<Task> {
    const db = getDb()
    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error(`Task with ID ${id} not found`)
    }
    return result[0]
  },

  /**
   * Create a new task.
   */
  async createTask(taskData: NewTask): Promise<Task> {
    const db = getDb()
    const result = await db
      .insert(tasks)
      .values(taskData)
      .returning()

    if (!result[0]) {
      throw new Error('Failed to create task')
    }
    return result[0]
  },

  /**
   * Update an existing task.
   */
  async updateTask(id: string, taskData: Partial<NewTask>): Promise<Task> {
    const db = getDb()
    const result = await db
      .update(tasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to update task with ID ${id}`)
    }
    return result[0]
  },

  /**
   * Delete a task.
   */
  async deleteTask(id: string): Promise<Task> {
    const db = getDb()
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning()

    if (!result[0]) {
      throw new Error(`Failed to delete task with ID ${id}`)
    }
    return result[0]
  }
}
