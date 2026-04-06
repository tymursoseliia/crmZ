-- Создание таблицы для периодов финансов
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- 1. Создаем таблицу периодов
CREATE TABLE IF NOT EXISTS finance_periods (
  id TEXT PRIMARY KEY,
  period_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_number)
);

-- 2. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_finance_periods_dates ON finance_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_finance_periods_closed ON finance_periods(is_closed);

-- 3. Добавляем первый период (если нужно)
INSERT INTO finance_periods (id, period_number, start_date, end_date, is_closed)
VALUES ('period-2026-01-26', 1, '2026-01-26', '2026-02-08', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Добавляем комментарии
COMMENT ON TABLE finance_periods IS 'Периоды для учета финансов (зарплаты, расходы, операции)';
COMMENT ON COLUMN finance_periods.id IS 'Уникальный ID периода (формат: period-YYYY-MM-DD)';
COMMENT ON COLUMN finance_periods.period_number IS 'Номер периода (1, 2, 3, ...)';
COMMENT ON COLUMN finance_periods.start_date IS 'Дата начала периода';
COMMENT ON COLUMN finance_periods.end_date IS 'Дата окончания периода';
COMMENT ON COLUMN finance_periods.is_closed IS 'Закрыт ли период для редактирования';

-- 5. Проверяем создание
SELECT * FROM finance_periods ORDER BY period_number;
