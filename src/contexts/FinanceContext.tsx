"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Operation, Expense, Employee, PayPeriod, Drop, ExpenseCategory } from '@/types/finance';
import { initialEmployees, initialSettings, initialExpenseCategories, initialDrops } from '@/lib/financeData';
import { supabase, checkSupabaseConnection, dbToApp, appToDb } from '@/lib/supabase';

interface FinanceContextType {
  // Data
  operations: Operation[];
  expenses: Expense[];
  employees: Employee[];
  drops: Drop[];
  expenseCategories: ExpenseCategory[];
  currentPeriod: PayPeriod;
  periods: PayPeriod[];

  // Actions
  addOperation: (operation: Operation) => Promise<void>;
  deleteOperation: (id: string) => Promise<void>;
  updateOperation: (id: string, updatedOperation: Operation) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpense: (id: string, updatedExpense: Expense) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  setCurrentPeriod: (period: PayPeriod) => void;
  createNewPeriod: () => Promise<void>;
  closePeriod: (periodId: string) => Promise<void>;
  switchToPeriod: (periodId: string) => void;
  reloadData: () => Promise<void>;
  resetToInitial: () => Promise<void>;
  syncEmployees: () => Promise<void>;

  // Utility
  isLoaded: boolean;
  useSupabase: boolean; // Показывает, используется ли Supabase
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Текущий период по умолчанию: 26.01.2026 - 08.02.2026
const defaultPeriod: PayPeriod = {
  id: 'period-2026-01-26',
  startDate: '2026-01-26',
  endDate: '2026-02-08',
  number: 1,
  isClosed: false,
  calculation_version: 'v1' // СТАРАЯ ЛОГИКА (закрытый период)
};

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [drops] = useState<Drop[]>(initialDrops);
  const [expenseCategories] = useState<ExpenseCategory[]>(initialExpenseCategories);
  const [currentPeriod, setCurrentPeriod] = useState<PayPeriod>(defaultPeriod);
  const [periods, setPeriods] = useState<PayPeriod[]>([defaultPeriod]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useSupabase, setUseSupabase] = useState(false);

  // ===== ЗАГРУЗКА ДАННЫХ =====
  useEffect(() => {
    loadInitialData();
  }, []);

