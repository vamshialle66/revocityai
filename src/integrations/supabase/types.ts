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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      area_statistics: {
        Row: {
          area_name: string
          avg_fill_level: number | null
          created_at: string | null
          id: string
          last_complaint_at: string | null
          latitude: number
          longitude: number
          overflow_count: number | null
          predicted_next_overflow: string | null
          risk_level: string | null
          total_complaints: number | null
          updated_at: string | null
        }
        Insert: {
          area_name: string
          avg_fill_level?: number | null
          created_at?: string | null
          id?: string
          last_complaint_at?: string | null
          latitude: number
          longitude: number
          overflow_count?: number | null
          predicted_next_overflow?: string | null
          risk_level?: string | null
          total_complaints?: number | null
          updated_at?: string | null
        }
        Update: {
          area_name?: string
          avg_fill_level?: number | null
          created_at?: string | null
          id?: string
          last_complaint_at?: string | null
          latitude?: number
          longitude?: number
          overflow_count?: number | null
          predicted_next_overflow?: string | null
          risk_level?: string | null
          total_complaints?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      complaints: {
        Row: {
          address: string | null
          admin_notes: string | null
          ai_confidence: number | null
          ai_recommendations: string[] | null
          area_name: string | null
          assigned_department: string | null
          assigned_to: string | null
          cleanup_image_url: string | null
          cleanup_verified: boolean | null
          complaint_id: string
          complaint_status: string
          created_at: string | null
          disease_risk: string | null
          escalated_at: string | null
          escalation_level: number | null
          fill_level: number
          hygiene_risk: string | null
          id: string
          image_url: string | null
          is_high_risk_area: boolean | null
          latitude: number
          longitude: number
          mosquito_risk: string | null
          odor_risk: string | null
          overflow_frequency: number | null
          priority: string
          public_hygiene_impact: string | null
          reporter_email: string | null
          reporter_firebase_uid: string
          reporter_notes: string | null
          resolved_at: string | null
          sla_hours: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          ai_confidence?: number | null
          ai_recommendations?: string[] | null
          area_name?: string | null
          assigned_department?: string | null
          assigned_to?: string | null
          cleanup_image_url?: string | null
          cleanup_verified?: boolean | null
          complaint_id: string
          complaint_status?: string
          created_at?: string | null
          disease_risk?: string | null
          escalated_at?: string | null
          escalation_level?: number | null
          fill_level?: number
          hygiene_risk?: string | null
          id?: string
          image_url?: string | null
          is_high_risk_area?: boolean | null
          latitude: number
          longitude: number
          mosquito_risk?: string | null
          odor_risk?: string | null
          overflow_frequency?: number | null
          priority?: string
          public_hygiene_impact?: string | null
          reporter_email?: string | null
          reporter_firebase_uid: string
          reporter_notes?: string | null
          resolved_at?: string | null
          sla_hours?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          ai_confidence?: number | null
          ai_recommendations?: string[] | null
          area_name?: string | null
          assigned_department?: string | null
          assigned_to?: string | null
          cleanup_image_url?: string | null
          cleanup_verified?: boolean | null
          complaint_id?: string
          complaint_status?: string
          created_at?: string | null
          disease_risk?: string | null
          escalated_at?: string | null
          escalation_level?: number | null
          fill_level?: number
          hygiene_risk?: string | null
          id?: string
          image_url?: string | null
          is_high_risk_area?: boolean | null
          latitude?: number
          longitude?: number
          mosquito_risk?: string | null
          odor_risk?: string | null
          overflow_frequency?: number | null
          priority?: string
          public_hygiene_impact?: string | null
          reporter_email?: string | null
          reporter_firebase_uid?: string
          reporter_notes?: string | null
          resolved_at?: string | null
          sla_hours?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scan_history: {
        Row: {
          address: string | null
          ai_confidence: number | null
          area_name: string | null
          created_at: string | null
          disease_risk: string | null
          fill_level: number
          hygiene_risk: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          mosquito_risk: string | null
          odor_risk: string | null
          recommendation: string | null
          status: string
          user_firebase_uid: string
        }
        Insert: {
          address?: string | null
          ai_confidence?: number | null
          area_name?: string | null
          created_at?: string | null
          disease_risk?: string | null
          fill_level?: number
          hygiene_risk?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          mosquito_risk?: string | null
          odor_risk?: string | null
          recommendation?: string | null
          status?: string
          user_firebase_uid: string
        }
        Update: {
          address?: string | null
          ai_confidence?: number | null
          area_name?: string | null
          created_at?: string | null
          disease_risk?: string | null
          fill_level?: number
          hygiene_risk?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          mosquito_risk?: string | null
          odor_risk?: string | null
          recommendation?: string | null
          status?: string
          user_firebase_uid?: string
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          badges: string[] | null
          created_at: string | null
          firebase_uid: string
          flagged_reports: number | null
          id: string
          points: number
          total_reports: number | null
          trust_score: number | null
          updated_at: string | null
          valid_critical_reports: number | null
          verified_contributor: boolean | null
        }
        Insert: {
          badges?: string[] | null
          created_at?: string | null
          firebase_uid: string
          flagged_reports?: number | null
          id?: string
          points?: number
          total_reports?: number | null
          trust_score?: number | null
          updated_at?: string | null
          valid_critical_reports?: number | null
          verified_contributor?: boolean | null
        }
        Update: {
          badges?: string[] | null
          created_at?: string | null
          firebase_uid?: string
          flagged_reports?: number | null
          id?: string
          points?: number
          total_reports?: number | null
          trust_score?: number | null
          updated_at?: string | null
          valid_critical_reports?: number | null
          verified_contributor?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          firebase_uid: string
          id: string
          last_login: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          firebase_uid: string
          id?: string
          last_login?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          firebase_uid?: string
          id?: string
          last_login?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role:
        | {
            Args: { _user_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.get_user_role(_user_id => text), public.get_user_role(_user_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { _user_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.get_user_role(_user_id => text), public.get_user_role(_user_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
