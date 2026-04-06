"use client";

import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { calculateEmployeeSalary } from '@/lib/financeCalculations';
import { initialSettings } from '@/lib/financeData';

export function ExpensesSummary() {
  const { expenses, operations, employees, currentPeriod } = useFinance();

  const summary = useMemo(() => {
    // Подсчет выручки (операций)
    let totalRevenue = 0;
    const revenueByTeam = {
      voha: 0,
      zet: 0,
      office: 0,
    };
    const revenueByType = {
      растаможка: 0,
      добив: 0,
    };

    operations.forEach((op) => {
      const amount = op.usdtAfterCommission || 0;
      totalRevenue += amount;

      // По команде
      if (op.team === 'voha') revenueByTeam.voha += amount;
      else if (op.team === 'zet') revenueByTeam.zet += amount;
      else if (op.team === 'office') revenueByTeam.office += amount;

      // По типу операции
      if (op.type === 'растаможка') revenueByType.растаможка += amount;
      else if (op.type === 'добив') revenueByType.добив += amount;
    });

    // Подсчет расходов
    const expensesByType = {
      personal: 0,
      tech: 0,
      fixed: 0,
      common: 0,
    };

    const expensesByTeam = {
      voha: 0,
      zet: 0,
      office: 0,
      none: 0,
    };

    const expensesByCategory: Record<string, number> = {};
    let totalExpenses = 0;

    expenses.forEach((expense) => {
      const amount = expense.sumUsdt || 0;
      totalExpenses += amount;

      // По типу
      if (expensesByType[expense.type as keyof typeof expensesByType] !== undefined) {
        expensesByType[expense.type as keyof typeof expensesByType] += amount;
      }

      // По команде
      if (expense.teamId && expensesByTeam[expense.teamId as keyof typeof expensesByTeam] !== undefined) {
        expensesByTeam[expense.teamId as keyof typeof expensesByTeam] += amount;
      } else {
        expensesByTeam.none += amount;
      }

      // По категории
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0;
      }
      expensesByCategory[expense.category] += amount;
    });

    // Подсчет зарплат сотрудников
    let totalSalaries = 0;
    employees.forEach((employee) => {
      const salaryData = calculateEmployeeSalary(employee, operations, expenses, initialSettings);
      totalSalaries += salaryData.finalSalary;
    });

    // Чистая прибыль = Выручка - Расходы - Зарплаты
    const netProfit = totalRevenue - totalExpenses - totalSalaries;

    return {
      totalRevenue,
      revenueByTeam,
      revenueByType,
      expensesByType,
      expensesByTeam,
      expensesByCategory,
      totalExpenses,
      totalSalaries,
      netProfit,
      operationsCount: operations.length,
      expensesCount: expenses.length,
    };
  }, [expenses, operations, employees]);

  return (
    <div className="space-y-4">
      {/* Главная статистика: Выручка, Расходы, Прибыль */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Выручка */}
        <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-green-700">Общая выручка</CardDescription>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-700">
              ${summary.totalRevenue.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600">
              Операций: {summary.operationsCount}
            </p>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-muted-foreground">Растаможка: ${summary.revenueByType.растаможка.toFixed(0)}</span>
              <span className="text-muted-foreground">Добив: ${summary.revenueByType.добив.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Расходы */}
        <Card className="border-2 border-red-500 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-red-700">Общие расходы</CardDescription>
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-red-700">
              ${summary.totalExpenses.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-red-600">
              Записей: {summary.expensesCount}
            </p>
          </CardContent>
        </Card>

        {/* Чистая прибыль */}
        <Card className={`border-2 ${summary.netProfit >= 0 ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white' : 'border-orange-500 bg-gradient-to-br from-orange-50 to-white'}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className={summary.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}>
                Чистая прибыль
              </CardDescription>
              <Wallet className={`w-5 h-5 ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
            <CardTitle className={`text-3xl font-bold ${summary.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              ${summary.netProfit.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Период: {currentPeriod.startDate} — {currentPeriod.endDate}
            </p>
            <p className={`text-xs mt-1 ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {summary.netProfit >= 0 ? '✓ Прибыльный период' : '⚠ Убыточный период'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Детальная разбивка */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Выручка по командам */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Выручка по командам</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Команда Вохи:</span>
              <span className="font-medium text-green-700">${summary.revenueByTeam.voha.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Команда Зета:</span>
              <span className="font-medium text-green-700">${summary.revenueByTeam.zet.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Офис:</span>
              <span className="font-medium text-green-700">${summary.revenueByTeam.office.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Расходы по типам */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Расходы по типам</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Персональные:</span>
              <span className="font-medium text-red-700">${summary.expensesByType.personal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Технические:</span>
              <span className="font-medium text-red-700">${summary.expensesByType.tech.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Постоянные:</span>
              <span className="font-medium text-red-700">${summary.expensesByType.fixed.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Общие:</span>
              <span className="font-medium text-red-700">${summary.expensesByType.common.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Расходы по командам */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Расходы по командам</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Команда Вохи:</span>
              <span className="font-medium text-red-700">${summary.expensesByTeam.voha.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Команда Зета:</span>
              <span className="font-medium text-red-700">${summary.expensesByTeam.zet.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Офис:</span>
              <span className="font-medium text-red-700">${summary.expensesByTeam.office.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Без команды:</span>
              <span className="font-medium text-red-700">${summary.expensesByTeam.none.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Топ категории расходов */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Топ категории расходов</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {Object.entries(summary.expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 4)
              .map(([category, amount]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate">{category}:</span>
                  <span className="font-medium ml-2 text-red-700">${amount.toFixed(0)}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