  // ===== REAL-TIME СИНХРОНИЗАЦИЯ ПЕРИОДОВ =====
  useEffect(() => {
    if (!supabase || !useSupabase) return;

    const channel = supabase
      .channel('finance-periods-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'finance_periods'
        },
        (payload) => {
          console.log('[FinanceContext] Real-time update:', payload);

          if (payload.eventType === 'UPDATE') {
            const updatedPeriodDb = payload.new;
            const oldPeriodDb = payload.old;

            const updatedPeriod: PayPeriod = {
              id: updatedPeriodDb.id,
              startDate: updatedPeriodDb.start_date,
              endDate: updatedPeriodDb.end_date,
              number: updatedPeriodDb.period_number,
              isClosed: updatedPeriodDb.is_closed || false,
              calculation_version: updatedPeriodDb.calculation_version || 'v1'
            };

            // Обновляем список периодов
            setPeriods(prev => prev.map(p =>
              p.id === updatedPeriod.id ? updatedPeriod : p
            ));

            // Если обновлён текущий период
            if (currentPeriod.id === updatedPeriod.id) {
              setCurrentPeriod(updatedPeriod);

              // Уведомление о закрытии периода другим пользователем
              if (!oldPeriodDb.is_closed && updatedPeriodDb.is_closed) {
                alert('🔒 Период был закрыт другим пользователем.\n\nРедактирование данных за этот период больше невозможно.');
              }
            }
          } else if (payload.eventType === 'INSERT') {
            const newPeriodDb = payload.new;
            const newPeriod: PayPeriod = {
              id: newPeriodDb.id,
              startDate: newPeriodDb.start_date,
              endDate: newPeriodDb.end_date,
              number: newPeriodDb.period_number,
              isClosed: newPeriodDb.is_closed || false,
              calculation_version: newPeriodDb.calculation_version || 'v1'
            };

            setPeriods(prev => [...prev, newPeriod]);
            console.log('[FinanceContext] Новый период создан:', newPeriod);
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setPeriods(prev => prev.filter(p => p.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, useSupabase, currentPeriod]);

  const loadInitialData = async () => {
    if (typeof window === 'undefined') return;

    // Проверяем, доступен ли Supabase
    const supabaseAvailable = await checkSupabaseConnection();
    setUseSupabase(supabaseAvailable);

    if (supabaseAvailable && supabase) {
      console.log('[Supabase] Используется Supabase БД');
      await loadFromSupabase();
      setIsLoaded(true);
    } else {
      console.error('[ERROR] Supabase не подключен! Проверьте настройки .env');
      alert('❌ Не удалось подключиться к базе данных. Обратитесь к администратору.');
    }
  };

  const loadFromSupabase = async () => {
    if (!supabase) return;

    try {
      // Загружаем сотрудников
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (empError) throw empError;
      if (employeesData) {
        setEmployees(employeesData.map(dbToApp.employee));
      }

      // Загружаем операции
      const { data: operationsData, error: opsError } = await supabase
        .from('operations')
        .select('*')
        .order('date', { ascending: false });

      if (opsError) throw opsError;
      if (operationsData) {
        const mappedOps = operationsData.map(dbToApp.operation);
        setOperations(mappedOps);


      }

      // Загружаем расходы
      const { data: expensesData, error: expError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (expError) throw expError;
      if (expensesData) {
        setExpenses(expensesData.map(dbToApp.expense));
      }

      // Загружаем периоды
      const { data: periodsData, error: periodsError } = await supabase
        .from('finance_periods')
        .select('*')
        .order('period_number', { ascending: true });

      if (periodsError) {
        console.error('[FinanceContext] Ошибка загрузки периодов:', periodsError?.message || periodsError);
        console.error('Full object:', periodsError);
      } else if (periodsData && periodsData.length > 0) {
        const mappedPeriods: PayPeriod[] = periodsData.map(p => ({
          id: p.id,
          startDate: p.start_date,
          endDate: p.end_date,
          number: p.period_number,
          isClosed: p.is_closed || false,
          calculation_version: p.calculation_version || 'v1' // Версия логики расчётов
        }));
        setPeriods(mappedPeriods);

        // Устанавливаем текущий период (последний или первый незакрытый)
        const lastPeriod = mappedPeriods[mappedPeriods.length - 1];
        setCurrentPeriod(lastPeriod);
        console.log('[FinanceContext] Периоды загружены из Supabase:', mappedPeriods.length);
      } else {
        // Если периодов нет в БД, создаём первый
        console.log('[FinanceContext] Периоды не найдены, используем defaultPeriod');
        setPeriods([defaultPeriod]);
        setCurrentPeriod(defaultPeriod);

        // Сохраняем дефолтный период в БД
        await supabase.from('finance_periods').insert({
          id: defaultPeriod.id,
          start_date: defaultPeriod.startDate,
          end_date: defaultPeriod.endDate,
          period_number: defaultPeriod.number,
          is_closed: false,
          calculation_version: 'v1' // СТАРАЯ ЛОГИКА
        });
      }

      console.log('[Supabase] Данные загружены из Supabase');
    } catch (error) {
      console.error('Ошибка загрузки из Supabase:', error);
      alert('❌ Не удалось загрузить данные из базы данных. Проверьте подключение к Supabase.');
    }
  };

  // ===== ОПЕРАЦИИ =====
  const addOperation = async (operation: Operation) => {
    if (useSupabase && supabase) {
      const { error } = await supabase
        .from('operations')
        .insert([appToDb.operation(operation)] as any);

      if (error) {
        console.error('Ошибка добавления операции:', error);
        alert('Ошибка сохранения в БД');
        return;
      }
    }
    setOperations(prev => [...prev, operation]);
  };

  const deleteOperation = async (id: string) => {
    if (useSupabase && supabase) {
      const { error } = await supabase
        .from('operations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Ошибка удаления операции:', error);
        alert('Ошибка удаления из БД');
        return;
      }
    }
    setOperations(prev => prev.filter(op => op.id !== id));
  };

  const updateOperation = async (id: string, updatedOperation: Operation) => {
    if (useSupabase && supabase) {
      const { error } = await supabase
        .from('operations')
        .update({
          date: updatedOperation.date,
          sum_rub: updatedOperation.sumRub,
          drop_id: updatedOperation.dropId,
          drop_commission: updatedOperation.dropCommission,
          exchange_rate: updatedOperation.exchangeRate,
          type: updatedOperation.type,
          manager_id: updatedOperation.managerId,
          closer_id: updatedOperation.closerId,
          comment: updatedOperation.comment,
          usdt_after_commission: updatedOperation.usdtAfterCommission,
          manager_earning: updatedOperation.managerEarning,
          closer_earning: updatedOperation.closerEarning,
          team: updatedOperation.team,
        })
        .eq('id', id);

      if (error) {
        console.error('Ошибка обновления операции в БД:', error);
        throw error;
      }
    }

    setOperations(prev => prev.map(op => op.id === id ? updatedOperation : op));
  };

  // ===== РАСХОДЫ =====
  const addExpense = async (expense: Expense) => {
    if (useSupabase && supabase) {
      const { error } = await supabase
        .from('expenses')
        .insert([appToDb.expense(expense)] as any);

      if (error) {
        console.error('Ошибка добавления расхода:', error);
        alert('Ошибка сохранения в БД');
        return;
      }
    }
    setExpenses(prev => [...prev, expense]);
  };

  const deleteExpense = async (id: string) => {
    if (useSupabase && supabase) {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Ошибка удаления расхода:', error);
        alert('Ошибка удаления из БД');
        return;
      }
    }
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const updateExpense = async (id: string, updatedExpense: Expense) => {
    if (useSupabase && supabase) {
      const { error } = await supabase
        .from('expenses')
        .update({
          date: updatedExpense.date,
          category: updatedExpense.category,
          sum_usdt: updatedExpense.sumUsdt,
          type: updatedExpense.type,
          team_id: updatedExpense.teamId,
          employee_id: updatedExpense.employeeId,
          issued_by: updatedExpense.issuedBy,
          recipient: updatedExpense.recipient,
          comment: updatedExpense.comment,
        })
        .eq('id', id);

      if (error) {
        console.error('Ошибка обновления расхода в БД:', error);
        throw error;
      }
    }

    setExpenses(prev => prev.map(exp => exp.id === id ? updatedExpense : exp));
  };

  // ===== СОТРУДНИКИ =====
  const updateEmployee = async (employee: Employee) => {
    if (supabase) {
      const { error } = await supabase
        .from('employees')
        .update(appToDb.employee(employee))
        .eq('id', employee.id);

      if (error) {
        console.error('Ошибка обновления сотрудника:', error);
        alert('Ошибка сохранения в БД');
        return;
      }
    }

    setEmployees(prev => prev.map(emp => emp.id === employee.id ? employee : emp));
  };

  // ===== ПЕРИОДЫ =====
  const createNewPeriod = async () => {
    // Находим последний период
    const lastPeriod = periods.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )[0];

    // Создаем новый период (следующие 2 недели)
    const lastEndDate = new Date(lastPeriod.endDate);
    const newStartDate = new Date(lastEndDate);
    newStartDate.setDate(newStartDate.getDate() + 1);

    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + 13); // 14 дней всего

    const newPeriod: PayPeriod = {
      id: `period-${newStartDate.toISOString().split('T')[0]}`,
      startDate: newStartDate.toISOString().split('T')[0],
      endDate: newEndDate.toISOString().split('T')[0],
      number: lastPeriod.number + 1,
      isClosed: false,
      calculation_version: 'v3' // НОВАЯ ЛОГИКА: независимые кассы + вычет ЗП клоузеров с команд
    };

    const updatedPeriods = [...periods, newPeriod];
    setPeriods(updatedPeriods);
    setCurrentPeriod(newPeriod);

    // Сохраняем в Supabase
    if (supabase) {
      try {
        const { error } = await supabase
          .from('finance_periods')
          .insert({
            id: newPeriod.id,
            start_date: newPeriod.startDate,
            end_date: newPeriod.endDate,
            period_number: newPeriod.number,
            is_closed: false,
            calculation_version: 'v3' // НОВАЯ ЛОГИКА
          });

        if (error) {
          console.error('[FinanceContext] Ошибка создания периода в Supabase:', error);
          alert(`Ошибка при сохранении периода в базу данных:\n${error.message}\n\nПожалуйста, убедитесь, что в БД добавлены нужные колонки.`);
        }
      } catch (error) {
        console.error('[FinanceContext] Неизвестная ошибка создания периода:', error);
        alert('Неизвестная ошибка при сохранении нового периода.');
      }
    }
  };

  const closePeriod = async (periodId: string) => {
    const updatedPeriods = periods.map(p =>
      p.id === periodId ? { ...p, isClosed: true } : p
    );

    setPeriods(updatedPeriods);

    if (currentPeriod.id === periodId) {
      setCurrentPeriod(prev => ({ ...prev, isClosed: true }));
    }

    // Сохраняем в Supabase
    if (supabase) {
      try {
        const { error } = await supabase
          .from('finance_periods')
          .update({ is_closed: true })
          .eq('id', periodId);

        if (error) {
          console.error('[FinanceContext] Ошибка закрытия периода в Supabase:', error);
          alert(`Ошибка при закрытии периода в базе данных:\n${error.message}`);
        }
      } catch (error) {
        console.error('[FinanceContext] Неизвестная ошибка закрытия периода:', error);
      }
    }
  };

  const switchToPeriod = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (period) {
      setCurrentPeriod(period);
    }
  };

  // ===== УТИЛИТЫ =====
  const reloadData = async () => {
    await loadFromSupabase();
    alert('Данные обновлены из Supabase!');
  };

  const resetToInitial = async () => {
    if (!confirm('Вы уверены? Это удалит ВСЕ данные и вернет к начальным значениям!')) {
      return;
    }

    if (useSupabase && supabase) {
      try {
        // Удаляем все операции и расходы
        await supabase.from('operations').delete().neq('id', '');
        await supabase.from('expenses').delete().neq('id', '');

        // Сбрасываем сотрудников к начальным
        await supabase.from('employees').delete().neq('id', '');
        for (const emp of initialEmployees) {
          // @ts-ignore - Supabase types auto-generated later
          await supabase.from('employees').insert([appToDb.employee(emp)] as any);
        }

        alert('БД сброшена к начальным значениям!');

        // Перезагружаем данные из БД
        await loadFromSupabase();
      } catch (error) {
        console.error('Ошибка сброса БД:', error);
        alert('Ошибка сброса БД');
      }
    }
  };

  const syncEmployees = async () => {
    const oldCount = employees.length;

    const newEmployees = [...initialEmployees].map(initial => {
      const existing = employees.find(e => e.id === initial.id);
      if (existing) {
        return {
          ...initial,
          salary: existing.salary !== 350 && existing.salary !== initial.salary ? existing.salary : initial.salary,
          percentRastamozhka: existing.percentRastamozhka !== initial.percentRastamozhka ? existing.percentRastamozhka : initial.percentRastamozhka,
          percentDobiv: existing.percentDobiv !== initial.percentDobiv ? existing.percentDobiv : initial.percentDobiv,
          percentProfit: existing.percentProfit !== initial.percentProfit ? existing.percentProfit : initial.percentProfit,
          fixedPay: existing.fixedPay !== initial.fixedPay ? existing.fixedPay : initial.fixedPay,
        };
      }
      return initial;
    });

    const newCount = newEmployees.length;
    const addedCount = newCount - oldCount;

    if (useSupabase && supabase) {
      try {
        // Обновляем каждого сотрудника
        for (const emp of newEmployees) {
          // @ts-ignore - Supabase types auto-generated later
          const { error } = await supabase
            .from('employees')
            .upsert([appToDb.employee(emp)] as any);

          if (error) throw error;
        }

        if (addedCount > 0) {
          alert(`Добавлено новых сотрудников: ${addedCount}\nВсе данные синхронизированы с БД!`);
        } else {
          alert('[SUCCESS] Данные сотрудников обновлены! Новых сотрудников не найдено.');
        }
      } catch (error) {
        console.error('Ошибка синхронизации:', error);
        alert('[ERROR] Ошибка синхронизации с БД');
      }
    }

    setEmployees(newEmployees);
  };

  const value: FinanceContextType = {
    operations,
    expenses,
    employees,
    drops,
    expenseCategories,
    currentPeriod,
    periods,
    addOperation,
    deleteOperation,
    updateOperation,
    addExpense,
    deleteExpense,
    updateExpense,
    updateEmployee,
    setCurrentPeriod,
    createNewPeriod,
    closePeriod,
    switchToPeriod,
    reloadData,
    resetToInitial,
    syncEmployees,
    isLoaded,
    useSupabase,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }

  return context;
}
