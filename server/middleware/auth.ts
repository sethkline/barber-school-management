import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const accessToken = getCookie(event, 'access_token')
  
  if (accessToken) {
    try {
      // Get Supabase URL and key from environment variables
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables')
        return
      }
      
      // Create a Supabase client with the admin key
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Get user information from the token
      const { data, error } = await supabase.auth.getUser(accessToken)
      
      if (error) {
        console.error('Error getting user from token:', error.message)
        return
      }
      
      if (data.user) {
        // Set the user in the event context
        event.context.user = data.user
        console.log('User set in context:', data.user.id)
      }
    } catch (err) {
      console.error('Auth middleware error:', err)
    }
  }
})