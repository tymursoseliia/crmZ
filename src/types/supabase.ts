// Типы для Supabase БД
export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string;
          name: string;
          role: 'manager' | 'closer' | 'teamlead' | 'it' | 'special';
          team: 'zet' | 'office' | null;
          salary: number;
          percent_rastamozhka: number;
          percent_dobiv: number;
          percent_profit: number;
          is_special: boolean;
          fixed_pay: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['employees']['Insert']>;
      };
      drops: {
        Row: {
          id: string;
          name: string;
          commission: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['drops']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['drops']['Insert']>;
      };
      operations: {
        Row: {
          id: string;
          date: string;
          sum_rub: number;
          drop_id: string;
          drop_commission: number;
          exchange_rate: number;
          type: 'растаможка' | 'добив';
          manager_id: string;
          closer_id: string | null;
          comment: string | null;
          usdt_after_commission: number;
          manager_earning: number;
          closer_earning: number | null;
          team: 'zet' | 'office';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['operations']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['operations']['Insert']>;
      };
      expense_categories: {
        Row: {
          id: string;
          name: string;
          type: 'personal' | 'tech' | 'fixed' | 'common';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expense_categories']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['expense_categories']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          date: string;
          category: string;
          sum_usdt: number;
          type: 'personal' | 'tech' | 'fixed' | 'common';
          team_id: 'zet' | 'office' | null;
          employee_id: string | null;
          issued_by: string;
          recipient: string;
          comment: string | null;
          is_for_special_employee: boolean;
          special_employee_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
      system_settings: {
        Row: {
          id: string;
          current_period_id: string;
          security_cost: number;
          rent_cost: number;
          it_salary_ronaldu: number;
          it_salary_prius: number;
          it_salary_skorpion: number;
          it_salary_tverdik: number;
          it_salary_telephony: number;
          min_salary: number;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['system_settings']['Row'], 'updated_at'>;
        Update: Partial<Database['public']['Tables']['system_settings']['Insert']>;
      };
      pay_periods: {
        Row: {
          id: string;
          start_date: string;
          end_date: string;
          number: number;
          is_closed: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pay_periods']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['pay_periods']['Insert']>;
      };
    };
  };
};
