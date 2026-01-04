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
      batch_runs: {
        Row: {
          base_coil_count: number
          base_magnetic_field_strength: number
          base_plasma_density: number
          base_simulation_resolution: Database["public"]["Enums"]["simulation_resolution"]
          completed_at: string | null
          created_at: string
          description: string | null
          end_value: number
          experiment_id: string | null
          id: string
          name: string
          start_value: number
          status: Database["public"]["Enums"]["simulation_status"]
          step_count: number
          sweep_parameter: string
        }
        Insert: {
          base_coil_count: number
          base_magnetic_field_strength: number
          base_plasma_density: number
          base_simulation_resolution?: Database["public"]["Enums"]["simulation_resolution"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          end_value: number
          experiment_id?: string | null
          id?: string
          name: string
          start_value: number
          status?: Database["public"]["Enums"]["simulation_status"]
          step_count?: number
          sweep_parameter: string
        }
        Update: {
          base_coil_count?: number
          base_magnetic_field_strength?: number
          base_plasma_density?: number
          base_simulation_resolution?: Database["public"]["Enums"]["simulation_resolution"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          end_value?: number
          experiment_id?: string | null
          id?: string
          name?: string
          start_value?: number
          status?: Database["public"]["Enums"]["simulation_status"]
          step_count?: number
          sweep_parameter?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_runs_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      parameter_presets: {
        Row: {
          coil_count: number
          created_at: string
          description: string | null
          id: string
          is_builtin: boolean
          magnetic_field_strength: number
          name: string
          plasma_density: number
          simulation_resolution: Database["public"]["Enums"]["simulation_resolution"]
        }
        Insert: {
          coil_count: number
          created_at?: string
          description?: string | null
          id?: string
          is_builtin?: boolean
          magnetic_field_strength: number
          name: string
          plasma_density: number
          simulation_resolution?: Database["public"]["Enums"]["simulation_resolution"]
        }
        Update: {
          coil_count?: number
          created_at?: string
          description?: string | null
          id?: string
          is_builtin?: boolean
          magnetic_field_strength?: number
          name?: string
          plasma_density?: number
          simulation_resolution?: Database["public"]["Enums"]["simulation_resolution"]
        }
        Relationships: []
      }
      scheduled_simulations: {
        Row: {
          coil_count: number
          created_at: string
          experiment_id: string | null
          id: string
          magnetic_field_strength: number
          plasma_density: number
          scheduled_at: string
          simulation_id: string | null
          simulation_resolution: Database["public"]["Enums"]["simulation_resolution"]
          status: string
        }
        Insert: {
          coil_count: number
          created_at?: string
          experiment_id?: string | null
          id?: string
          magnetic_field_strength: number
          plasma_density: number
          scheduled_at: string
          simulation_id?: string | null
          simulation_resolution?: Database["public"]["Enums"]["simulation_resolution"]
          status?: string
        }
        Update: {
          coil_count?: number
          created_at?: string
          experiment_id?: string | null
          id?: string
          magnetic_field_strength?: number
          plasma_density?: number
          scheduled_at?: string
          simulation_id?: string | null
          simulation_resolution?: Database["public"]["Enums"]["simulation_resolution"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_simulations_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_simulations_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          simulation_id: string
          time_point: number | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          simulation_id: string
          time_point?: number | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          simulation_id?: string
          time_point?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_comments_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_results: {
        Row: {
          confinement_score: number
          created_at: string
          energy_loss: number
          id: string
          job_id: string
          stability_index: number
          time_series: Json
        }
        Insert: {
          confinement_score: number
          created_at?: string
          energy_loss: number
          id?: string
          job_id: string
          stability_index: number
          time_series?: Json
        }
        Update: {
          confinement_score?: number
          created_at?: string
          energy_loss?: number
          id?: string
          job_id?: string
          stability_index?: number
          time_series?: Json
        }
        Relationships: [
          {
            foreignKeyName: "simulation_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          batch_run_id: string | null
          coil_count: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          experiment_id: string | null
          id: string
          magnetic_field_strength: number
          plasma_density: number
          simulation_resolution: Database["public"]["Enums"]["simulation_resolution"]
          started_at: string | null
          status: Database["public"]["Enums"]["simulation_status"]
        }
        Insert: {
          batch_run_id?: string | null
          coil_count: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          experiment_id?: string | null
          id?: string
          magnetic_field_strength: number
          plasma_density: number
          simulation_resolution?: Database["public"]["Enums"]["simulation_resolution"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["simulation_status"]
        }
        Update: {
          batch_run_id?: string | null
          coil_count?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          experiment_id?: string | null
          id?: string
          magnetic_field_strength?: number
          plasma_density?: number
          simulation_resolution?: Database["public"]["Enums"]["simulation_resolution"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["simulation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "simulations_batch_run_id_fkey"
            columns: ["batch_run_id"]
            isOneToOne: false
            referencedRelation: "batch_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
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
      simulation_resolution: "low" | "medium" | "high"
      simulation_status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED"
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
      simulation_resolution: ["low", "medium", "high"],
      simulation_status: ["PENDING", "RUNNING", "COMPLETED", "FAILED"],
    },
  },
} as const
