-- Создание таблицы для учета новых лидов в Telegram
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- 1. Удаляем таблицу если существует (опционально)
-- DROP TABLE IF EXISTS telegram_daily_leads;

-- 2. Создаем новую таблицу
CREATE TABLE IF NOT EXISTS telegram_daily_leads (
  id BIGSERIAL PRIMARY KEY,
  manager_id TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  date DATE NOT NULL,
  new_leads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manager_id, date)
);

-- 3. Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_telegram_daily_leads_date ON telegram_daily_leads(date);
CREATE INDEX IF NOT EXISTS idx_telegram_daily_leads_manager ON telegram_daily_leads(manager_id);
CREATE INDEX IF NOT EXISTS idx_telegram_daily_leads_manager_date ON telegram_daily_leads(manager_id, date);

-- 4. Добавляем комментарии
COMMENT ON TABLE telegram_daily_leads IS 'Ежедневный учет новых лидов из Telegram для менеджеров команды Вохи';
COMMENT ON COLUMN telegram_daily_leads.manager_id IS 'ID менеджера из employees';
COMMENT ON COLUMN telegram_daily_leads.manager_name IS 'Имя менеджера';
COMMENT ON COLUMN telegram_daily_leads.date IS 'Дата (YYYY-MM-DD)';
COMMENT ON COLUMN telegram_daily_leads.new_leads IS 'Количество новых лидов за день';

-- 5. Проверяем создание
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'telegram_daily_leads'
ORDER BY ordinal_position;
