-- Добавление поля team_id в таблицу telegram_daily_leads
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- 1. Добавляем колонку team_id
ALTER TABLE telegram_daily_leads
ADD COLUMN IF NOT EXISTS team_id TEXT NOT NULL DEFAULT 'voha';

-- 2. Создаем индекс для фильтрации по команде
CREATE INDEX IF NOT EXISTS idx_telegram_daily_leads_team ON telegram_daily_leads(team_id);

-- 3. Создаем индекс для фильтрации по команде и дате
CREATE INDEX IF NOT EXISTS idx_telegram_daily_leads_team_date ON telegram_daily_leads(team_id, date);

-- 4. Обновляем уникальное ограничение (должно включать team_id)
-- Сначала удаляем старое
ALTER TABLE telegram_daily_leads
DROP CONSTRAINT IF EXISTS telegram_daily_leads_manager_id_date_key;

-- Добавляем новое с team_id
ALTER TABLE telegram_daily_leads
ADD CONSTRAINT telegram_daily_leads_manager_date_team_key
UNIQUE(manager_id, date, team_id);

-- 5. Обновляем комментарии
COMMENT ON COLUMN telegram_daily_leads.team_id IS 'ID команды (voha или zet)';
COMMENT ON TABLE telegram_daily_leads IS 'Ежедневный учет новых лидов из Telegram для менеджеров команд Вохи и Зета';

-- 6. Проверяем результат
SELECT
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'telegram_daily_leads'
ORDER BY ordinal_position;
