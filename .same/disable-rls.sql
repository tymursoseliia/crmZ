-- Отключаем RLS для всех таблиц (для разработки)
-- Выполните этот скрипт в Supabase SQL Editor

ALTER TABLE operations DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Если нужно включить обратно, используйте:
-- ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
