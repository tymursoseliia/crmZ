// Типы для финансовой CRM системы

export type TeamName = 'zet' | 'office';
export type EmployeeRole = 'manager' | 'closer' | 'teamlead' | 'it' | 'special';
export type OperationType = 'растаможка' | 'добив';
export type ExpenseType = 'personal' | 'tech' | 'fixed' | 'common';

// CRM роли для воронки лидов
export type CRMRole = 'documentalist' | 'teamlead' | 'owner';

// Причины потери лида
export type LostReason =
  | 'high_price'           // Высокая цена
  | 'long_wait'            // Долгое ожидание
  | 'found_competitor'     // Нашел конкурента
  | 'changed_mind'         // Передумал
  | 'no_money'             // Нет денег
  | 'no_response'          // Не отвечает
  | 'other';               // Другое

// Этапы лида в воронке продаж
export type LeadStage =
  | 'contract_done'         // Договор сделан
  | 'gave_requisites'       // Дал реквизиты
  | 'payment_customs'       // Оплата за растаможку
  | 'payment_car'           // Оплата за машину
  | 'payment_recycling'     // Оплата утиль сбора
  | 'payment_fee'           // Оплата госпошлина
  | 'payment_deposit'       // Оплата залоговый платеж
  | 'payment_other'         // Оплата прочее
  | 'completed'             // Завершено
  | 'lost';                 // Потеряно

// Тип услуги
export type ServiceType = 'rastamozhka' | 'dobiv';

// История изменения статуса лида
export interface LeadStageHistory {
  id: string;
  timestamp: string;        // Когда произошло изменение (ISO)
  previousStage: LeadStage | null; // Предыдущий статус (null для первого)
  newStage: LeadStage;      // Новый статус
  changedBy?: string;       // Кто изменил (ID сотрудника или имя)
  notes?: string;           // Комментарий к изменению
  lostReason?: LostReason;  // Причина потери (если newStage === 'lost')
  lostReasonText?: string;  // Дополнительное описание причины
  lostAtStage?: LeadStage;  // На каком этапе реально произошел срез
}

// Лид (потенциальный клиент)
export interface Lead {
  id: string;
  clientName: string;       // ФИО клиента (обязательно)
  phone: string;            // Телефон (обязательно)
  email?: string;           // Email (не обязательно)
  phone2?: string;          // Второй телефон (не обязательно)
  stage: LeadStage;         // Текущий этап (обязательно)
  serviceType: ServiceType; // Тип услуги: растаможка или добив (обязательно)
  managerId: string;        // ID ответственного менеджера (обязательно)
  teamId: TeamName;         // Команда (определяется автоматически по менеджеру)
  amount?: number;          // Сумма оплаты (только для статуса "Оплачено")
  createdBy?: string;       // Кто создал
  createdAt: string;        // Дата создания (ISO)
  updatedAt: string;        // Дата последнего обновления (ISO)
  notes?: string;           // Заметки
  operationId?: string;     // ID связанной операции (если есть)
  stageHistory?: LeadStageHistory[]; // История изменения статусов
  lostReason?: LostReason;  // Причина потери (если stage === 'lost')
  lostReasonText?: string;  // Дополнительное описание причины потери
  lostAtStage?: LeadStage;  // На каком этапе реально произошел срез
}

// Сотрудник
export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  team: TeamName | null; // null для клоузеров, IT, особых
  salary: number; // фиксированная ставка
  percentRastamozhka: number; // % с растаможки
  percentDobiv: number; // % с добива
  percentProfit: number; // % с прибыли (для тимлидов и Звука)
  isSpecial: boolean; // Жигуль, Клыча (50/50)
  fixedPay?: number; // для Фотошопа
  percentDobivDyadya?: number; // % добив Дяди
}

// Дроп (платежный провайдер)
export interface Drop {
  id: string;
  name: string;
  commission: number; // % комиссии
}

// Операция (доход)
export interface Operation {
  id: string;
  date: string; // ISO date
  sumRub: number; // сумма в рублях
  dropId: string; // ID дропа
  dropCommission: number; // % комиссии дропа
  exchangeRate: number; // курс RUB->USDT
  type: OperationType; // растаможка или добив
  managerId: string; // ID менеджера
  closerId?: string; // ID клоузера (если добив)
  comment?: string;

  // Расчетные поля (авто)
  usdtAfterCommission: number; // USDT после комиссии дропа
  managerEarning: number; // начисление менеджеру
  closerEarning?: number; // начисление клоузеру
  team: TeamName; // команда операции
}

// Расход
export interface Expense {
  id: string;
  date: string; // ISO date
  category: string; // категория расхода
  sumUsdt: number; // сумма в USDT
  type: ExpenseType; // тип расхода
  teamId?: TeamName; // для персональных расходов
  employeeId?: string; // на кого выделены деньги
  issuedBy: string; // кто выдал
  recipient: string; // получатель
  comment?: string;


}

// Период расчета (2 недели)
export interface PayPeriod {
  id: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  number: number; // номер периода (1-4 в цикле 2 месяцев)
  isClosed: boolean; // закрыт ли период
  calculation_version?: 'v1' | 'v2' | 'v3'; // версия логики расчётов (v1 - старая, v2 - 4 кассы, v3 - с вычетом ЗП клоузеров из команд)

// Перенос долгов из предыдущего периода
  // (здесь могут быть другие долги)
}

// Начисление зарплаты
export interface SalaryCalculation {
  employeeId: string;
  periodId: string;

  // Доходы
  totalEarnings: number; // общая сумма начислений
  operations: string[]; // ID операций

  // Расходы (для Жигуля, Клычи)
  personalExpenses: number;

  // Итоговая ЗП
  finalSalary: number; // итоговая сумма к выплате
  minSalary: number; // минималка (350 USDT)

  // Долг (если расходы > доходов для особых сотрудников)
  debt?: number; // сумма долга (всегда положительная)
}

// Статистика команды
export interface TeamStats {
  team: TeamName;
  periodId: string;

  // Доходы
  totalRevenue: number;
  operationsCount: number;

  // Расходы
  personalExpenses: number; // персональные расходы команды
  techExpenses: number; // 50% расходов тех.отдела
  fixedExpenses: number; // 50% постоянных расходов
  commonExpenses: number; // 50% общих расходов
  specialExpenses: number; // 25% расходов Жигуля/Клычи
  closersExpenses: number; // Начисления клоузерам за сделки этой команды
  totalExpenses: number;

  // ЗП
  teamSalaries: number; // ЗП команды (без тимлида)
  teamleadSalary: number; // ЗП тимлида (5% от прибыли)
  // Звук удален

  // Прибыль
  netProfit: number; // чистая прибыль команды
}

// Общая статистика офиса
export interface OfficeStats {
  periodId: string;

  totalOfficeRevenue: number;

  // ЗП
  closersSalaries: number; // Ваня, Паша
}

// Настройки системы
export interface SystemSettings {
  currentPeriodId: string;

  // Фиксированный расход на IT (3000 в месяц, т.е. 1500 за 2-недельный период)
  itFixedCost: number; // 3000 USDT / мес

  // Минималка
  minSalary: number; // 350 USDT
}

// Категории расходов
export interface ExpenseCategory {
  id: string;
  name: string;
  type: ExpenseType; // тип по умолчанию
}

// Ежедневная активность менеджера
export interface DailyActivity {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  managerId: string;
  callsMade: number; // Количество звонков
  meetingsHeld: number; // Количество встреч
  leadsContacted: number; // Количество контактов с лидами
  notes?: string; // Заметки менеджера
  createdAt?: string;
  updatedAt?: string;
}
