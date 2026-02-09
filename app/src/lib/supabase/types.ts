export interface Profile {
  id: string;
  phone: string;
  full_name: string;
  email: string | null;
  analyses_used: number;
  plan_tier: string;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'analyses_used' | 'plan_tier' | 'created_at' | 'updated_at'> & {
          analyses_used?: number;
          plan_tier?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Profile>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_analyses: {
        Args: { user_id: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
