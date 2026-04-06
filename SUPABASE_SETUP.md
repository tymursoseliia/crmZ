# Supabase Setup Instructions

## 📋 SQL Scripts для создания таблиц

### 1. Таблица daily_activity (Ежедневная активность менеджеров)

```sql
-- Таблица для учета ежедневной активности менеджеров
CREATE TABLE IF NOT EXISTS daily_activity (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  manager_id TEXT NOT NULL,
  calls_made INTEGER DEFAULT 0,
  meetings_held INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Уникальность: один менеджер - одна запись на день
  UNIQUE(date, manager_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON daily_activity(date);
CREATE INDEX IF NOT EXISTS idx_daily_activity_manager ON daily_activity(manager_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_date_manager ON daily_activity(date, manager_id);

-- Комментарии к полям
COMMENT ON TABLE daily_activity IS 'Ежедневная активность менеджеров';
COMMENT ON COLUMN daily_activity.id IS 'Уникальный идентификатор записи';
COMMENT ON COLUMN daily_activity.date IS 'Дата активности';
COMMENT ON COLUMN daily_activity.manager_id IS 'ID менеджера';
COMMENT ON COLUMN daily_activity.calls_made IS 'Количество звонков за день';
COMMENT ON COLUMN daily_activity.meetings_held IS 'Количество встреч за день';
COMMENT ON COLUMN daily_activity.leads_contacted IS 'Количество контактов с лидами';
COMMENT ON COLUMN daily_activity.notes IS 'Заметки менеджера';

-- RLS политики (Row Level Security)
ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать
CREATE POLICY "Allow read access for all" ON daily_activity
  FOR SELECT USING (true);

-- Политика: все могут создавать
CREATE POLICY "Allow insert access for all" ON daily_activity
  FOR INSERT WITH CHECK (true);

-- Политика: все могут обновлять
CREATE POLICY "Allow update access for all" ON daily_activity
  FOR UPDATE USING (true);

-- Политика: все могут удалять
CREATE POLICY "Allow delete access for all" ON daily_activity
  FOR DELETE USING (true);
```

### 2. Функция для автоматического обновления updated_at

```sql
-- Функция для обновления поля updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для daily_activity
DROP TRIGGER IF EXISTS update_daily_activity_updated_at ON daily_activity;
CREATE TRIGGER update_daily_activity_updated_at
  BEFORE UPDATE ON daily_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Проверка данных

```sql
-- Проверить созданные таблицы
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('daily_activity');

-- Проверить структуру таблицы
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_activity'
ORDER BY ordinal_position;
```

---

## 🚀 Как применить:

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Скопируйте и выполните скрипты выше по порядку
4. Проверьте создание таблиц последним запросом

---

## ✅ После создания таблиц:

Система автоматически начнет работать с новой таблицей для учета активности менеджеров!
