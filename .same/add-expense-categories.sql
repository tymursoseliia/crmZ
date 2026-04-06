-- Добавление новых категорий расходов
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- 1. Проверяем существующие категории
SELECT id, name, type FROM expense_categories ORDER BY name;

-- 2. Обновляем название существующей категории (с маленькой на большую букву)
UPDATE expense_categories
SET name = 'Ручной закуп АДС'
WHERE id = 'cat-manual-ads';

-- 3. Добавляем новые категории
INSERT INTO expense_categories (id, name, type)
VALUES
  ('cat-rusnoj-tg', 'Русной закуп ТГ', 'personal'),
  ('cat-avito', 'Авито', 'personal'),
  ('cat-yandex', 'Яндекс', 'personal'),
  ('cat-tg-boost', 'Накрутка на ТГ', 'personal')
ON CONFLICT (id) DO NOTHING;

-- 4. Проверяем результат
SELECT id, name, type FROM expense_categories ORDER BY name;

-- Ожидаемый результат:
-- Должны появиться новые категории:
-- - Авито (personal)
-- - Накрутка на ТГ (personal)
-- - Русной закуп ТГ (personal)
-- - Ручной закуп АДС (обновлено с большой буквы)
-- - Яндекс (personal)
