export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          assessment_date: string | null
          assessment_type: string | null
          comment: string | null
          created_at: string | null
          id: string
          score: number | null
          student_id: string | null
        }
        Insert: {
          assessment_date?: string | null
          assessment_type?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          score?: number | null
          student_id?: string | null
        }
        Update: {
          assessment_date?: string | null
          assessment_type?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          score?: number | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          id: string
          status: string
          student_id: string | null
        }
        Insert: {
          attendance_date: string
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          id?: string
          status: string
          student_id?: string | null
        }
        Update: {
          attendance_date?: string
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          id?: string
          status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          name: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          name: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      communications: {
        Row: {
          body: string | null
          id: string
          lead_id: string | null
          sent_at: string | null
          student_id: string | null
          subject: string | null
          template_id: string | null
          to_email: string | null
          type: string | null
        }
        Insert: {
          body?: string | null
          id?: string
          lead_id?: string | null
          sent_at?: string | null
          student_id?: string | null
          subject?: string | null
          template_id?: string | null
          to_email?: string | null
          type?: string | null
        }
        Update: {
          body?: string | null
          id?: string
          lead_id?: string | null
          sent_at?: string | null
          student_id?: string | null
          subject?: string | null
          template_id?: string | null
          to_email?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "communication_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          email: string | null
          id: string
          name: string
          phone: string | null
          relationship: string | null
          student_id: string | null
        }
        Insert: {
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          relationship?: string | null
          student_id?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          relationship?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          city: string | null
          contacted_date: string | null
          created_at: string | null
          email: string
          first_name: string
          follow_up_date: string | null
          id: string
          last_name: string
          message: string | null
          phone: string | null
          schedule_interview: boolean | null
          status: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contacted_date?: string | null
          created_at?: string | null
          email: string
          first_name: string
          follow_up_date?: string | null
          id?: string
          last_name: string
          message?: string | null
          phone?: string | null
          schedule_interview?: boolean | null
          status?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contacted_date?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          follow_up_date?: string | null
          id?: string
          last_name?: string
          message?: string | null
          phone?: string | null
          schedule_interview?: boolean | null
          status?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      legacy_students: {
        Row: {
          address: string | null
          archived_at: string | null
          city: string | null
          email: string | null
          enrollment_date: string | null
          first_name: string | null
          graduation_date: string | null
          id: string
          last_name: string | null
          notes: string | null
          original_student_id: string | null
          phone: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          city?: string | null
          email?: string | null
          enrollment_date?: string | null
          first_name?: string | null
          graduation_date?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          original_student_id?: string | null
          phone?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          city?: string | null
          email?: string | null
          enrollment_date?: string | null
          first_name?: string | null
          graduation_date?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          original_student_id?: string | null
          phone?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      student_certifications: {
        Row: {
          awarded_date: string | null
          certification_name: string | null
          expiration_date: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          awarded_date?: string | null
          certification_name?: string | null
          expiration_date?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          awarded_date?: string | null
          certification_name?: string | null
          expiration_date?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_certifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          document_name: string | null
          expiration_date: string | null
          file_url: string | null
          id: string
          student_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          document_name?: string | null
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          student_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          document_name?: string | null
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          student_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_hours: {
        Row: {
          created_at: string | null
          date_recorded: string | null
          hours_completed: number | null
          id: string
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_recorded?: string | null
          hours_completed?: number | null
          id?: string
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_recorded?: string | null
          hours_completed?: number | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_hours_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string
          enrollment_date: string | null
          expected_graduation_date: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          photo_url: string | null
          status: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          enrollment_date?: string | null
          expected_graduation_date?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          photo_url?: string | null
          status?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          enrollment_date?: string | null
          expected_graduation_date?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          photo_url?: string | null
          status?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          status: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          status?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
