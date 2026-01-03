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
      attractions: {
        Row: {
          address: string | null
          best_time: string | null
          category: string | null
          city_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          is_family_friendly: boolean | null
          is_indoor: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood_id: string | null
          price_adult: number | null
          price_child: number | null
          price_notes: string | null
          rating: number | null
          ticket_advice: string | null
          ticket_online_url: string | null
        }
        Insert: {
          address?: string | null
          best_time?: string | null
          category?: string | null
          city_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_family_friendly?: boolean | null
          is_indoor?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood_id?: string | null
          price_adult?: number | null
          price_child?: number | null
          price_notes?: string | null
          rating?: number | null
          ticket_advice?: string | null
          ticket_online_url?: string | null
        }
        Update: {
          address?: string | null
          best_time?: string | null
          category?: string | null
          city_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_family_friendly?: boolean | null
          is_indoor?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood_id?: string | null
          price_adult?: number | null
          price_child?: number | null
          price_notes?: string | null
          rating?: number | null
          ticket_advice?: string | null
          ticket_online_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attractions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attractions_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          best_time_to_visit: string | null
          country: string
          country_code: string
          created_at: string
          currency: string | null
          description: string | null
          family_tips: string | null
          hero_image_url: string | null
          id: string
          image_url: string | null
          language: string | null
          name: string
          safety_notes: string | null
          tags: string[] | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          best_time_to_visit?: string | null
          country: string
          country_code: string
          created_at?: string
          currency?: string | null
          description?: string | null
          family_tips?: string | null
          hero_image_url?: string | null
          id?: string
          image_url?: string | null
          language?: string | null
          name: string
          safety_notes?: string | null
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          best_time_to_visit?: string | null
          country?: string
          country_code?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          family_tips?: string | null
          hero_image_url?: string | null
          id?: string
          image_url?: string | null
          language?: string | null
          name?: string
          safety_notes?: string | null
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          attraction_id: string | null
          created_at: string
          id: string
          restaurant_id: string | null
          user_id: string
        }
        Insert: {
          attraction_id?: string | null
          created_at?: string
          id?: string
          restaurant_id?: string | null
          user_id: string
        }
        Update: {
          attraction_id?: string | null
          created_at?: string
          id?: string
          restaurant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_attraction_id_fkey"
            columns: ["attraction_id"]
            isOneToOne: false
            referencedRelation: "attractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          budget_level: string | null
          city_id: string
          created_at: string
          dietary_preferences: string[] | null
          end_date: string | null
          estimated_daily_cost: number | null
          home_base: string | null
          id: string
          name: string
          num_days: number
          pace: string | null
          start_date: string | null
          travel_style: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_level?: string | null
          city_id: string
          created_at?: string
          dietary_preferences?: string[] | null
          end_date?: string | null
          estimated_daily_cost?: number | null
          home_base?: string | null
          id?: string
          name: string
          num_days: number
          pace?: string | null
          start_date?: string | null
          travel_style?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_level?: string | null
          city_id?: string
          created_at?: string
          dietary_preferences?: string[] | null
          end_date?: string | null
          estimated_daily_cost?: number | null
          home_base?: string | null
          id?: string
          name?: string
          num_days?: number
          pace?: string | null
          start_date?: string | null
          travel_style?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_items: {
        Row: {
          attraction_id: string | null
          created_at: string
          custom_description: string | null
          custom_title: string | null
          day_number: number
          id: string
          item_type: string
          itinerary_id: string
          notes: string | null
          order_index: number
          restaurant_id: string | null
          time_slot: string
        }
        Insert: {
          attraction_id?: string | null
          created_at?: string
          custom_description?: string | null
          custom_title?: string | null
          day_number: number
          id?: string
          item_type: string
          itinerary_id: string
          notes?: string | null
          order_index?: number
          restaurant_id?: string | null
          time_slot: string
        }
        Update: {
          attraction_id?: string | null
          created_at?: string
          custom_description?: string | null
          custom_title?: string | null
          day_number?: number
          id?: string
          item_type?: string
          itinerary_id?: string
          notes?: string | null
          order_index?: number
          restaurant_id?: string | null
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_attraction_id_fkey"
            columns: ["attraction_id"]
            isOneToOne: false
            referencedRelation: "attractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_items_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          city_id: string
          created_at: string
          description: string | null
          highlight: string | null
          id: string
          is_family_friendly: boolean | null
          name: string
        }
        Insert: {
          city_id: string
          created_at?: string
          description?: string | null
          highlight?: string | null
          id?: string
          is_family_friendly?: boolean | null
          name: string
        }
        Update: {
          city_id?: string
          created_at?: string
          description?: string | null
          highlight?: string | null
          id?: string
          is_family_friendly?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          travel_preferences: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          travel_preferences?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          travel_preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_visits: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          rating: number | null
          restaurant_id: string
          updated_at: string
          user_id: string
          visited_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          restaurant_id: string
          updated_at?: string
          user_id: string
          visited_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          restaurant_id?: string
          updated_at?: string
          user_id?: string
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_visits_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          city_id: string
          created_at: string
          cuisine: string | null
          description: string | null
          has_kids_menu: boolean | null
          id: string
          image_url: string | null
          is_family_friendly: boolean | null
          is_halal: boolean | null
          is_vegan_friendly: boolean | null
          is_vegetarian_friendly: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood_id: string | null
          phone: string | null
          price_level: number | null
          rating: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city_id: string
          created_at?: string
          cuisine?: string | null
          description?: string | null
          has_kids_menu?: boolean | null
          id?: string
          image_url?: string | null
          is_family_friendly?: boolean | null
          is_halal?: boolean | null
          is_vegan_friendly?: boolean | null
          is_vegetarian_friendly?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood_id?: string | null
          phone?: string | null
          price_level?: number | null
          rating?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string
          created_at?: string
          cuisine?: string | null
          description?: string | null
          has_kids_menu?: boolean | null
          id?: string
          image_url?: string | null
          is_family_friendly?: boolean | null
          is_halal?: boolean | null
          is_vegan_friendly?: boolean | null
          is_vegetarian_friendly?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood_id?: string | null
          phone?: string | null
          price_level?: number | null
          rating?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_info: {
        Row: {
          airport_transfer_options: Json | null
          bus_info: string | null
          car_rental_daily_cost: string | null
          city_id: string
          created_at: string
          family_pass_info: string | null
          id: string
          metro_info: string | null
          parking_notes: string | null
          public_transport_overview: string | null
          ride_hailing_apps: string[] | null
          ticket_options: string | null
        }
        Insert: {
          airport_transfer_options?: Json | null
          bus_info?: string | null
          car_rental_daily_cost?: string | null
          city_id: string
          created_at?: string
          family_pass_info?: string | null
          id?: string
          metro_info?: string | null
          parking_notes?: string | null
          public_transport_overview?: string | null
          ride_hailing_apps?: string[] | null
          ticket_options?: string | null
        }
        Update: {
          airport_transfer_options?: Json | null
          bus_info?: string | null
          car_rental_daily_cost?: string | null
          city_id?: string
          created_at?: string
          family_pass_info?: string | null
          id?: string
          metro_info?: string | null
          parking_notes?: string | null
          public_transport_overview?: string | null
          ride_hailing_apps?: string[] | null
          ticket_options?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_info_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      owns_itinerary: { Args: { itinerary_uuid: string }; Returns: boolean }
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
