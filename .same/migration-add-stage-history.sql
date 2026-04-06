-- ========================================
-- МИГРАЦИЯ: Добавление истории статусов и причин потери
-- Дата: 2026-02-04
-- ========================================

-- Добавляем колонку stage_history в таблицу leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_history TEXT;

-- Добавляем колонки для причины потери
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT CHECK (lost_reason IN ('high_price', 'long_wait', 'found_competitor', 'changed_mind', 'no_money', 'no_response', 'other'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason_text TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_at_stage TEXT CHECK (lost_at_stage IN ('contract_done', 'gave_requisites', 'payment_customs', 'payment_car', 'payment_recycling', 'payment_fee', 'payment_deposit', 'payment_other', 'completed'));

-- Комментарии к колонкам
COMMENT ON COLUMN leads.stage_history IS 'JSON массив истории изменения статусов лида';
COMMENT ON COLUMN leads.lost_reason IS 'Причина потери лида (если stage = lost)';
COMMENT ON COLUMN leads.lost_reason_text IS 'Подробное описание причины потери';
COMMENT ON COLUMN leads.lost_at_stage IS 'На каком этапе реально произошел срез';

-- Обновляем существующие записи - инициализируем историю для всех лидов
UPDATE leads
SET stage_history = jsonb_build_array(
  jsonb_build_object(
    'id', 'hist-' || extract(epoch from now())::text,
    'timestamp', created_at,
    'previousStage', null,
    'newStage', stage,
    'changedBy', manager_id,
    'notes', 'Инициализация истории'
  )
)::text
WHERE stage_history IS NULL;

-- Сообщение об успешной миграции
DO $$
BEGIN
  RAISE NOTICE 'Миграция успешно завершена! Добавлена колонка stage_history в таблицу leads.';
END $$;
