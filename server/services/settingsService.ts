// server/services/settingsService.ts
import { getSupabaseClient } from '~/server/utils/supabaseClient'
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from '~/types/supabase'

// Define types for settings
export interface SchoolInfo {
  id?: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  phone: string
  email: string
  website: string
  logo_url?: string
  description?: string
  established_year?: number
}

export interface ProgramRequirement {
  id?: string
  program_name: string
  required_hours: number
  certification_name: string
  description: string
  is_active: boolean
}

export const SETTINGS_TABLE = 'system_settings'

export const settingsService = {
  /**
   * Get school information
   */
  async getSchoolInfo(): Promise<SchoolInfo> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('*')
      .eq('setting_type', 'school_info')
      .single()
    
    if (error) {
      // If no record found, return default values
      if (error.code === 'PGRST116') {
        return {
          name: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          phone: '',
          email: '',
          website: ''
        }
      }
      throw new Error(`Failed to get school info: ${error.message}`)
    }
    
    return JSON.parse(data.setting_value)
  },
  
  /**
   * Update school information
   */
  async updateSchoolInfo(schoolInfo: SchoolInfo): Promise<SchoolInfo> {
    const supabase = getSupabaseClient()
    
    // Check if school info already exists
    const { data: existingData, error: checkError } = await supabase
      .from(SETTINGS_TABLE)
      .select('id')
      .eq('setting_type', 'school_info')
      .maybeSingle()
    
    const settingValue = JSON.stringify(schoolInfo)
    
    if (existingData?.id) {
      // Update existing record
      const { error } = await supabase
        .from(SETTINGS_TABLE)
        .update({
          setting_value: settingValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id)
      
      if (error) {
        throw new Error(`Failed to update school info: ${error.message}`)
      }
    } else {
      // Create new record
      const { error } = await supabase
        .from(SETTINGS_TABLE)
        .insert({
          setting_type: 'school_info',
          setting_value: settingValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        throw new Error(`Failed to create school info: ${error.message}`)
      }
    }
    
    return schoolInfo
  },
  
  /**
   * Get program requirements
   */
  async getProgramRequirements(): Promise<ProgramRequirement[]> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('*')
      .eq('setting_type', 'program_requirements')
      .single()
    
    if (error) {
      // If no records found, return empty array
      if (error.code === 'PGRST116') {
        return []
      }
      throw new Error(`Failed to get program requirements: ${error.message}`)
    }
    
    return JSON.parse(data.setting_value)
  },
  
  /**
   * Update program requirements
   */
  async updateProgramRequirements(requirements: ProgramRequirement[]): Promise<ProgramRequirement[]> {
    const supabase = getSupabaseClient()
    
    // Check if program requirements already exist
    const { data: existingData, error: checkError } = await supabase
      .from(SETTINGS_TABLE)
      .select('id')
      .eq('setting_type', 'program_requirements')
      .maybeSingle()
    
    const settingValue = JSON.stringify(requirements)
    
    if (existingData?.id) {
      // Update existing record
      const { error } = await supabase
        .from(SETTINGS_TABLE)
        .update({
          setting_value: settingValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id)
      
      if (error) {
        throw new Error(`Failed to update program requirements: ${error.message}`)
      }
    } else {
      // Create new record
      const { error } = await supabase
        .from(SETTINGS_TABLE)
        .insert({
          setting_type: 'program_requirements',
          setting_value: settingValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        throw new Error(`Failed to create program requirements: ${error.message}`)
      }
    }
    
    return requirements
  },
  
  /**
   * Add a new program requirement
   */
  async addProgramRequirement(requirement: ProgramRequirement): Promise<ProgramRequirement[]> {
    const currentRequirements = await this.getProgramRequirements()
    
    // Generate an id if not provided
    if (!requirement.id) {
      requirement.id = crypto.randomUUID()
    }
    
    const updatedRequirements = [...currentRequirements, requirement]
    await this.updateProgramRequirements(updatedRequirements)
    
    return updatedRequirements
  },
  
  /**
   * Update a program requirement
   */
  async updateProgramRequirement(requirement: ProgramRequirement): Promise<ProgramRequirement[]> {
    const currentRequirements = await this.getProgramRequirements()
    
    const updatedRequirements = currentRequirements.map(req => 
      req.id === requirement.id ? requirement : req
    )
    
    await this.updateProgramRequirements(updatedRequirements)
    
    return updatedRequirements
  },
  
  /**
   * Delete a program requirement
   */
  async deleteProgramRequirement(requirementId: string): Promise<ProgramRequirement[]> {
    const currentRequirements = await this.getProgramRequirements()
    
    const updatedRequirements = currentRequirements.filter(req => req.id !== requirementId)
    
    await this.updateProgramRequirements(updatedRequirements)
    
    return updatedRequirements
  },
  
  /**
   * Get system theme settings
   */
  async getThemeSettings(): Promise<any> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('*')
      .eq('setting_type', 'theme_settings')
      .single()
    
    if (error) {
      // If no record found, return default values
      if (error.code === 'PGRST116') {
        return {
          primaryColor: '#ef4444',
          secondaryColor: '#0ea5e9',
          darkMode: false,
          customLogo: false,
          logoUrl: ''
        }
      }
      throw new Error(`Failed to get theme settings: ${error.message}`)
    }
    
    return JSON.parse(data.setting_value)
  },
  
  /**
   * Update system theme settings
   */
  async updateThemeSettings(themeSettings: any): Promise<any> {
    const supabase = getSupabaseClient()
    
    // Check if theme settings already exist
    const { data: existingData, error: checkError } = await supabase
      .from(SETTINGS_TABLE)
      .select('id')
      .eq('setting_type', 'theme_settings')
      .maybeSingle()
    
    const settingValue = JSON.stringify(themeSettings)
    
    if (existingData?.id) {
      // Update existing record
      const { error } = await supabase
        .from(SETTINGS_TABLE)
        .update({
          setting_value: settingValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id)
      
      if (error) {
        throw new Error(`Failed to update theme settings: ${error.message}`)
      }
    } else {
      // Create new record
      const { error } = await supabase
        .from(SETTINGS_TABLE)
        .insert({
          setting_type: 'theme_settings',
          setting_value: settingValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        throw new Error(`Failed to create theme settings: ${error.message}`)
      }
    }
    
    return themeSettings
  }
}