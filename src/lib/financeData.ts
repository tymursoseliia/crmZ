import type { Employee, SystemSettings, ExpenseCategory, Drop } from '@/types/finance';

// Дропы (платежные провайдеры)
export const initialDrops: Drop[] = [
  { id: 'drop1', name: 'Дроп 1', commission: 22 },
  { id: 'drop2', name: 'Дроп 2', commission: 20 },
  { id: 'drop3', name: 'Дроп 3', commission: 25 },
];



// Команда Зета
const zetTeam: Employee[] = [
  { id: 'andrey', name: 'Андрей', role: 'manager', team: 'zet', salary: 350, percentRastamozhka: 15, percentDobiv: 10, percentProfit: 0, isSpecial: false, percentDobivDyadya: 5 },
  { id: 'masha', name: 'Маша', role: 'manager', team: 'zet', salary: 350, percentRastamozhka: 15, percentDobiv: 10, percentProfit: 0, isSpecial: false, percentDobivDyadya: 5 },
  { id: 'danya', name: 'Даня', role: 'manager', team: 'zet', salary: 350, percentRastamozhka: 15, percentDobiv: 10, percentProfit: 0, isSpecial: false, percentDobivDyadya: 5 },
  { id: 'antsik', name: 'Анцик', role: 'manager', team: 'zet', salary: 350, percentRastamozhka: 15, percentDobiv: 10, percentProfit: 0, isSpecial: false, percentDobivDyadya: 5 },
  { id: 'lebedev', name: 'Лебедев', role: 'manager', team: 'zet', salary: 350, percentRastamozhka: 15, percentDobiv: 12.5, percentProfit: 0, isSpecial: false, percentDobivDyadya: 5 },
  { id: 'zet', name: 'Зет', role: 'manager', team: 'zet', salary: 350, percentRastamozhka: 15, percentDobiv: 10, percentProfit: 0, isSpecial: false, percentDobivDyadya: 5 },
  { id: 'ogrmag', name: 'Огрмаг', role: 'manager', team: 'zet', salary: 350, percentRastamozhka: 15, percentDobiv: 10, percentProfit: 0, isSpecial: false, percentDobivDyadya: 5 },
];

// Отдельные (Жигуль, Клыча)
const specialEmployees: Employee[] = [];

// Клоузеры
const closers: Employee[] = [
  { id: 'vanya', name: 'Ваня', role: 'closer', team: null, salary: 0, percentRastamozhka: 0, percentDobiv: 5, percentProfit: 0, isSpecial: false },
  { id: 'pasha', name: 'Паша', role: 'closer', team: null, salary: 0, percentRastamozhka: 0, percentDobiv: 5, percentProfit: 0, isSpecial: false },
  { id: 'dyadya', name: 'Дядя', role: 'closer', team: null, salary: 0, percentRastamozhka: 0, percentDobiv: 10, percentProfit: 0, isSpecial: false },
];

// IT отдел
const itDepartment: Employee[] = [];

// Особые роли
const specialRoles: Employee[] = [];

// Все сотрудники
export const initialEmployees: Employee[] = [
  ...zetTeam,
  ...specialEmployees,
  ...closers,
  ...itDepartment,
  ...specialRoles,
];

// Настройки системы
export const initialSettings: SystemSettings = {
  currentPeriodId: 'period-2026-01-26',
  itFixedCost: 3000, // 3000 за каждый период
  minSalary: 350,
};

// Категории расходов
export const initialExpenseCategories: ExpenseCategory[] = [
  { id: 'cat-security', name: 'Безопасность', type: 'fixed' },
  { id: 'cat-rent', name: 'Аренда', type: 'fixed' },
  { id: 'cat-traffic-ads', name: 'Трафик АДС', type: 'personal' },
  { id: 'cat-manual-ads', name: 'Ручной закуп АДС', type: 'personal' },
  { id: 'cat-rusnoj-tg', name: 'Русной закуп ТГ', type: 'personal' },
  { id: 'cat-avito', name: 'Авито', type: 'personal' },
  { id: 'cat-yandex-direct', name: 'Яндекс директ', type: 'personal' },
  { id: 'cat-yandex', name: 'Яндекс', type: 'personal' },
  { id: 'cat-tg-boost', name: 'Накрутка на ТГ', type: 'personal' },
  { id: 'cat-subscriptions', name: 'Подписки', type: 'common' },
  { id: 'cat-content', name: 'Контент', type: 'personal' },
  { id: 'cat-tech', name: 'Тех. расходы', type: 'tech' },
  { id: 'cat-telephony', name: 'Телефония', type: 'common' },
  { id: 'cat-office', name: 'Офисные расходы', type: 'common' },
];

// Расчет общей ЗП IT отдела
export const getTotalITSalary = (settings: SystemSettings): number => {
  return 0; // Все сотрудники IT удалены
};

// Расчет постоянных расходов за период
export const getFixedExpensesPerPeriod = (settings: SystemSettings): number => {
  return settings.itFixedCost;
};
