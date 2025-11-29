// Generated types for Supabase database
// In a real project, you'd generate these using: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          balance: number | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          balance?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          balance?: number | null;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          date: string;
          merchant: string;
          category: string;
          source: string;
          raw_text: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          date: string;
          merchant: string;
          category: string;
          source?: string;
          raw_text?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          date?: string;
          merchant?: string;
          category?: string;
          source?: string;
          raw_text?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          transaction_ids: string[];
          service_name: string;
          amount: number;
          currency: string;
          billing_cycle: string;
          next_billing_date: string;
          is_active: boolean;
          is_snoozed: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_ids?: string[];
          service_name: string;
          amount: number;
          currency?: string;
          billing_cycle: string;
          next_billing_date: string;
          is_active?: boolean;
          is_snoozed?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_ids?: string[];
          service_name?: string;
          amount?: number;
          currency?: string;
          billing_cycle?: string;
          next_billing_date?: string;
          is_active?: boolean;
          is_snoozed?: boolean | null;
          created_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          target_amount: number;
          current_amount: number;
          currency: string;
          start_date: string;
          deadline: string;
          suggested_save_per_period: number | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          target_amount: number;
          current_amount?: number;
          currency?: string;
          start_date: string;
          deadline: string;
          suggested_save_per_period?: number | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          target_amount?: number;
          current_amount?: number;
          currency?: string;
          start_date?: string;
          deadline?: string;
          suggested_save_per_period?: number | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      insights: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          message: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          message: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          message?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
  };
}

