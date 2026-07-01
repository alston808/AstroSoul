/**
 * Supabase Database Types
 * Auto-generated types for the AstroSoul schema.
 * Update these if you change the schema.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          birth_date: string | null;
          birth_time: string | null;
          birth_lat: number | null;
          birth_lng: number | null;
          birth_tz: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          birth_date?: string | null;
          birth_time?: string | null;
          birth_lat?: number | null;
          birth_lng?: number | null;
          birth_tz?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          birth_date?: string | null;
          birth_time?: string | null;
          birth_lat?: number | null;
          birth_lng?: number | null;
          birth_tz?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      birth_charts: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          birth_date: string;
          birth_time: string;
          latitude: number;
          longitude: number;
          timezone: string;
          ascendant_sign: string | null;
          ascendant_degree: number | null;
          midheaven_sign: string | null;
          midheaven_degree: number | null;
          calculated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          birth_date: string;
          birth_time: string;
          latitude: number;
          longitude: number;
          timezone?: string;
          ascendant_sign?: string | null;
          ascendant_degree?: number | null;
          midheaven_sign?: string | null;
          midheaven_degree?: number | null;
          calculated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string | null;
          birth_date?: string;
          birth_time?: string;
          latitude?: number;
          longitude?: number;
          timezone?: string;
          ascendant_sign?: string | null;
          ascendant_degree?: number | null;
          midheaven_sign?: string | null;
          midheaven_degree?: number | null;
        };
      };
      birth_chart_planets: {
        Row: {
          id: string;
          chart_id: string;
          planet_name: string;
          sign: string;
          sign_index: number;
          degree: number;
          longitude: number;
          house: number | null;
          is_retrograde: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          chart_id: string;
          planet_name: string;
          sign: string;
          sign_index: number;
          degree: number;
          longitude: number;
          house?: number | null;
          is_retrograde?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          planet_name?: string;
          sign?: string;
          sign_index?: number;
          degree?: number;
          longitude?: number;
          house?: number | null;
          is_retrograde?: boolean;
        };
      };
      birth_chart_houses: {
        Row: {
          id: string;
          chart_id: string;
          house_number: number;
          sign: string;
          sign_index: number;
          degree: number;
          longitude: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          chart_id: string;
          house_number: number;
          sign: string;
          sign_index: number;
          degree: number;
          longitude: number;
          created_at?: string;
        };
      };
      birth_chart_aspects: {
        Row: {
          id: string;
          chart_id: string;
          planet1: string;
          planet2: string;
          aspect_type: string;
          angle: number;
          orb: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          chart_id: string;
          planet1: string;
          planet2: string;
          aspect_type: string;
          angle: number;
          orb: number;
          created_at?: string;
        };
      };
      saved_readings: {
        Row: {
          id: string;
          user_id: string;
          chart_id: string | null;
          focus: string;
          reading_text: string;
          excerpts_json: Json;
          placements_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          chart_id?: string | null;
          focus?: string;
          reading_text: string;
          excerpts_json?: Json;
          placements_json?: Json;
          created_at?: string;
        };
        Update: {
          reading_text?: string;
          excerpts_json?: Json;
          placements_json?: Json;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
