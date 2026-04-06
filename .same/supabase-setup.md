# Настройка Supabase для финансовой системы

## 1. Создание проекта Supabase

1. Перейдите на https://supabase.com
2. Нажмите "Start your project"
3. Войдите через GitHub
4. Нажмите "New Project"
5. Выберите организацию и введите:
   - Project name: `tuv-finance` (или любое другое)
   - Database Password: (придумайте надежный пароль и сохраните его)
   - Region: Europe (Frankfurt) - ближайший к вам регион
6. Нажмите "Create new project" и подождите ~2 минуты

## 2. Создание таблиц БД

1. В левом меню выберите **SQL Editor**
2. Нажмите **New query**
3. Вставьте весь SQL код ниже и нажмите **RUN**:

```sql
-- ============================================
-- ФИНАНСОВАЯ СИСТЕМА - СХЕМА БД
-- ============================================

-- 1. Таблица сотрудников
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'closer', 'teamlead', 'it', 'special')),
  team TEXT CHECK (team IN ('voha', 'zet', 'office') OR team IS NULL),
  salary DECIMAL(10,2) DEFAULT 0,
  percent_rastamozhka DECIMAL(5,2) DEFAULT 0,
  percent_dobiv DECIMAL(5,2) DEFAULT 0,
  percent_profit DECIMAL(5,2) DEFAULT 0,
  is_special BOOLEAN DEFAULT FALSE,
  fixed_pay DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Таблица дропов (платежных провайдеров)
CREATE TABLE drops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  commission DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Таблица операций (доходов)
CREATE TABLE operations (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  sum_rub DECIMAL(12,2) NOT NULL,
  drop_id TEXT NOT NULL REFERENCES drops(id),
  drop_commission DECIMAL(5,2) NOT NULL,
  exchange_rate DECIMAL(10,4) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('растаможка', 'добив')),
  manager_id TEXT NOT NULL REFERENCES employees(id),
  closer_id TEXT REFERENCES employees(id),
  comment TEXT,
  usdt_after_commission DECIMAL(12,2) NOT NULL,
  manager_earning DECIMAL(12,2) NOT NULL,
  closer_earning DECIMAL(12,2),
  team TEXT NOT NULL CHECK (team IN ('voha', 'zet', 'office')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Таблица категорий расходов
CREATE TABLE expense_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'tech', 'fixed', 'common')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Таблица расходов
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  sum_usdt DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'tech', 'fixed', 'common')),
  team_id TEXT CHECK (team_id IN ('voha', 'zet', 'office')),
  employee_id TEXT REFERENCES employees(id),
  issued_by TEXT NOT NULL,
  recipient TEXT NOT NULL,
  comment TEXT,
  is_for_special_employee BOOLEAN DEFAULT FALSE,
  special_employee_id TEXT REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Таблица настроек системы
CREATE TABLE system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  current_period_id TEXT NOT NULL,
  security_cost DECIMAL(12,2) DEFAULT 30000,
  rent_cost DECIMAL(12,2) DEFAULT 15500,
  it_salary_ronaldu DECIMAL(10,2) DEFAULT 1750,
  it_salary_prius DECIMAL(10,2) DEFAULT 1400,
  it_salary_skorpion DECIMAL(10,2) DEFAULT 1400,
  it_salary_tverdik DECIMAL(10,2) DEFAULT 1400,
  it_salary_telephony DECIMAL(10,2) DEFAULT 1050,
  min_salary DECIMAL(10,2) DEFAULT 350,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Таблица периодов расчета
CREATE TABLE pay_periods (
  id TEXT PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number INT NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
-- ============================================

CREATE INDEX idx_operations_date ON operations(date);
CREATE INDEX idx_operations_manager ON operations(manager_id);
CREATE INDEX idx_operations_team ON operations(team);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_employee ON expenses(employee_id);
CREATE INDEX idx_employees_team ON employees(team);
CREATE INDEX idx_employees_role ON employees(role);

-- ============================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- ============================================

-- Дропы
INSERT INTO drops (id, name, commission) VALUES
  ('drop1', 'Дроп 1', 22),
  ('drop2', 'Дроп 2', 20),
  ('drop3', 'Дроп 3', 25);

-- Категории расходов
INSERT INTO expense_categories (id, name, type) VALUES
  ('cat-traffic', 'Трафик адс', 'personal'),
  ('cat-telephony', 'Телефония', 'common'),
  ('cat-subscriptions', 'Подписки', 'common'),
  ('cat-avito', 'Авито', 'personal'),
  ('cat-leads', 'Заявки', 'common'),
  ('cat-tech', 'Тех. расходы', 'tech'),
  ('cat-auto', 'Авто', 'common'),
  ('cat-security', 'Безопасность', 'fixed'),
  ('cat-rent', 'Аренда', 'fixed'),
  ('cat-content', 'Контент', 'personal'),
  ('cat-other', 'Прочее', 'common');

-- Команда Вохи
INSERT INTO employees (id, name, role, team, salary, percent_rastamozhka, percent_dobiv, percent_profit, is_special) VALUES
  ('futbolist', 'Футболист', 'manager', 'voha', 350, 15, 10, 0, false),
  ('milosh', 'Милош', 'manager', 'voha', 350, 15, 10, 0, false),
  ('hata', 'Хата', 'manager', 'voha', 350, 15, 10, 0, false),
  ('brus', 'Брус', 'manager', 'voha', 350, 15, 10, 0, false),
  ('berlet', 'Берлет', 'manager', 'voha', 350, 15, 10, 0, false),
  ('tyazhik', 'Тяжик', 'manager', 'voha', 350, 15, 10, 0, false),
  ('poltava', 'Полтава', 'manager', 'voha', 350, 15, 10, 0, false),
  ('dyadya', 'Дядя', 'manager', 'voha', 350, 15, 10, 0, false),
  ('furion', 'Фурион', 'manager', 'voha', 350, 15, 10, 0, false),
  ('voha', 'Воха', 'teamlead', 'voha', 0, 15, 10, 5, false);

-- Команда Зета
INSERT INTO employees (id, name, role, team, salary, percent_rastamozhka, percent_dobiv, percent_profit, is_special) VALUES
  ('andrey', 'Андрей', 'manager', 'zet', 350, 15, 10, 0, false),
  ('masha', 'Маша', 'manager', 'zet', 350, 15, 10, 0, false),
  ('danya', 'Даня', 'manager', 'zet', 350, 15, 10, 0, false),
  ('bodya', 'Бодя', 'manager', 'zet', 350, 15, 10, 0, false),
  ('antsik', 'Анцик', 'manager', 'zet', 350, 15, 10, 0, false),
  ('maer', 'Маер', 'manager', 'zet', 350, 15, 10, 0, false),
  ('lebedev', 'Лебедев', 'manager', 'zet', 350, 15, 12.5, 0, false),
  ('zet', 'Зет', 'teamlead', 'zet', 0, 15, 10, 5, false),
  ('ogrmag', 'Огрмаг', 'manager', 'zet', 350, 15, 10, 0, false);

-- Особые (50/50)
INSERT INTO employees (id, name, role, team, salary, percent_rastamozhka, percent_dobiv, percent_profit, is_special) VALUES
  ('zhigul', 'Жигуль', 'manager', 'office', 0, 50, 50, 0, true),
  ('klycha', 'Кльнча', 'manager', 'office', 0, 50, 50, 0, true);

-- Клоузеры
INSERT INTO employees (id, name, role, team, salary, percent_rastamozhka, percent_dobiv, percent_profit, is_special) VALUES
  ('vanya', 'Ваня', 'closer', NULL, 0, 0, 5, 0, false),
  ('pasha', 'Паша', 'closer', NULL, 0, 0, 5, 0, false),
  ('valera', 'Валера', 'closer', NULL, 0, 0, 5, 0, false);

-- IT отдел
INSERT INTO employees (id, name, role, team, salary, percent_rastamozhka, percent_dobiv, percent_profit, is_special) VALUES
  ('ronaldu', 'Роналду', 'it', NULL, 1750, 0, 0, 0, false),
  ('prius', 'Приус', 'it', NULL, 1400, 0, 0, 0, false),
  ('skorpion', 'Скорпион', 'it', NULL, 1400, 0, 0, 0, false),
  ('tverdik', 'Твердик', 'it', NULL, 1400, 0, 0, 0, false),
  ('telephony', 'Телефония', 'it', NULL, 1050, 0, 0, 0, false);

-- Особые роли
INSERT INTO employees (id, name, role, team, salary, percent_rastamozhka, percent_dobiv, percent_profit, is_special, fixed_pay) VALUES
  ('photoshop', 'Фотошоп', 'special', NULL, 0, 0, 0, 0, false, 2500),
  ('zvuk', 'Звук', 'special', NULL, 0, 0, 0, 2, false, NULL);

-- Текущий период
INSERT INTO pay_periods (id, start_date, end_date, number, is_closed) VALUES
  ('period-2026-01-26', '2026-01-26', '2026-02-08', 1, false);

-- Настройки системы
INSERT INTO system_settings (id, current_period_id) VALUES
  ('default', 'period-2026-01-26');

-- ============================================
-- ПОЛИТИКИ БЕЗОПАСНОСТИ (Row Level Security)
-- ============================================

-- Включаем RLS для всех таблиц
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_periods ENABLE ROW LEVEL SECURITY;

-- Создаем политики для анонимного доступа (для тестирования)
-- ВАЖНО: В production замените на аутентификацию через Supabase Auth

CREATE POLICY "Enable all for anon users" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon users" ON drops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon users" ON operations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon users" ON expense_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon users" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon users" ON system_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon users" ON pay_periods FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- ГОТОВО!
-- ============================================
```

## 3. Получение API ключей

1. В левом меню выберите **Project Settings** (иконка шестеренки)
2. Выберите **API**
3. Скопируйте два значения:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **anon public** ключ (длинная строка начинающаяся с `eyJ...`)

## 4. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта `tuv-report-generator`:

```env
NEXT_PUBLIC_SUPABASE_URL=ваш_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_key
```

**ВАЖНО:** Для деплоя на Netlify добавьте эти же переменные в настройках проекта:
1. Откройте ваш проект на Netlify
2. Site settings → Environment variables
3. Добавьте обе переменные

## 5. Проверка

После настройки запустите приложение:
```bash
bun dev
```

Откройте `/finances` и проверьте, что данные загружаются из Supabase!

## 6. Просмотр данных

В Supabase:
- **Table Editor** - просмотр и редактирование данных
- **SQL Editor** - выполнение SQL запросов
- **Database** → **Backups** - автоматические бэкапы

## 7. Безопасность для production

После тестирования рекомендуется:
1. Включить Supabase Authentication
2. Заменить анонимные политики на авторизованные
3. Добавить валидацию на уровне БД

---

**Все готово!** Теперь данные хранятся в облаке и будут доступны на любом устройстве.
