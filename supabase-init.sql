-- ========================================
-- SUPABASE INIT SCRIPT
-- Скрипт для инициализации базы данных
-- ========================================

-- Удаляем существующие таблицы если есть
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS operations CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS periods CASCADE;

-- ========================================
-- ТАБЛИЦА: periods (Периоды)
-- ========================================
CREATE TABLE periods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ТАБЛИЦА: employees (Сотрудники)
-- ========================================
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'teamlead', 'closer', 'it', 'special')),
  team TEXT CHECK (team IN ('voha', 'zet', 'office') OR team IS NULL),
  salary NUMERIC(10, 2) DEFAULT 0,
  percent_rastamozhka NUMERIC(5, 2) DEFAULT 0,
  percent_dobiv NUMERIC(5, 2) DEFAULT 0,
  percent_profit NUMERIC(5, 2) DEFAULT 0,
  is_special BOOLEAN DEFAULT FALSE,
  fixed_pay NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ТАБЛИЦА: operations (Операции - доходы)
-- ========================================
CREATE TABLE operations (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  sum_rub NUMERIC(12, 2) NOT NULL,
  drop_id TEXT,
  drop_commission NUMERIC(5, 2) NOT NULL,
  exchange_rate NUMERIC(8, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('растаможка', 'добив')),
  manager_id TEXT NOT NULL REFERENCES employees(id),
  closer_id TEXT REFERENCES employees(id),
  comment TEXT,
  usdt_after_commission NUMERIC(12, 2) NOT NULL,
  manager_earning NUMERIC(12, 2) NOT NULL,
  closer_earning NUMERIC(12, 2),
  team TEXT NOT NULL CHECK (team IN ('voha', 'zet', 'office')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ТАБЛИЦА: expenses (Расходы)
-- ========================================
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  sum_usdt NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'tech', 'fixed', 'common')),
  team_id TEXT CHECK (team_id IN ('voha', 'zet', 'office') OR team_id IS NULL),
  employee_id TEXT REFERENCES employees(id),
  issued_by TEXT NOT NULL,
  recipient TEXT NOT NULL,
  comment TEXT,
  is_for_special_employee BOOLEAN DEFAULT FALSE,
  special_employee_id TEXT REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ТАБЛИЦА: leads (Лиды CRM)
-- ========================================
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  phone2 TEXT,
  stage TEXT NOT NULL CHECK (stage IN ('contract_done', 'gave_requisites', 'payment_customs', 'payment_car', 'payment_recycling', 'payment_fee', 'payment_deposit', 'payment_other', 'completed', 'lost')),
  service_type TEXT NOT NULL CHECK (service_type IN ('rastamozhka', 'dobiv')),
  manager_id TEXT NOT NULL REFERENCES employees(id),
  team_id TEXT NOT NULL CHECK (team_id IN ('voha', 'zet', 'office')),
  amount NUMERIC(12, 2),
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  operation_id TEXT,
  stage_history TEXT, -- JSON массив истории изменения статусов
  lost_reason TEXT CHECK (lost_reason IN ('high_price', 'long_wait', 'found_competitor', 'changed_mind', 'no_money', 'no_response', 'other')),
  lost_reason_text TEXT, -- Подробное описание причины потери
  lost_at_stage TEXT CHECK (lost_at_stage IN ('contract_done', 'gave_requisites', 'payment_customs', 'payment_car', 'payment_recycling', 'payment_fee', 'payment_deposit', 'payment_other', 'completed')) -- На каком этапе реально произошел срез
);

-- ========================================
-- ИНДЕКСЫ для оптимизации запросов
-- ========================================

-- Индексы для operations
CREATE INDEX idx_operations_date ON operations(date);
CREATE INDEX idx_operations_manager_id ON operations(manager_id);
CREATE INDEX idx_operations_team ON operations(team);
CREATE INDEX idx_operations_type ON operations(type);

-- Индексы для expenses
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_employee_id ON expenses(employee_id);
CREATE INDEX idx_expenses_type ON expenses(type);
CREATE INDEX idx_expenses_team_id ON expenses(team_id);

-- Индексы для employees
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_team ON employees(team);

-- Индексы для periods
CREATE INDEX idx_periods_dates ON periods(start_date, end_date);
CREATE INDEX idx_periods_is_closed ON periods(is_closed);

-- Индексы для leads
CREATE INDEX idx_leads_manager_id ON leads(manager_id);
CREATE INDEX idx_leads_team_id ON leads(team_id);
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- ========================================
-- ПОЛИТИКИ БЕЗОПАСНОСТИ (Row Level Security)
-- Отключаем для простоты, но в продакшене рекомендуется настроить
-- ========================================
ALTER TABLE periods DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE operations DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- ========================================
-- КОММЕНТАРИИ к таблицам
-- ========================================
COMMENT ON TABLE periods IS 'Периоды расчета (недели/месяцы)';
COMMENT ON TABLE employees IS 'Сотрудники компании';
COMMENT ON TABLE operations IS 'Операции (доходы): растаможки и добивы';
COMMENT ON TABLE expenses IS 'Расходы компании';
COMMENT ON TABLE leads IS 'Лиды CRM системы';

-- ========================================
-- ВСТАВКА НАЧАЛЬНЫХ ДАННЫХ
-- ========================================

-- Создаем первый период
INSERT INTO periods (id, name, start_date, end_date, is_closed)
VALUES ('period-2026-01-26', 'Период 26.01 - 01.02', '2026-01-26', '2026-02-01', FALSE);

-- ========================================
-- УСПЕШНАЯ ИНИЦИАЛИЗАЦИЯ
-- ========================================
SELECT 'База данных успешно инициализирована!' as message;
