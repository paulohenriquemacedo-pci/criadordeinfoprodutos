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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      brand_settings: {
        Row: {
          accent_color: string
          background_color: string
          body_font: string
          created_at: string
          heading_font: string
          id: string
          logo_url: string | null
          primary_color: string
          project_id: string
          secondary_color: string
          text_color: string
          updated_at: string
          visual_style: string
        }
        Insert: {
          accent_color?: string
          background_color?: string
          body_font?: string
          created_at?: string
          heading_font?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          project_id: string
          secondary_color?: string
          text_color?: string
          updated_at?: string
          visual_style?: string
        }
        Update: {
          accent_color?: string
          background_color?: string
          body_font?: string
          created_at?: string
          heading_font?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          project_id?: string
          secondary_color?: string
          text_color?: string
          updated_at?: string
          visual_style?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          context_modules: number[]
          created_at: string
          id: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          context_modules?: number[]
          created_at?: string
          id?: string
          project_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          context_modules?: number[]
          created_at?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_assets: {
        Row: {
          ai_background_url: string | null
          asset_type: string
          content_data: Json
          created_at: string
          format: string
          height: number
          id: string
          image_url: string | null
          project_id: string
          status: string
          task_id: string
          template_id: string
          updated_at: string
          version_id: string | null
          width: number
        }
        Insert: {
          ai_background_url?: string | null
          asset_type?: string
          content_data?: Json
          created_at?: string
          format?: string
          height?: number
          id?: string
          image_url?: string | null
          project_id: string
          status?: string
          task_id: string
          template_id?: string
          updated_at?: string
          version_id?: string | null
          width?: number
        }
        Update: {
          ai_background_url?: string | null
          asset_type?: string
          content_data?: Json
          created_at?: string
          format?: string
          height?: number
          id?: string
          image_url?: string | null
          project_id?: string
          status?: string
          task_id?: string
          template_id?: string
          updated_at?: string
          version_id?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "creative_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_assets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "creative_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_assets_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "creative_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_tasks: {
        Row: {
          category: string
          content_focus: string
          context_modules: number[] | null
          created_at: string
          description: string | null
          favorite_version_id: string | null
          id: string
          offer_item_id: string | null
          offer_item_type: string | null
          product_id: string | null
          project_id: string
          prompt_input: string | null
          status: string
          template_type: string | null
          title: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          content_focus?: string
          context_modules?: number[] | null
          created_at?: string
          description?: string | null
          favorite_version_id?: string | null
          id?: string
          offer_item_id?: string | null
          offer_item_type?: string | null
          product_id?: string | null
          project_id: string
          prompt_input?: string | null
          status?: string
          template_type?: string | null
          title: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          content_focus?: string
          context_modules?: number[] | null
          created_at?: string
          description?: string | null
          favorite_version_id?: string | null
          id?: string
          offer_item_id?: string | null
          offer_item_type?: string | null
          product_id?: string | null
          project_id?: string
          prompt_input?: string | null
          status?: string
          template_type?: string | null
          title?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_tasks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_versions: {
        Row: {
          content: string
          created_at: string
          id: string
          is_favorite: boolean
          refinement_prompt: string | null
          task_id: string
          version_number: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          refinement_prompt?: string | null
          task_id: string
          version_number?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          refinement_prompt?: string | null
          task_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "creative_versions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "creative_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      module_versions: {
        Row: {
          content: string
          created_at: string
          id: string
          module_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          module_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_versions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          custom_research: string | null
          generated_content: string | null
          generation_prompt: string | null
          id: string
          is_outdated: boolean
          last_updated: string
          module_number: number
          project_id: string
          research_chat: string | null
          research_citations: string[] | null
          research_gemini: string | null
          research_gemini_citations: string[] | null
          research_perplexity: string | null
          research_perplexity_citations: string[] | null
          research_prompt: string | null
          research_qwen: string | null
          research_qwen_citations: string[] | null
          research_result: string | null
        }
        Insert: {
          custom_research?: string | null
          generated_content?: string | null
          generation_prompt?: string | null
          id?: string
          is_outdated?: boolean
          last_updated?: string
          module_number: number
          project_id: string
          research_chat?: string | null
          research_citations?: string[] | null
          research_gemini?: string | null
          research_gemini_citations?: string[] | null
          research_perplexity?: string | null
          research_perplexity_citations?: string[] | null
          research_prompt?: string | null
          research_qwen?: string | null
          research_qwen_citations?: string[] | null
          research_result?: string | null
        }
        Update: {
          custom_research?: string | null
          generated_content?: string | null
          generation_prompt?: string | null
          id?: string
          is_outdated?: boolean
          last_updated?: string
          module_number?: number
          project_id?: string
          research_chat?: string | null
          research_citations?: string[] | null
          research_gemini?: string | null
          research_gemini_citations?: string[] | null
          research_perplexity?: string | null
          research_perplexity_citations?: string[] | null
          research_prompt?: string | null
          research_qwen?: string | null
          research_qwen_citations?: string[] | null
          research_result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_versions: {
        Row: {
          created_at: string
          id: string
          product_id: string
          snapshot: Json
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          snapshot: Json
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "offer_versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bonuses: {
        Row: {
          created_at: string
          delivery_type: string | null
          description: string | null
          id: string
          name: string
          perceived_value: number | null
          product_id: string
          sort_order: number
          strategic_function: string | null
        }
        Insert: {
          created_at?: string
          delivery_type?: string | null
          description?: string | null
          id?: string
          name: string
          perceived_value?: number | null
          product_id: string
          sort_order?: number
          strategic_function?: string | null
        }
        Update: {
          created_at?: string
          delivery_type?: string | null
          description?: string | null
          id?: string
          name?: string
          perceived_value?: number | null
          product_id?: string
          sort_order?: number
          strategic_function?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_bonuses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bumps: {
        Row: {
          bump_type: string
          created_at: string
          description: string | null
          id: string
          name: string
          price: number | null
          product_id: string
          sort_order: number
          trigger_point: string | null
          value_proposition: string | null
        }
        Insert: {
          bump_type?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number | null
          product_id: string
          sort_order?: number
          trigger_point?: string | null
          value_proposition?: string | null
        }
        Update: {
          bump_type?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          product_id?: string
          sort_order?: number
          trigger_point?: string | null
          value_proposition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_bumps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_chapters: {
        Row: {
          chapter_order: number
          created_at: string
          generated_content: string | null
          id: string
          last_updated: string
          project_id: string
          status: string
          title: string
        }
        Insert: {
          chapter_order: number
          created_at?: string
          generated_content?: string | null
          id?: string
          last_updated?: string
          project_id: string
          status?: string
          title?: string
        }
        Update: {
          chapter_order?: number
          created_at?: string
          generated_content?: string | null
          id?: string
          last_updated?: string
          project_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_chapters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          delivery_format: string | null
          description: string | null
          id: string
          name: string
          positioning: string | null
          price: number | null
          product_type: string
          project_id: string
          status: string
          target_transformation: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_format?: string | null
          description?: string | null
          id?: string
          name: string
          positioning?: string | null
          price?: number | null
          product_type?: string
          project_id: string
          status?: string
          target_transformation?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_format?: string | null
          description?: string | null
          id?: string
          name?: string
          positioning?: string | null
          price?: number | null
          product_type?: string
          project_id?: string
          status?: string
          target_transformation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string
          extracted_text: string | null
          file_name: string | null
          file_type: string
          file_url: string
          id: string
          processing_status: string
          project_id: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          file_name?: string | null
          file_type: string
          file_url: string
          id?: string
          processing_status?: string
          project_id: string
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          file_name?: string | null
          file_type?: string
          file_url?: string
          id?: string
          processing_status?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          niche: string | null
          promise: string | null
          status: string
          strategic_memory: Json | null
          target_audience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          niche?: string | null
          promise?: string | null
          status?: string
          strategic_memory?: Json | null
          target_audience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          niche?: string | null
          promise?: string | null
          status?: string
          strategic_memory?: Json | null
          target_audience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          id: string
          module_number: number
          prompt_text: string
        }
        Insert: {
          id?: string
          module_number: number
          prompt_text: string
        }
        Update: {
          id?: string
          module_number?: number
          prompt_text?: string
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
