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

  // Actions
  addOperation: (operation: Operation) => void;
  deleteOperation: (id: string) => void;
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  updateEmployee: (employee: Employee) => void;
  setCurrentPeriod: (period: PayPeriod) => void;
  reloadData: () => void; // Перезагрузить данные из localStorage
  resetToInitial: () => void; // Сбросить к начальным данным
  syncEmployees: () => void; // Синхронизировать с начальными данными (добавить новых)

  // Utility
  isLoaded: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Текущий период по умолчанию: 26.01.2026 - 08.02.2026
const defaultPeriod: PayPeriod = {
  id: 'period-2026-01-26',
  startDate: '2026-01-26',
  endDate: '2026-02-08',
  number: 1,
  isClosed: false,
};

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [drops] = useState<Drop[]>(initialDrops);
  const [expenseCategories] = useState<ExpenseCategory[]>(initialExpenseCategories);
  const [currentPeriod, setCurrentPeriod] = useState<PayPeriod>(defaultPeriod);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useSupabase, setUseSupabase] = useState(false);

  // Загрузка данных из localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedOperations = localStorage.getItem('finance_operations');
      const savedExpenses = localStorage.getItem('finance_expenses');
      const savedEmployees = localStorage.getItem('finance_employees');
      const savedPeriod = localStorage.getItem('finance_period');

      if (savedOperations) setOperations(JSON.parse(savedOperations));
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedEmployees) {
        const parsedEmployees = JSON.parse(savedEmployees);
        console.log('Loading employees from localStorage:', parsedEmployees.length);
        setEmployees(parsedEmployees);
      } else {
        console.log('No saved employees, using initial data');
        // Если нет сохраненных данных, сохраняем начальные
        localStorage.setItem('finance_employees', JSON.stringify(initialEmployees));
      }
      if (savedPeriod) setCurrentPeriod(JSON.parse(savedPeriod));
    } catch (error) {
      console.error('Error loading finance data:', error);
    }

    setIsLoaded(true);
  }, []);

  // Сохранение операций
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('finance_operations', JSON.stringify(operations));
    }
  }, [operations, isLoaded]);

  // Сохранение расходов
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('finance_expenses', JSON.stringify(expenses));
    }
  }, [expenses, isLoaded]);

  // Сохранение сотрудников
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('finance_employees', JSON.stringify(employees));
      console.log('Employees saved to localStorage:', employees.length);
    }
  }, [employees, isLoaded]);

  // Сохранение периода
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('finance_period', JSON.stringify(currentPeriod));
    }
  }, [currentPeriod, isLoaded]);

  const addOperation = (operation: Operation) => {
    setOperations(prev => [...prev, operation]);
  };

  const deleteOperation = (id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
  };

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const updateEmployee = (employee: Employee) => {
    setEmployees(prev => {
      const updated = prev.map(emp => emp.id === employee.id ? employee : emp);
      // Немедленно сохраняем в localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('finance_employees', JSON.stringify(updated));
        console.log('Employee updated:', employee.name, employee);
      }
      return updated;
    });
  };

  const reloadData = () => {
    // Принудительная перезагрузка данных из localStorage
    if (typeof window === 'undefined') return;

    try {
      const savedEmployees = localStorage.getItem('finance_employees');
      const savedOperations = localStorage.getItem('finance_operations');
      const savedExpenses = localStorage.getItem('finance_expenses');
      const savedPeriod = localStorage.getItem('finance_period');

      if (savedEmployees) {
        const parsedEmployees = JSON.parse(savedEmployees);
        console.log('Reloading employees from localStorage:', parsedEmployees.length);
        setEmployees([...parsedEmployees]); // Создаем новый массив для принудительного обновления
      }
      if (savedOperations) setOperations([...JSON.parse(savedOperations)]);
      if (savedExpenses) setExpenses([...JSON.parse(savedExpenses)]);
      if (savedPeriod) setCurrentPeriod(JSON.parse(savedPeriod));

      alert('Данные обновлены из хранилища!');
    } catch (error) {
      console.error('Error reloading data:', error);
      alert('Ошибка при обновлении данных');
    }
  };

  const resetToInitial = () => {
    // Сброс всех данных к начальным значениям
    if (!confirm('Вы уверены? Это удалит все данные и вернет к начальным значениям!')) {
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('finance_employees');
      localStorage.removeItem('finance_operations');
      localStorage.removeItem('finance_expenses');
      localStorage.removeItem('finance_period');
    }

    setEmployees([...initialEmployees]);
    setOperations([]);
    setExpenses([]);
    setCurrentPeriod(defaultPeriod);

    alert('Данные сброшены к начальным значениям!');
  };

  const syncEmployees = () => {
    // Синхронизация: добавляем новых сотрудников из initialEmployees, обновляем существующих
    setEmployees(prev => {
      const updated = [...initialEmployees]; // Берем все начальные данные

      // Для каждого сотрудника проверяем, был ли он отредактирован пользователем
      const result = updated.map(initial => {
        const existing = prev.find(e => e.id === initial.id);
        // Если сотрудник существует И его ставка отличается от начальной - оставляем пользовательские данные
        if (existing) {
          // Сохраняем изменения пользователя для ставки и процентов
          return {
            ...initial,
            salary: existing.salary !== 350 && existing.salary !== initial.salary ? existing.salary : initial.salary,
            percentRastamozhka: existing.percentRastamozhka !== initial.percentRastamozhka ? existing.percentRastamozhka : initial.percentRastamozhka,
            percentDobiv: existing.percentDobiv !== initial.percentDobiv ? existing.percentDobiv : initial.percentDobiv,
            percentProfit: existing.percentProfit !== initial.percentProfit ? existing.percentProfit : initial.percentProfit,
            fixedPay: existing.fixedPay !== initial.fixedPay ? existing.fixedPay : initial.fixedPay,
          };
        }
        return initial; // Новый сотрудник - берем как есть
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('finance_employees', JSON.stringify(result));
      }

      console.log('Employees synced! Added new employees from initial data.');
      return result;
    });

    alert('Данные сотрудников синхронизированы! Новые сотрудники добавлены, ваши изменения сохранены.');
  };

  const value: FinanceContextType = {
    operations,
    expenses,
    employees,
    drops,
    expenseCategories,
    currentPeriod,
    addOperation,
    deleteOperation,
    addExpense,
    deleteExpense,
    updateEmployee,
    setCurrentPeriod,
    reloadData,
    resetToInitial,
    syncEmployees,
    isLoaded,
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
