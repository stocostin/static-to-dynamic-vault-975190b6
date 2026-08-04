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
      blog_posts: {
        Row: {
          author: string | null
          body_html: string
          category: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          published_at: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          tags: Json
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          body_html?: string
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          published_at?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          tags?: Json
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          body_html?: string
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          published_at?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          tags?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_documents: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_kra_pin: string | null
          client_name: string
          client_phone: string | null
          client_reg_no: string | null
          created_at: string
          created_by: string | null
          currency: string
          doc_number: string | null
          doc_type: Database["public"]["Enums"]["doc_type"]
          due_date: string | null
          id: string
          issue_date: string
          line_items: Json
          location: string | null
          notes: string | null
          project_name: string | null
          status: Database["public"]["Enums"]["doc_status"]
          subtotal_cents: number
          tax_cents: number
          tax_enabled: boolean
          tax_label: string
          tax_rate: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_kra_pin?: string | null
          client_name?: string
          client_phone?: string | null
          client_reg_no?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          doc_number?: string | null
          doc_type: Database["public"]["Enums"]["doc_type"]
          due_date?: string | null
          id?: string
          issue_date?: string
          line_items?: Json
          location?: string | null
          notes?: string | null
          project_name?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal_cents?: number
          tax_cents?: number
          tax_enabled?: boolean
          tax_label?: string
          tax_rate?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_kra_pin?: string | null
          client_name?: string
          client_phone?: string | null
          client_reg_no?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          doc_number?: string | null
          doc_type?: Database["public"]["Enums"]["doc_type"]
          due_date?: string | null
          id?: string
          issue_date?: string
          line_items?: Json
          location?: string | null
          notes?: string | null
          project_name?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal_cents?: number
          tax_cents?: number
          tax_enabled?: boolean
          tax_label?: string
          tax_rate?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          first_message: string | null
          id: string
          is_archived: boolean
          is_read: boolean
          last_message: string | null
          message_count: number
          session_id: string
          source_page: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          first_message?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          last_message?: string | null
          message_count?: number
          session_id: string
          source_page?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          first_message?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          last_message?: string | null
          message_count?: number
          session_id?: string
          source_page?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
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
          role: string
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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          source_page: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          source_page?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          source_page?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      document_counters: {
        Row: {
          doc_type: Database["public"]["Enums"]["doc_type"]
          last_number: number
          updated_at: string
        }
        Insert: {
          doc_type: Database["public"]["Enums"]["doc_type"]
          last_number?: number
          updated_at?: string
        }
        Update: {
          doc_type?: Database["public"]["Enums"]["doc_type"]
          last_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          id: string
          is_published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          bucket: string
          caption: string | null
          created_at: string
          folder: string | null
          height: number | null
          id: string
          mime_type: string | null
          original_filename: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket: string
          caption?: string | null
          created_at?: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          caption?: string | null
          created_at?: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          id: string
          is_visible: boolean
          label: string
          menu_id: string
          open_in_new_tab: boolean
          parent_id: string | null
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          id?: string
          is_visible?: boolean
          label: string
          menu_id: string
          open_in_new_tab?: boolean
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          id?: string
          is_visible?: boolean
          label?: string
          menu_id?: string
          open_in_new_tab?: boolean
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          content: Json
          id: string
          is_visible: boolean
          page_id: string
          section_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          is_visible?: boolean
          page_id: string
          section_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          is_visible?: boolean
          page_id?: string
          section_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          canonical_url: string | null
          content_json: Json
          created_at: string
          excerpt: string | null
          hero_image_url: string | null
          id: string
          is_published: boolean
          kind: string
          meta_description: string | null
          meta_keywords: string | null
          og_image_url: string | null
          published_at: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          content_json?: Json
          created_at?: string
          excerpt?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          kind?: string
          meta_description?: string | null
          meta_keywords?: string | null
          og_image_url?: string | null
          published_at?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          content_json?: Json
          created_at?: string
          excerpt?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          kind?: string
          meta_description?: string | null
          meta_keywords?: string | null
          og_image_url?: string | null
          published_at?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_projects: {
        Row: {
          category: string | null
          client: string | null
          completion_date: string | null
          cover_image_url: string | null
          created_at: string
          currency: string
          description: string | null
          for_sale: boolean
          gallery: Json
          id: string
          images: string[]
          is_featured: boolean
          is_published: boolean
          location: string | null
          meta_description: string | null
          price_cents: number | null
          seo_title: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          client?: string | null
          completion_date?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          for_sale?: boolean
          gallery?: Json
          id?: string
          images?: string[]
          is_featured?: boolean
          is_published?: boolean
          location?: string | null
          meta_description?: string | null
          price_cents?: number | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          client?: string | null
          completion_date?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          for_sale?: boolean
          gallery?: Json
          id?: string
          images?: string[]
          is_featured?: boolean
          is_published?: boolean
          location?: string | null
          meta_description?: string | null
          price_cents?: number | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          description: string | null
          features: Json
          icon: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          long_description: string | null
          short_description: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          features?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          long_description?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          features?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          long_description?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_products: {
        Row: {
          category: string | null
          created_at: string
          currency: string
          description: string | null
          gallery: Json
          id: string
          image_url: string | null
          images: string[]
          in_stock: boolean
          is_featured: boolean
          is_published: boolean
          price_cents: number | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          gallery?: Json
          id?: string
          image_url?: string | null
          images?: string[]
          in_stock?: boolean
          is_featured?: boolean
          is_published?: boolean
          price_cents?: number | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          gallery?: Json
          id?: string
          image_url?: string | null
          images?: string[]
          in_stock?: boolean
          is_featured?: boolean
          is_published?: boolean
          price_cents?: number | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          id: string
          is_published: boolean
          name: string
          phone: string | null
          photo_url: string | null
          position: string | null
          skills: Json
          social_links: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_published?: boolean
          name: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          skills?: Json
          social_links?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_published?: boolean
          name?: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          skills?: Json
          social_links?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          company: string | null
          created_at: string
          id: string
          is_featured: boolean
          is_published: boolean
          name: string
          photo_url: string | null
          position: string | null
          rating: number | null
          review: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name: string
          photo_url?: string | null
          position?: string | null
          rating?: number | null
          review: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name?: string
          photo_url?: string | null
          position?: string | null
          rating?: number | null
          review?: string
          sort_order?: number
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      team_members_public: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string | null
          name: string | null
          photo_url: string | null
          position: string | null
          skills: Json | null
          social_links: Json | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          photo_url?: string | null
          position?: string | null
          skills?: Json | null
          social_links?: Json | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          photo_url?: string | null
          position?: string | null
          skills?: Json | null
          social_links?: Json | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      next_document_number: {
        Args: { _type: Database["public"]["Enums"]["doc_type"] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
      doc_status: "draft" | "issued" | "paid" | "void"
      doc_type: "invoice" | "quotation" | "receipt" | "estimate"
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
      app_role: ["admin", "editor", "user"],
      doc_status: ["draft", "issued", "paid", "void"],
      doc_type: ["invoice", "quotation", "receipt", "estimate"],
    },
  },
} as const
