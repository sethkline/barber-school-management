import { createClient } from '@supabase/supabase-js'
import { useRuntimeConfig } from '#imports'

export const getSupabaseClient = () => {
  const config = useRuntimeConfig()
  return createClient(config.supabaseUrl, config.supabaseServiceKey)
}