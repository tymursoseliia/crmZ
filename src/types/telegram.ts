// Типы для Telegram аналитики

export interface TelegramConversation {
  id: number;
  manager_id: string;
  manager_name: string;
  client_telegram_id: number;
  message_time: string;
  message_type: 'incoming' | 'outgoing';
  is_new_client: boolean;
  channel_source?: string;
  response_time_minutes?: number;
  message_text?: string;
  created_at: string;
}

export interface TelegramDailyStats {
  id: number;
  manager_id: string;
  date: string;
  new_clients: number;
  returning_clients: number;
  total_conversations: number;
  messages_sent: number;
  messages_received: number;
  avg_response_time_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface TelegramManagerMetrics {
  id: number;
  manager_id: string;
  manager_name: string;
  period_start: string;
  period_end: string;
  total_new_clients: number;
  total_returning_clients: number;
  total_messages_sent: number;
  total_messages_received: number;
  avg_response_time_minutes?: number;
  fastest_response_seconds?: number;
  slowest_response_minutes?: number;
  conversion_rate?: number;
  created_at: string;
}

export interface TelegramChannelSource {
  id: number;
  channel_name: string;
  channel_username?: string;
  total_clients: number;
  conversion_rate?: number;
  created_at: string;
  updated_at: string;
}

// Агрегированная статистика для дашборда
export interface TelegramDashboardStats {
  today: {
    total_new_clients: number;
    total_returning_clients: number;
    total_conversations: number;
    avg_response_time: number;
  };
  top_managers: Array<{
    manager_id: string;
    manager_name: string;
    new_clients: number;
    avg_response_time: number;
  }>;
  top_channels: Array<{
    channel: string;
    clients: number;
  }>;
  weekly_trend: Array<{
    date: string;
    new_clients: number;
    returning_clients: number;
  }>;
}
