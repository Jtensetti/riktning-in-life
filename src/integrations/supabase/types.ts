export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_catalog: {
        Row: {
          category: string
          color: string
          created_at: string
          default_minutes: number
          icon: string
          id: string
          label: string
          slug: string
          sort_order: number
          tags_json: Json
        }
        Insert: {
          category: string
          color?: string
          created_at?: string
          default_minutes?: number
          icon?: string
          id?: string
          label: string
          slug: string
          sort_order?: number
          tags_json?: Json
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          default_minutes?: number
          icon?: string
          id?: string
          label?: string
          slug?: string
          sort_order?: number
          tags_json?: Json
        }
        Relationships: []
      }
      activity_favorites: {
        Row: {
          activity_slug: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_slug: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_slug?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          activity_slug: string
          category: string
          color: string
          created_at: string
          date: string
          duration_minutes: number | null
          icon: string
          id: string
          label: string
          mood_delta: number | null
          note: string | null
          user_id: string
        }
        Insert: {
          activity_slug: string
          category: string
          color?: string
          created_at?: string
          date?: string
          duration_minutes?: number | null
          icon?: string
          id?: string
          label: string
          mood_delta?: number | null
          note?: string | null
          user_id: string
        }
        Update: {
          activity_slug?: string
          category?: string
          color?: string
          created_at?: string
          date?: string
          duration_minutes?: number | null
          icon?: string
          id?: string
          label?: string
          mood_delta?: number | null
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crisis_plans: {
        Row: {
          avoid_json: Json
          contacts_json: Json
          created_at: string
          helps_json: Json
          id: string
          professional_contacts_json: Json
          reasons_json: Json
          safe_places_json: Json
          updated_at: string
          user_id: string
          warning_signs_json: Json
        }
        Insert: {
          avoid_json?: Json
          contacts_json?: Json
          created_at?: string
          helps_json?: Json
          id?: string
          professional_contacts_json?: Json
          reasons_json?: Json
          safe_places_json?: Json
          updated_at?: string
          user_id: string
          warning_signs_json?: Json
        }
        Update: {
          avoid_json?: Json
          contacts_json?: Json
          created_at?: string
          helps_json?: Json
          id?: string
          professional_contacts_json?: Json
          reasons_json?: Json
          safe_places_json?: Json
          updated_at?: string
          user_id?: string
          warning_signs_json?: Json
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          anxiety: number | null
          created_at: string
          date: string
          daytime_bed_sofa_time_minutes: number | null
          energy: number | null
          function_score: number | null
          getting_started: number | null
          guilt_selfcriticism: number | null
          hopelessness: number | null
          id: string
          meaningful_activity: string | null
          medication_taken: string | null
          mood_heaviness: number | null
          movement_today: string | null
          note: string | null
          safety_status: string | null
          sleep_hours: number | null
          sleep_quality: number | null
          updated_at: string
          user_id: string
          weather_kind: string | null
          weather_temp_c: number | null
        }
        Insert: {
          anxiety?: number | null
          created_at?: string
          date?: string
          daytime_bed_sofa_time_minutes?: number | null
          energy?: number | null
          function_score?: number | null
          getting_started?: number | null
          guilt_selfcriticism?: number | null
          hopelessness?: number | null
          id?: string
          meaningful_activity?: string | null
          medication_taken?: string | null
          mood_heaviness?: number | null
          movement_today?: string | null
          note?: string | null
          safety_status?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          updated_at?: string
          user_id: string
          weather_kind?: string | null
          weather_temp_c?: number | null
        }
        Update: {
          anxiety?: number | null
          created_at?: string
          date?: string
          daytime_bed_sofa_time_minutes?: number | null
          energy?: number | null
          function_score?: number | null
          getting_started?: number | null
          guilt_selfcriticism?: number | null
          hopelessness?: number | null
          id?: string
          meaningful_activity?: string | null
          medication_taken?: string | null
          mood_heaviness?: number | null
          movement_today?: string | null
          note?: string | null
          safety_status?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          updated_at?: string
          user_id?: string
          weather_kind?: string | null
          weather_temp_c?: number | null
        }
        Relationships: []
      }
      exercise_sequences: {
        Row: {
          color: string
          created_at: string
          description: string
          exercise_ids_json: Json
          id: string
          slug: string
          time_of_day: string | null
          title: string
        }
        Insert: {
          color?: string
          created_at?: string
          description: string
          exercise_ids_json?: Json
          id?: string
          slug: string
          time_of_day?: string | null
          title: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          exercise_ids_json?: Json
          id?: string
          slug?: string
          time_of_day?: string | null
          title?: string
        }
        Relationships: []
      }
      exercise_sessions: {
        Row: {
          anxiety_after: number | null
          anxiety_before: number | null
          created_at: string
          date: string
          energy_after: number | null
          energy_before: number | null
          exercise_id: string
          id: string
          mood_after: number | null
          mood_before: number | null
          note: string | null
          user_id: string
        }
        Insert: {
          anxiety_after?: number | null
          anxiety_before?: number | null
          created_at?: string
          date?: string
          energy_after?: number | null
          energy_before?: number | null
          exercise_id: string
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          note?: string | null
          user_id: string
        }
        Update: {
          anxiety_after?: number | null
          anxiety_before?: number | null
          created_at?: string
          date?: string
          energy_after?: number | null
          energy_before?: number | null
          exercise_id?: string
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sessions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string
          duration_minutes: number
          evidence_json: Json
          id: string
          mechanism: string | null
          not_recommended_for_json: Json
          recommended_for_json: Json
          steps_json: Json
          title: string
          type: string
        }
        Insert: {
          category: string
          color?: string
          created_at?: string
          description: string
          duration_minutes: number
          evidence_json?: Json
          id?: string
          mechanism?: string | null
          not_recommended_for_json?: Json
          recommended_for_json?: Json
          steps_json?: Json
          title: string
          type: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          evidence_json?: Json
          id?: string
          mechanism?: string | null
          not_recommended_for_json?: Json
          recommended_for_json?: Json
          steps_json?: Json
          title?: string
          type?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          body_json: Json
          created_at: string
          date: string
          free_text: string | null
          id: string
          include_in_report: boolean
          linked_checkin_id: string | null
          template_type: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body_json?: Json
          created_at?: string
          date?: string
          free_text?: string | null
          id?: string
          include_in_report?: boolean
          linked_checkin_id?: string | null
          template_type: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body_json?: Json
          created_at?: string
          date?: string
          free_text?: string | null
          id?: string
          include_in_report?: boolean
          linked_checkin_id?: string | null
          template_type?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_linked_checkin_id_fkey"
            columns: ["linked_checkin_id"]
            isOneToOne: false
            referencedRelation: "daily_checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_articles: {
        Row: {
          body_md: string
          category: string
          color: string
          created_at: string
          excerpt: string
          id: string
          read_minutes: number
          related_exercise_ids_json: Json
          slug: string
          sources_json: Json
          title: string
        }
        Insert: {
          body_md: string
          category: string
          color: string
          created_at?: string
          excerpt: string
          id?: string
          read_minutes?: number
          related_exercise_ids_json?: Json
          slug: string
          sources_json?: Json
          title: string
        }
        Update: {
          body_md?: string
          category?: string
          color?: string
          created_at?: string
          excerpt?: string
          id?: string
          read_minutes?: number
          related_exercise_ids_json?: Json
          slug?: string
          sources_json?: Json
          title?: string
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          medication_id: string
          note: string | null
          side_effects_json: Json
          taken_status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          medication_id: string
          note?: string | null
          side_effects_json?: Json
          taken_status: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          medication_id?: string
          note?: string | null
          side_effects_json?: Json
          taken_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean
          created_at: string
          date_started: string | null
          date_stopped: string | null
          dose: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          date_started?: string | null
          date_stopped?: string | null
          dose?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          date_started?: string | null
          date_stopped?: string | null
          dose?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_forms: {
        Row: {
          answers_json: Json
          created_at: string
          date: string
          id: string
          total_score: number
          type: string
          user_id: string
        }
        Insert: {
          answers_json?: Json
          created_at?: string
          date?: string
          id?: string
          total_score: number
          type: string
          user_id: string
        }
        Update: {
          answers_json?: Json
          created_at?: string
          date?: string
          id?: string
          total_score?: number
          type?: string
          user_id?: string
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
