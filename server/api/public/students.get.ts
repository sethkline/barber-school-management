import { getSupabaseClient } from '~/server/utils/supabaseClient'

// Public endpoint - no auth required
export default defineEventHandler(async (event) => {
  try {
    const supabase = getSupabaseClient()

    // Get all active students for the dropdown
    const { data, error } = await supabase
      .from('students')
      .select('id, first_name, last_name, profile_image_url, status')
      .eq('status', 'active')
      .order('last_name', { ascending: true })

    if (error) throw error

    return data.map(student => ({
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      imageUrl: student.profile_image_url,
    }))
  } catch (error: any) {
    console.error('Error fetching students:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch students',
    })
  }
})
