# 📊 Как посчитать все расходы

## Метод 1: Через интерфейс (Рекомендуется)

Я добавил специальный компонент, который автоматически считает и показывает все расходы.

### Как посмотреть:

1. **Войдите в систему:**
   - Логин: `lososina2026`
   - Пароль: `lososiambochka2026`

2. **Перейдите в раздел "Финансы"**
   - После входа кликните на вкладку "Финансы" в навигации

3. **Введите пароль финансов:**
   - Пароль: `finances2026`

4. **Откройте вкладку "Расходы"**

5. **Посмотрите статистику:**
   В самом верху страницы вы увидите 4 карточки с детальной информацией:

   - **Общая сумма расходов** - итоговая сумма всех расходов в USDT
   - **Расходы по типам:**
     - Персональные
     - Технические
     - Постоянные
     - Общие
   - **Расходы по командам:**
     - Команда Вохи
     - Команда Зета
     - Офис
     - Без команды
   - **Топ-5 категории расходов** - самые дорогие категории

## Метод 2: Через консоль браузера (Для детального анализа)

Если вам нужен более детальный анализ, вы можете использовать консоль браузера:

1. Откройте страницу финансов в браузере
2. Нажмите F12 (или Ctrl+Shift+I / Cmd+Option+I на Mac)
3. Перейдите на вкладку "Console"
4. Скопируйте и вставьте следующий код:

```javascript
// Получаем данные из localStorage
const expenses = JSON.parse(localStorage.getItem('finance-expenses') || '[]');
const currentPeriod = JSON.parse(localStorage.getItem('finance-currentPeriod') || '{}');

console.log('\n=== АНАЛИЗ РАСХОДОВ ===\n');
console.log('Текущий период:', currentPeriod.startDate, '-', currentPeriod.endDate);
console.log('Всего записей о расходах:', expenses.length);

// Подсчитываем расходы по типам
const byType = {
  personal: 0,
  tech: 0,
  fixed: 0,
  common: 0
};

const byTeam = {
  voha: 0,
  zet: 0,
  office: 0,
  none: 0
};

let totalExpenses = 0;

expenses.forEach(exp => {
  const amount = exp.sumUsdt || 0;
  totalExpenses += amount;

  // По типу
  if (byType[exp.type] !== undefined) {
    byType[exp.type] += amount;
  }

  // По команде
  if (exp.teamId && byTeam[exp.teamId] !== undefined) {
    byTeam[exp.teamId] += amount;
  } else {
    byTeam.none += amount;
  }
});

console.log('\n--- РАСХОДЫ ПО ТИПАМ ---');
console.log('Персональные:', byType.personal.toFixed(2), 'USDT');
console.log('Технические:', byType.tech.toFixed(2), 'USDT');
console.log('Постоянные:', byType.fixed.toFixed(2), 'USDT');
console.log('Общие:', byType.common.toFixed(2), 'USDT');

console.log('\n--- РАСХОДЫ ПО КОМАНДАМ ---');
console.log('Команда Вохи:', byTeam.voha.toFixed(2), 'USDT');
console.log('Команда Зета:', byTeam.zet.toFixed(2), 'USDT');
console.log('Офис:', byTeam.office.toFixed(2), 'USDT');
console.log('Без команды:', byTeam.none.toFixed(2), 'USDT');

console.log('\n--- ИТОГО ---');
console.log('ОБЩАЯ СУММА РАСХОДОВ:', totalExpenses.toFixed(2), 'USDT');

// Детальный список
console.log('\n--- ДЕТАЛЬНЫЙ СПИСОК ---');
expenses.forEach((exp, i) => {
  console.log(`${i+1}. [${exp.date}] ${exp.category} - ${exp.sumUsdt} USDT (Тип: ${exp.type}, Команда: ${exp.teamId || 'нет'})`);
});
```

5. Нажмите Enter
6. Вы увидите полную статистику в консоли

## Типы расходов

### По типам:
- **Персональные (personal)** - расходы конкретной команды
- **Технические (tech)** - технические расходы (делятся между командами)
- **Постоянные (fixed)** - постоянные расходы (аренда, безопасность)
- **Общие (common)** - общие расходы компании

### По командам:
- **Команда Вохи (voha)** - расходы команды Вохи
- **Команда Зета (zet)** - расходы команды Зета
- **Офис (office)** - расходы офиса
- **Без команды (none)** - расходы не привязанные к команде

## Экспорт данных

Для экспорта данных в Excel используйте кнопку "Экспорт" на странице расходов.
