# ⚡ НАСТРОЙКА SUPABASE REALTIME - АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ

**Дата:** 08 февраля 2026
**Компонент:** Telegram Analytics
**Цель:** Мгновенная синхронизация между всеми пользователями

---

## 🎯 ЧТО ЭТО ДАЁТ

### Без Real-time (старое поведение):
- ❌ Пользователь А закрывает период
- ❌ Пользователь Б **НЕ видит** изменений
- ❌ Нужно обновлять страницу (F5) или нажимать "Обновить"

### С Real-time (новое поведение):
- ✅ Пользователь А закрывает период
- ✅ Пользователь Б **МГНОВЕННО** видит:
  - 🔴 Бейдж "Период закрыт"
  - 🔒 Заблокированные ячейки
  - 📢 Уведомление: "Период был закрыт другим пользователем"
- ✅ **БЕЗ** обновления страницы!

---

## 🛠️ НАСТРОЙКА В SUPABASE

### Шаг 1: Войдите в Supabase Dashboard

1. Откройте https://supabase.com
2. Войдите в свой аккаунт
3. Выберите ваш проект

---

### Шаг 2: Включите Realtime для таблицы

1. **Откройте Database** → **Replication** (в левом меню)
2. Найдите таблицу **`telegram_periods`**
3. Включите переключатель **"Enable Realtime"** для этой таблицы
4. Нажмите **"Save"**

**Скриншот где это находится:**
```
Database → Replication → Source → telegram_periods
[x] Enable Realtime  ← включить этот чекбокс
```

---

### Шаг 3: Проверьте публикацию

В том же разделе **Replication** проверьте:

**Publication:** `supabase_realtime`
**Tables:** Убедитесь что `telegram_periods` в списке

Если таблицы нет в списке:

#### Вариант A: Через UI
1. Database → Publications
2. Найдите `supabase_realtime`
3. Добавьте `telegram_periods` в список таблиц

#### Вариант B: Через SQL
```sql
-- Добавить таблицу в публикацию
ALTER PUBLICATION supabase_realtime
ADD TABLE telegram_periods;
```

---

### Шаг 4: Проверьте настройки RLS (Row Level Security)

Realtime работает только с правильными RLS политиками.

**Проверьте:**
1. Database → Tables → `telegram_periods`
2. Вкладка **Policies**

**Должна быть политика чтения:**
```sql
-- Политика для SELECT (чтение)
CREATE POLICY "Enable read access for all users"
ON telegram_periods
FOR SELECT
USING (true);
```

**Если политики нет, создайте её:**
1. Нажмите **"New Policy"**
2. Template: **"Enable read access for all users"**
3. Table: `telegram_periods`
4. Policy name: `allow_select_all`
5. Operation: `SELECT`
6. Target role: `public`
7. Using expression: `true`
8. Save

---

## 🔍 КАК ПРОВЕРИТЬ ЧТО РАБОТАЕТ

### Тест 1: Проверка в консоли браузера

1. Откройте сайт
2. Откройте DevTools (F12)
3. Вкладка **Console**
4. Должны увидеть:
   ```
   [Telegram] Real-time update: {eventType: 'UPDATE', ...}
   ```

Если видите ошибки:
- `Error: Realtime is not enabled` → Вернитесь к Шагу 2
- `Error: insufficient privileges` → Проверьте RLS политики (Шаг 4)

---

### Тест 2: Проверка с двумя пользователями

**Подготовка:**
1. Откройте сайт в **двух разных браузерах** (Chrome + Firefox)
2. Или в обычном окне + инкогнито
3. Войдите в оба
4. Откройте Telegram Analytics в обоих

**Тест закрытия периода:**
1. **Браузер 1:** Нажмите "Закрыть период"
2. **Браузер 2:** Должен **мгновенно** показать:
   - 🔴 Бейдж "Период закрыт"
   - 📢 Alert: "Период был закрыт другим пользователем"
   - 🔒 Ячейки стали disabled

**Тест создания периода:**
1. **Браузер 1:** Нажмите "Создать новый период"
2. **Браузер 2:** Должен **мгновенно** увидеть новый период в списке

---

## 📝 КОД КОТОРЫЙ ДОБАВЛЕН

### В `TelegramAnalyticsTab.tsx` (строки 69-114):

```typescript
// Real-time синхронизация периодов
useEffect(() => {
  if (!supabase) return;

  // Подписка на изменения в таблице telegram_periods
  const channel = supabase
    .channel('telegram-periods-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Слушаем все события (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'telegram_periods'
      },
      (payload) => {
        console.log('[Telegram] Real-time update:', payload);

        if (payload.eventType === 'UPDATE') {
          const updatedPeriod = payload.new as TelegramPeriod;
          const oldPeriod = payload.old as TelegramPeriod;

          // Обновляем список периодов
          setPeriods(prev => prev.map(p =>
            p.id === updatedPeriod.id ? updatedPeriod : p
          ));

          // Если обновлён текущий период
          if (currentPeriod?.id === updatedPeriod.id) {
            setCurrentPeriod(updatedPeriod);

            // Уведомление о закрытии
            if (!oldPeriod.is_closed && updatedPeriod.is_closed) {
              alert('🔒 Период был закрыт другим пользователем.');
            }
          }
        } else if (payload.eventType === 'INSERT') {
          const newPeriod = payload.new as TelegramPeriod;
          setPeriods(prev => [newPeriod, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setPeriods(prev => prev.filter(p => p.id !== deletedId));
        }
      }
    )
    .subscribe();

  // Очистка при размонтировании
  return () => {
    supabase.removeChannel(channel);
  };
}, [supabase, currentPeriod]);
```

