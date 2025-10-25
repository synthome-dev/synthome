export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audio: {
        Row: {
          created_at: string;
          duration: number | null;
          end_at: number | null;
          id: number;
          project_id: number;
          scene_id: number | null;
          src: string | null;
          start_at: number | null;
          transcript: Json | null;
          trim_end: number | null;
          trim_start: number | null;
          type: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          duration?: number | null;
          end_at?: number | null;
          id?: number;
          project_id: number;
          scene_id?: number | null;
          src?: string | null;
          start_at?: number | null;
          transcript?: Json | null;
          trim_end?: number | null;
          trim_start?: number | null;
          type?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          duration?: number | null;
          end_at?: number | null;
          id?: number;
          project_id?: number;
          scene_id?: number | null;
          src?: string | null;
          start_at?: number | null;
          transcript?: Json | null;
          trim_end?: number | null;
          trim_start?: number | null;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audio_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audio_scene_id_fkey";
            columns: ["scene_id"];
            isOneToOne: false;
            referencedRelation: "scenes";
            referencedColumns: ["id"];
          },
        ];
      };
      chats: {
        Row: {
          chat_id: string | null;
          created_at: string | null;
          generation_in_progress: boolean;
          id: number;
          last_tool_call_id: string | null;
          organization_id: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
          video: Json | null;
        };
        Insert: {
          chat_id?: string | null;
          created_at?: string | null;
          generation_in_progress?: boolean;
          id?: number;
          last_tool_call_id?: string | null;
          organization_id?: string | null;
          title: string;
          updated_at?: string | null;
          user_id?: string;
          video?: Json | null;
        };
        Update: {
          chat_id?: string | null;
          created_at?: string | null;
          generation_in_progress?: boolean;
          id?: number;
          last_tool_call_id?: string | null;
          organization_id?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
          video?: Json | null;
        };
        Relationships: [];
      };
      credits: {
        Row: {
          balance: number | null;
          created_at: string;
          id: number;
          is_free: boolean;
          next_reset_at: string | null;
          user_id: string | null;
        };
        Insert: {
          balance?: number | null;
          created_at?: string;
          id?: number;
          is_free?: boolean;
          next_reset_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          balance?: number | null;
          created_at?: string;
          id?: number;
          is_free?: boolean;
          next_reset_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      kv: {
        Row: {
          id: number;
          key: string | null;
          value: Json | null;
        };
        Insert: {
          id?: number;
          key?: string | null;
          value?: Json | null;
        };
        Update: {
          id?: number;
          key?: string | null;
          value?: Json | null;
        };
        Relationships: [];
      };
      media: {
        Row: {
          config_file: string | null;
          created_at: string;
          diffusers_lora_file: string | null;
          id: number;
          is_public: boolean | null;
          name: string | null;
          organization_id: string | null;
          path: string | null;
          reference_type: string | null;
          status: string | null;
          type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          config_file?: string | null;
          created_at?: string;
          diffusers_lora_file?: string | null;
          id?: number;
          is_public?: boolean | null;
          name?: string | null;
          organization_id?: string | null;
          path?: string | null;
          reference_type?: string | null;
          status?: string | null;
          type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          config_file?: string | null;
          created_at?: string;
          diffusers_lora_file?: string | null;
          id?: number;
          is_public?: boolean | null;
          name?: string | null;
          organization_id?: string | null;
          path?: string | null;
          reference_type?: string | null;
          status?: string | null;
          type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          data: Json | null;
          id: number;
          project_id: number;
          user_id: string;
        };
        Insert: {
          data?: Json | null;
          id?: number;
          project_id: number;
          user_id: string;
        };
        Update: {
          data?: Json | null;
          id?: number;
          project_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          format: string | null;
          id: number;
          model: string | null;
          scenes_order: number[] | null;
          slug: string | null;
          status: string | null;
          thumbnail: string | null;
          updated_at: string | null;
          user_id: string | null;
          video: Json | null;
        };
        Insert: {
          created_at?: string;
          format?: string | null;
          id?: number;
          model?: string | null;
          scenes_order?: number[] | null;
          slug?: string | null;
          status?: string | null;
          thumbnail?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          video?: Json | null;
        };
        Update: {
          created_at?: string;
          format?: string | null;
          id?: number;
          model?: string | null;
          scenes_order?: number[] | null;
          slug?: string | null;
          status?: string | null;
          thumbnail?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          video?: Json | null;
        };
        Relationships: [];
      };
      scenes: {
        Row: {
          created_at: string;
          duration: number;
          end_at: number | null;
          error: string | null;
          id: number;
          image: string | null;
          muted: boolean;
          order: number;
          project_id: number;
          prompt: string | null;
          sound_effect_prompt: string | null;
          start_at: number | null;
          status: string | null;
          subject_reference: string | null;
          trim_end: number | null;
          trim_start: number | null;
          updated_at: string | null;
          user_id: string;
          video: string | null;
          video_request_id: string | null;
        };
        Insert: {
          created_at?: string;
          duration: number;
          end_at?: number | null;
          error?: string | null;
          id?: number;
          image?: string | null;
          muted?: boolean;
          order: number;
          project_id: number;
          prompt?: string | null;
          sound_effect_prompt?: string | null;
          start_at?: number | null;
          status?: string | null;
          subject_reference?: string | null;
          trim_end?: number | null;
          trim_start?: number | null;
          updated_at?: string | null;
          user_id: string;
          video?: string | null;
          video_request_id?: string | null;
        };
        Update: {
          created_at?: string;
          duration?: number;
          end_at?: number | null;
          error?: string | null;
          id?: number;
          image?: string | null;
          muted?: boolean;
          order?: number;
          project_id?: number;
          prompt?: string | null;
          sound_effect_prompt?: string | null;
          start_at?: number | null;
          status?: string | null;
          subject_reference?: string | null;
          trim_end?: number | null;
          trim_start?: number | null;
          updated_at?: string | null;
          user_id?: string;
          video?: string | null;
          video_request_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scenes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription: {
        Row: {
          add_on_credits: number;
          add_on_credits_used: number;
          cancel_at_period_end: boolean | null;
          created_at: string;
          current_period_end: number | null;
          current_period_start: number | null;
          customer_id: string | null;
          id: number;
          limit: number;
          monthly_credits: number;
          monthly_credits_used: number;
          organization_id: string | null;
          payment_method: Json | null;
          price_id: string | null;
          status: string;
          subscription_id: string | null;
          updated_at: string | null;
          used: number;
          user_id: string | null;
        };
        Insert: {
          add_on_credits?: number;
          add_on_credits_used?: number;
          cancel_at_period_end?: boolean | null;
          created_at?: string;
          current_period_end?: number | null;
          current_period_start?: number | null;
          customer_id?: string | null;
          id?: number;
          limit?: number;
          monthly_credits?: number;
          monthly_credits_used?: number;
          organization_id?: string | null;
          payment_method?: Json | null;
          price_id?: string | null;
          status: string;
          subscription_id?: string | null;
          updated_at?: string | null;
          used?: number;
          user_id?: string | null;
        };
        Update: {
          add_on_credits?: number;
          add_on_credits_used?: number;
          cancel_at_period_end?: boolean | null;
          created_at?: string;
          current_period_end?: number | null;
          current_period_start?: number | null;
          customer_id?: string | null;
          id?: number;
          limit?: number;
          monthly_credits?: number;
          monthly_credits_used?: number;
          organization_id?: string | null;
          payment_method?: Json | null;
          price_id?: string | null;
          status?: string;
          subscription_id?: string | null;
          updated_at?: string | null;
          used?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };
      usage: {
        Row: {
          action: string;
          created_at: string;
          credits: number;
          id: number;
          project_id: number | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          credits: number;
          id?: number;
          project_id?: number | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          credits?: number;
          id?: number;
          project_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "usage_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_subscription_usage: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      track_usage: {
        Args:
          | { p_user_id: string; p_amount: number }
          | { p_user_id: string; p_amount: number; p_action: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
