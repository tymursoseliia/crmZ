-- Обновление команды Маера с 'zet' на 'voha'
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- 1. Проверяем текущее состояние
SELECT id, name, team FROM employees WHERE id = 'maer';

-- 2. Обновляем команду Маера
UPDATE employees
SET team = 'voha'
WHERE id = 'maer';

-- 3. Проверяем результат
SELECT id, name, team FROM employees WHERE id = 'maer';

-- Ожидаемый результат:
-- До: id='maer', name='Маер', team='zet'
-- После: id='maer', name='Маер', team='voha'
