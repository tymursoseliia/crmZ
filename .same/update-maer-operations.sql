-- Обновление команды для всех операций Маера
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- 1. Сначала проверяем, сколько операций у Маера и их текущую команду
SELECT
  COUNT(*) as total_operations,
  team,
  SUM(usdt_after_commission) as total_revenue
FROM operations
WHERE manager_id = 'maer'
GROUP BY team;

-- 2. Обновляем КОМАНДУ во всех операциях Маера с 'zet' на 'voha'
UPDATE operations
SET team = 'voha'
WHERE manager_id = 'maer' AND team = 'zet';

-- 3. Проверяем результат
SELECT
  COUNT(*) as total_operations,
  team,
  SUM(usdt_after_commission) as total_revenue
FROM operations
WHERE manager_id = 'maer'
GROUP BY team;

-- 4. Также проверяем последние 5 операций Маера
SELECT
  id,
  date,
  manager_id,
  team,
  usdt_after_commission,
  type
FROM operations
WHERE manager_id = 'maer'
ORDER BY date DESC
LIMIT 5;

-- Ожидаемый результат:
-- ДО: все операции с team='zet'
-- ПОСЛЕ: все операции с team='voha'
