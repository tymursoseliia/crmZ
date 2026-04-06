-- Обновление существующих записей в telegram_daily_leads
-- Добавляем team_id='voha' для всех старых записей без team_id
-- Выполните этот скрипт ПОСЛЕ выполнения add-team-to-telegram-leads.sql

-- 1. Проверяем сколько записей без team_id
SELECT COUNT(*) as records_without_team
FROM telegram_daily_leads
WHERE team_id IS NULL;

-- 2. Обновляем все записи без team_id, устанавливая team_id='voha'
UPDATE telegram_daily_leads
SET team_id = 'voha'
WHERE team_id IS NULL;

-- 3. Проверяем результат
SELECT
  team_id,
  COUNT(*) as count,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM telegram_daily_leads
GROUP BY team_id
ORDER BY team_id;

-- 4. Показываем все записи команды Вохи
SELECT
  manager_name,
  date,
  new_leads,
  team_id
FROM telegram_daily_leads
WHERE team_id = 'voha'
ORDER BY date DESC, manager_name
LIMIT 50;
