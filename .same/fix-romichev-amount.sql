-- Очистка суммы у лида с этапом "Договор сделан"
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- 1. Находим лида Ромичева с неправильной суммой
SELECT
  id,
  client_name,
  stage,
  amount
FROM leads
WHERE client_name LIKE '%Ромичев%' OR client_name LIKE '%Romichev%';

-- 2. Очищаем сумму у всех лидов со статусом "Договор сделан" или "Дал реквизиты"
UPDATE leads
SET amount = NULL
WHERE stage IN ('contract_done', 'gave_requisites')
  AND amount IS NOT NULL;

-- 3. Проверяем результат
SELECT
  id,
  client_name,
  stage,
  amount
FROM leads
WHERE client_name LIKE '%Ромичев%' OR client_name LIKE '%Romichev%';

-- Ожидаемый результат:
-- ДО: stage='contract_done', amount=480000
-- ПОСЛЕ: stage='contract_done', amount=NULL
