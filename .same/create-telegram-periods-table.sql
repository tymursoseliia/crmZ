-- Создание таблицы для периодов учета Telegram лидов
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- 1. Создаем таблицу периодов
CREATE TABLE IF NOT EXISTS telegram_periods (
  id TEXT PRIMARY KEY,
  period_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_number)
);

-- 2. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_telegram_periods_current ON telegram_periods(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_telegram_periods_dates ON telegram_periods(start_date, end_date);

-- 3. Добавляем первый период (26.01.2026 - 08.02.2026)
INSERT INTO telegram_periods (id, period_number, start_date, end_date, is_current, is_closed)
VALUES ('tg-period-2026-01-26', 1, '2026-01-26', '2026-02-08', true, false)
ON CONFLICT (id) DO NOTHING;

-- 4. Добавляем комментарии
COMMENT ON TABLE telegram_periods IS 'Периоды учета лидов в Telegram (2 недели каждый)';
COMMENT ON COLUMN telegram_periods.id IS 'Уникальный ID периода (формат: tg-period-YYYY-MM-DD)';
COMMENT ON COLUMN telegram_periods.period_number IS 'Номер периода (1, 2, 3, ...)';
COMMENT ON COLUMN telegram_periods.start_date IS 'Дата начала периода';
COMMENT ON COLUMN telegram_periods.end_date IS 'Дата окончания периода';
COMMENT ON COLUMN telegram_periods.is_current IS 'Текущий активный период';
COMMENT ON COLUMN telegram_periods.is_closed IS 'Закрыт ли период для редактирования';

-- 5. Проверяем создание
SELECT * FROM telegram_periods ORDER BY period_number;