---

## 🎬 КАК ЭТО РАБОТАЕТ

### 1. Подключение к каналу
```typescript
supabase.channel('telegram-periods-changes')
```
Создаётся WebSocket соединение с Supabase.

### 2. Подписка на изменения
```typescript
.on('postgres_changes', { table: 'telegram_periods' }, callback)
```
Слушаем все изменения в таблице `telegram_periods`.

### 3. Обработка событий
- **UPDATE** - период изменён (например, закрыт)
- **INSERT** - создан новый период
- **DELETE** - период удалён

### 4. Обновление UI
```typescript
setPeriods(...) // Обновляем список
setCurrentPeriod(...) // Обновляем текущий период
```
React автоматически перерисовывает компоненты.

### 5. Очистка подписки
```typescript
return () => supabase.removeChannel(channel);
```
При размонтировании компонента закрываем соединение.

---

## 🐛 РЕШЕНИЕ ПРОБЛЕМ

### Проблема: Real-time не работает

**Симптомы:**
- Изменения не появляются у других пользователей
- Нет сообщений в консоли

**Решение:**
1. ✅ Проверьте что Realtime включён (Шаг 2)
2. ✅ Проверьте публикацию (Шаг 3)
3. ✅ Проверьте RLS политики (Шаг 4)
4. ✅ Проверьте консоль на ошибки (F12)

---

### Проблема: "Error: Realtime is not enabled"

**Причина:** Realtime не включён для таблицы

**Решение:**
```sql
-- Включите Realtime через SQL
ALTER TABLE telegram_periods
REPLICA IDENTITY FULL;

-- Добавьте в публикацию
ALTER PUBLICATION supabase_realtime
ADD TABLE telegram_periods;
```

---

### Проблема: "Error: insufficient privileges"

**Причина:** Нет RLS политики для чтения

**Решение:**
```sql
-- Создайте политику чтения
CREATE POLICY "allow_select_telegram_periods"
ON telegram_periods
FOR SELECT
USING (true);
```

---

### Проблема: Работает но медленно

**Причина:** Сетевая задержка или большая нагрузка

**Решение:**
- Проверьте качество интернет-соединения
- Откройте Network в DevTools (F12)
- Проверьте статус Supabase: https://status.supabase.com

---

## 📊 МОНИТОРИНГ

### Проверка активных соединий

В Supabase Dashboard:
1. **Database** → **Realtime** → **Inspector**
2. Смотрите количество активных подписок
3. Проверьте логи событий

---

## 💡 ДОПОЛНИТЕЛЬНЫЕ ВОЗМОЖНОСТИ

### 1. Фильтрация событий

Если хотите слушать только закрытие периодов:
```typescript
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'telegram_periods',
  filter: 'is_closed=eq.true' // только когда is_closed = true
}, callback)
```

### 2. Множественные подписки

Можете добавить подписку и на `telegram_daily_leads`:
```typescript
supabase
  .channel('telegram-all-changes')
  .on('postgres_changes', { table: 'telegram_periods' }, handlePeriods)
  .on('postgres_changes', { table: 'telegram_daily_leads' }, handleLeads)
  .subscribe();
```

### 3. Presence (кто онлайн)

Можете показывать кто сейчас работает с таблицей:
```typescript
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  console.log('Online users:', Object.keys(state).length);
});
```

---

## ✅ ЧЕКЛИСТ НАСТРОЙКИ

- [ ] **Шаг 1:** Вошёл в Supabase Dashboard
- [ ] **Шаг 2:** Включил Realtime для `telegram_periods`
- [ ] **Шаг 3:** Проверил публикацию `supabase_realtime`
- [ ] **Шаг 4:** Проверил RLS политику для SELECT
- [ ] **Тест 1:** Открыл консоль, вижу логи Real-time
- [ ] **Тест 2:** Проверил с двумя браузерами - работает мгновенно

---

## 🎓 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- **Supabase Realtime Docs:** https://supabase.com/docs/guides/realtime
- **Postgres Changes:** https://supabase.com/docs/guides/realtime/postgres-changes
- **Troubleshooting:** https://supabase.com/docs/guides/realtime/troubleshooting

---

**Статус:** ✅ Код добавлен, требуется настройка в Supabase
**Время настройки:** 5-10 минут
**Сложность:** Легко

---

**Автор:** Same AI Assistant
**Generated with:** [Same](https://same.new)
**Дата создания:** 08.02.2026
