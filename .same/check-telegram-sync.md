# Проверка синхронизации Telegram Analytics

## Проблема

## Диагностика

### 1. Откройте консоль браузера (F12)
- `[Telegram] Supabase не доступен` → БД не подключена
- `[Telegram] Ошибка загрузки` → таблица не создана
- Если ошибок нет → данные должны сохраняться в БД

### 2. Проверьте Supabase
1. Зайдите в Table Editor
2. Должны быть таблицы:
   - `telegram_periods` (периоды)
   - `telegram_daily_leads` (данные по лидам)


### 3. SQL скрипты для создания таблиц

**Скрипт 1: telegram_periods**
```sql
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

INSERT INTO telegram_periods (id, period_number, start_date, end_date, is_current, is_closed)
VALUES ('tg-period-2026-01-26', 1, '2026-01-26', '2026-02-08', true, false)
ON CONFLICT (id) DO NOTHING;
```

**Скрипт 2: telegram_daily_leads** (если еще не создана)
```sql
CREATE TABLE IF NOT EXISTS telegram_daily_leads (
  id BIGSERIAL PRIMARY KEY,
  manager_id TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  date DATE NOT NULL,
  new_leads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manager_id, date)
);

CREATE INDEX IF NOT EXISTS idx_telegram_daily_leads_date ON telegram_daily_leads(date);
CREATE INDEX IF NOT EXISTS idx_telegram_daily_leads_manager ON telegram_daily_leads(manager_id);
```

### 4. После выполнения SQL
1. Очистите localStorage на ОБОИХ устройствах:
   - Откройте консоль (F12)
   - Вкладка Console
   - Выполните: `localStorage.clear()`
2. Обновите страницу (Ctrl+Shift+R)
3. Введите данные заново
4. Проверьте на втором устройстве

### 5. Проверка данных в БД
```sql
-- Проверить периоды
SELECT * FROM telegram_periods ORDER BY period_number;

-- Проверить введенные данные
SELECT * FROM telegram_daily_leads ORDER BY date DESC, manager_name;
```

