# 🚨 ВАЖНО: Миграция БД для поддержки 4 касс

## Проблема

## Причина

## Решение

### Шаг 1: Откройте Supabase SQL Editor
1. Перейдите на https://supabase.com
2. Откройте ваш проект
3. В левом меню выберите **SQL Editor**

### Шаг 2: Выполните миграцию

```sql
-- Удалить старый constraint
ALTER TABLE operations DROP CONSTRAINT IF EXISTS operations_team_check;

-- Добавить новый constraint с 4 кассами
ALTER TABLE operations 
ADD CONSTRAINT operations_team_check 
CHECK (team IN ('voha', 'zet', 'office', 'zhigul', 'klycha'));

-- Обновить комментарий
COMMENT ON COLUMN operations.team IS 
'Команда операции: voha, zet, zhigul, klycha, office';
```

### Шаг 3: Проверка

## Альтернативный метод (если constraint другой)


```sql
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE table_name = 'operations';
```


```sql
ALTER TABLE operations DROP CONSTRAINT <имя_constraint>;
```


## ✅ После успешного выполнения


