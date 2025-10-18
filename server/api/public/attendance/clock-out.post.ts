import { getSupabaseClient } from '~/server/utils/supabaseClient'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { studentId } = body

    if (!studentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Student ID is required',
      })
    }

    const supabase = getSupabaseClient()

    // Find active clock-in record
    const { data: existingRecord } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .is('clock_out', null)
      .single()

    if (!existingRecord) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No active clock-in found',
      })
    }

    // Update with clock out time
    const { data, error } = await supabase
      .from('attendance')
      .update({
        clock_out: new Date().toISOString(),
      })
      .eq('id', existingRecord.id)
      .select()
      .single()

    if (error) throw error

    // Get student name for confirmation
    const { data: student } = await supabase
      .from('students')
      .select('first_name, last_name')
      .eq('id', studentId)
      .single()

    return {
      success: true,
      message: 'Clocked out successfully',
      studentName: student ? `${student.first_name} ${student.last_name}` : 'Student',
      clockOut: data.clock_out,
    }
  } catch (error: any) {
    console.error('Clock out error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to clock out',
    })
  }
})
