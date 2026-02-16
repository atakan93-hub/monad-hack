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
          address: string;
          name: string;
          role: "requester" | "agent" | "both";
          avatar_url: string | null;
          description: string;
          reputation: number;
          completion_rate: number;
          total_tasks: number;
          skills: string[];
          hourly_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          address: string;
          name: string;
          role: "requester" | "agent" | "both";
          avatar_url?: string | null;
          description?: string;
          reputation?: number;
          completion_rate?: number;
          total_tasks?: number;
          skills?: string[];
          hourly_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          address?: string;
          name?: string;
          role?: "requester" | "agent" | "both";
          avatar_url?: string | null;
          description?: string;
          reputation?: number;
          completion_rate?: number;
          total_tasks?: number;
          skills?: string[];
          hourly_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      sbt_badges: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          tier: "bronze" | "silver" | "gold";
          issued_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          tier: "bronze" | "silver" | "gold";
          issued_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          tier?: "bronze" | "silver" | "gold";
          issued_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_requests: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: "smart-contract" | "frontend" | "data-analysis" | "audit" | "other";
          budget: number;
          deadline: string;
          status: "open" | "in_progress" | "completed" | "cancelled" | "disputed";
          requester_id: string;
          assigned_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: "smart-contract" | "frontend" | "data-analysis" | "audit" | "other";
          budget: number;
          deadline: string;
          status?: "open" | "in_progress" | "completed" | "cancelled" | "disputed";
          requester_id: string;
          assigned_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: "smart-contract" | "frontend" | "data-analysis" | "audit" | "other";
          budget?: number;
          deadline?: string;
          status?: "open" | "in_progress" | "completed" | "cancelled" | "disputed";
          requester_id?: string;
          assigned_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      proposals: {
        Row: {
          id: string;
          request_id: string;
          user_id: string;
          price: number;
          estimated_days: number;
          message: string;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          user_id: string;
          price: number;
          estimated_days: number;
          message: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          user_id?: string;
          price?: number;
          estimated_days?: number;
          message?: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
      };
      rounds: {
        Row: {
          id: string;
          round_number: number;
          prize: number;
          status: "proposing" | "voting" | "active" | "completed";
          selected_topic_id: string | null;
          winner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          round_number: number;
          prize?: number;
          status?: "proposing" | "voting" | "active" | "completed";
          selected_topic_id?: string | null;
          winner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          round_number?: number;
          prize?: number;
          status?: "proposing" | "voting" | "active" | "completed";
          selected_topic_id?: string | null;
          winner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      topics: {
        Row: {
          id: string;
          round_id: string;
          proposer_id: string;
          title: string;
          description: string;
          total_votes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          proposer_id: string;
          title: string;
          description: string;
          total_votes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          proposer_id?: string;
          title?: string;
          description?: string;
          total_votes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      arena_entries: {
        Row: {
          id: string;
          round_id: string;
          user_id: string;
          repo_url: string;
          description: string;
          demo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          user_id: string;
          repo_url: string;
          description: string;
          demo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          user_id?: string;
          repo_url?: string;
          description?: string;
          demo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      escrow_deals: {
        Row: {
          id: string;
          request_id: string;
          requester_id: string;
          user_id: string;
          amount: number;
          status: "created" | "funded" | "completed" | "released" | "disputed" | "refunded";
          created_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          requester_id: string;
          user_id: string;
          amount: number;
          status?: "created" | "funded" | "completed" | "released" | "disputed" | "refunded";
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          requester_id?: string;
          user_id?: string;
          amount?: number;
          status?: "created" | "funded" | "completed" | "released" | "disputed" | "refunded";
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_votes: {
        Args: { topic_id: string; weight: number };
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
}
