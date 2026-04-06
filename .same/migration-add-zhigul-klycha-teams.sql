-- ==========================================
-- МИГРАЦИЯ: Добавление zhigul и klycha в TeamName
-- ==========================================
-- Дата: 08 февраля 2026
-- Цель: Поддержка 4 независимых касс в таблице operations
-- ==========================================

-- ШАГ 1: Удалить старый constraint для team (если есть)
ALTER TABLE operations DROP CONSTRAINT IF EXISTS operations_team_check;

-- ШАГ 2: Добавить новый constraint с поддержкой 4 касс
ALTER TABLE operations 
ADD CONSTRAINT operations_team_check 
CHECK (team IN ('voha', 'zet', 'office', 'zhigul', 'klycha'));

-- ШАГ 3: Обновить комментарий
COMMENT ON COLUMN operations.team IS 
'Команда операции: voha (Команда Вохи), zet (Команда Зета), zhigul (Жигуль), klycha (Клыча), office (Офис)';

-- ==========================================
-- ПРОВЕРКА МИГРАЦИИ
-- ==========================================
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'operations_team_check';
-- ==========================================
