"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { TelegramDailyStats, TelegramDashboardStats } from '@/types/telegram';
import { supabase } from '@/lib/supabase';

interface TelegramContextType {
  stats: TelegramDailyStats[];
  dashboardStats: TelegramDashboardStats | null;
  isLoaded: boolean;
  reloadData: () => Promise<void>;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<TelegramDailyStats[]>([]);
  const [dashboardStats, setDashboardStats] = useState<TelegramDashboardStats | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (typeof window === 'undefined') return;

    try {
      if (!supabase) {
        console.log('[Telegram] Supabase не доступен');
        setIsLoaded(true);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      const { data: dailyData, error: dailyError } = await supabase
        .from('telegram_daily_stats')
        .select('*')
        .eq('date', today)
        .order('new_clients', { ascending: false });

      if (dailyError) throw dailyError;

      setStats(dailyData || []);

      if (dailyData && dailyData.length > 0) {
        const totalNewClients = dailyData.reduce((sum, s) => sum + (s.new_clients || 0), 0);
        const totalReturningClients = dailyData.reduce((sum, s) => sum + (s.returning_clients || 0), 0);
        const totalConversations = dailyData.reduce((sum, s) => sum + (s.total_conversations || 0), 0);
        
        const responseTimes = dailyData
          .filter(s => s.avg_response_time_minutes !== null)
          .map(s => s.avg_response_time_minutes || 0);
        const avgResponseTime = responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;

        const topManagers = dailyData
          .map(s => ({
            manager_id: s.manager_id,
            manager_name: s.manager_id,
            new_clients: s.new_clients,
            avg_response_time: s.avg_response_time_minutes || 0
          }))
          .sort((a, b) => b.new_clients - a.new_clients)
          .slice(0, 5);

        setDashboardStats({
          today: {
            total_new_clients: totalNewClients,
            total_returning_clients: totalReturningClients,
            total_conversations: totalConversations,
            avg_response_time: avgResponseTime
          },
          top_managers: topManagers,
          top_channels: [],
          weekly_trend: []
        });
      }

      console.log('[Telegram] Данные загружены:', dailyData?.length || 0, 'записей');
      setIsLoaded(true);
    } catch (error) {
      console.error('[Telegram] Ошибка загрузки:', error);
      setIsLoaded(true);
    }
  };

  const reloadData = async () => {
    setIsLoaded(false);
    await loadData();
  };

  return (
    <TelegramContext.Provider value={{ stats, dashboardStats, isLoaded, reloadData }}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return context;
}
