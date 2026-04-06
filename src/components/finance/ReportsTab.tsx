"use client";
import { useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PeriodSelector from "@/components/finance/PeriodSelector";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Award,
  Target,
  Zap,
  Crown,
  AlertTriangle,
  Activity,
  Eye,
  PieChart as PieChartIcon,
  BarChart2
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  filterOperationsByPeriod,
  filterExpensesByPeriod,
  calculateTeamStats,
  calculateOfficeStats,
  calculateEmployeeSalary,
  calculateCompanyTotals
} from "@/lib/financeCalculations";
import { initialSettings } from "@/lib/financeData";

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function ReportsTab() {
  const { operations, expenses, employees, currentPeriod, isLoaded } = useFinance();

  const periodOperations = useMemo(() => filterOperationsByPeriod(
    operations,
    currentPeriod.startDate,
    currentPeriod.endDate
  ), [operations, currentPeriod.startDate, currentPeriod.endDate]);

  const periodExpenses = useMemo(() => filterExpensesByPeriod(
    expenses,
    currentPeriod.startDate,
    currentPeriod.endDate
  ), [expenses, currentPeriod.startDate, currentPeriod.endDate]);
  const zetStats = useMemo(() => calculateTeamStats(
    'zet',
    periodOperations,
    periodExpenses,
    employees,
    initialSettings,
    currentPeriod.id,
    currentPeriod.calculation_version || 'v1' // Версия логики расчётов
  ), [periodOperations, periodExpenses, employees, currentPeriod.id, currentPeriod.calculation_version]);

  const officeStats = useMemo(() => calculateOfficeStats(
    periodOperations,
    periodExpenses,
    employees,
    initialSettings,
    currentPeriod.id,
    currentPeriod
  ), [periodOperations, periodExpenses, employees, currentPeriod]);

  const companyTotals = useMemo(() => calculateCompanyTotals(
    zetStats,
    officeStats,
    employees,
    periodOperations,
    periodExpenses,
    initialSettings,
    currentPeriod.calculation_version || 'v1'
  ), [zetStats, officeStats, employees, periodOperations, periodExpenses, currentPeriod.calculation_version]);

  // Топ менеджеров
  const topManagers = useMemo(() => {
    const managers = employees.filter(e => e.role === 'manager' && !e.isSpecial);

    return managers.map(manager => {
      const managerOps = periodOperations.filter(op => op.managerId === manager.id);
      const revenue = managerOps.reduce((sum, op) => sum + op.usdtAfterCommission, 0);
      const earning = managerOps.reduce((sum, op) => sum + op.managerEarning, 0);
      const salary = calculateEmployeeSalary(manager, periodOperations, periodExpenses, initialSettings);

      return {
        id: manager.id,
        name: manager.name,
        team: manager.team,
        operations: managerOps.length,
        revenue,
        earning,
        salary: salary.finalSalary,
        avgCheck: managerOps.length > 0 ? revenue / managerOps.length : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [employees, periodOperations, periodExpenses]);

  // Эффективность команд (Зета)
  const teamEfficiency = useMemo(() => {
    const zetManagers = employees.filter(e => e.team === 'zet' && e.role === 'manager').length;

    return [
      {
        team: 'Команда Зета',
        revenuePerManager: zetManagers > 0 ? zetStats.totalRevenue / zetManagers : 0,
        profitMargin: zetStats.totalRevenue > 0 ? (zetStats.netProfit / zetStats.totalRevenue) * 100 : 0,
        operations: zetStats.operationsCount,
        managers: zetManagers,
        totalRevenue: zetStats.totalRevenue
      }
    ];
  }, [employees, zetStats, officeStats, periodOperations]);

  // Структура расходов
  const expenseStructure = useMemo(() => {
    const totalExpenses = zetStats.totalExpenses;

    return [
      { name: 'ЗП команд', value: zetStats.teamSalaries },
      { name: 'ЗП IT отдела', value: employees.filter(e => e.role === 'it').reduce((sum, e) => sum + (e.fixedPay || e.salary), 0) },
      { name: 'Персональные', value: zetStats.personalExpenses },
      { name: 'Общие', value: zetStats.commonExpenses },
      { name: 'Технические', value: zetStats.techExpenses },
      { name: 'Постоянные', value: zetStats.fixedExpenses }
    ].filter(item => item.value > 0);
  }, [zetStats, employees]);

  // Конверсия растаможка -> добив
  const conversionStats = useMemo(() => {
    const rastamozhka = periodOperations.filter(op => op.type === 'растаможка').length;
    const dobiv = periodOperations.filter(op => op.type === 'добив').length;
    const conversionRate = rastamozhka > 0 ? (dobiv / rastamozhka) * 100 : 0;

    return { rastamozhka, dobiv, conversionRate };
  }, [periodOperations]);

  const formatUSDT = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              Аналитика и отчеты
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Глубокая аналитика для управления бизнесом
            </p>
          </div>
          <PeriodSelector />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* KPI Команд */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-300 opacity-20 rounded-full -mr-16 -mt-16" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Target className="w-5 h-5" />
                Эффективность команд
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={teamEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="team" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `${formatUSDT(value as number)}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="revenuePerManager" fill="#8B5CF6" name="Выручка на менеджера" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {teamEfficiency.map((team, i) => (
                  <div key={i} className="p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-purple-200">
                    <p className="font-semibold text-purple-900">{team.team}</p>
                    <p className="text-gray-600">{team.managers === 1 ? '1 менеджер' : `${team.managers} менеджеров`}</p>
                    <p className="text-purple-700 font-bold text-lg">${formatUSDT(team.revenuePerManager)}{team.managers > 1 ? '/чел' : ''}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-300 opacity-20 rounded-full -mr-16 -mt-16" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Zap className="w-5 h-5" />
                Рентабельность
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Команда Зета</p>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-blue-700">
                      {(zetStats.totalRevenue > 0 ? (zetStats.netProfit / zetStats.totalRevenue) * 100 : 0).toFixed(1)}%
                    </div>
                    {zetStats.netProfit > 0 ? (
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    ) : (
                      <TrendingDown className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">Прибыль</p>
                    <p className="text-base font-bold text-green-700">${formatUSDT(zetStats.netProfit)}</p>
                  </div>
                </div>


              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-amber-50 to-orange-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300 opacity-20 rounded-full -mr-16 -mt-16" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <Activity className="w-5 h-5" />
                Конверсия
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-6xl font-bold text-amber-600 mb-2">
                  {conversionStats.conversionRate.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600 font-medium">Растаможка → Добив</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-amber-200 text-center">
                  <p className="text-gray-600 mb-1">Растаможек</p>
                  <p className="text-3xl font-bold text-amber-700">{conversionStats.rastamozhka}</p>
                </div>
                <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-green-200 text-center">
                  <p className="text-gray-600 mb-1">Добивов</p>
                  <p className="text-3xl font-bold text-green-700">{conversionStats.dobiv}</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white/60 backdrop-blur-sm rounded-lg">
                <p className="text-sm text-center font-medium">
                  {conversionStats.conversionRate >= 100 ? '🎉 Отличная конверсия!' :
                   conversionStats.conversionRate >= 50 ? '👍 Хорошая конверсия' :
                   '⚠️ Низкая конверсия - нужно больше добивов'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Топ менеджеров */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="shadow-lg border-t-4 border-t-yellow-500 cursor-pointer hover:shadow-xl transition-all group">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-6 h-6 text-yellow-600" />
                    Топ менеджеров по выручке
                  </div>
                  <Eye className="w-5 h-5 text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {topManagers.slice(0, 5).map((manager, index) => (
                    <div
                      key={manager.id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400' :
                        index === 1 ? 'bg-gradient-to-r from-gray-100 to-slate-100 border-2 border-gray-300' :
                        index === 2 ? 'bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300' :
                        'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{manager.name}</p>
                            <Badge variant={manager.team === 'zet' ? 'default' : 'secondary'}>
                              {manager.team === 'zet' ? 'Зет' : manager.team === 'zet' ? 'Зет' : 'Офис'}
                            </Badge>
                            {index < 3 && (
                              <Award className={`w-5 h-5 ${
                                index === 0 ? 'text-yellow-500' :
                                index === 1 ? 'text-gray-400' :
                                'text-orange-400'
                              }`} />
                            )}
                          </div>
                          <div className="flex gap-4 mt-1 text-sm text-gray-600">
                            <span>Операций: {manager.operations}</span>
                            <span>Средний чек: ${formatUSDT(manager.avgCheck)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">${formatUSDT(manager.revenue)}</p>
                        <p className="text-sm text-gray-600">Выручка</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-center text-gray-500 mt-4">Показаны топ-5. Нажмите для полного списка</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-yellow-700 flex items-center gap-2">
                <Crown className="w-6 h-6" />
                Полный рейтинг менеджеров
              </DialogTitle>
              <DialogDescription>
                Топ {topManagers.length} менеджеров по выручке за период {currentPeriod.startDate} — {currentPeriod.endDate}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              {topManagers.map((manager, index) => (
                <div
                  key={manager.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400' :
                    index === 1 ? 'bg-gradient-to-r from-gray-100 to-slate-100 border-2 border-gray-300' :
                    index === 2 ? 'bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300' :
                    'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{manager.name}</p>
                        <Badge variant={manager.team === 'zet' ? 'default' : 'secondary'}>
                          {manager.team === 'zet' ? 'Зет' : manager.team === 'zet' ? 'Зет' : 'Офис'}
                        </Badge>
                        {index < 3 && (
                          <Award className={`w-5 h-5 ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                            'text-orange-400'
                          }`} />
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-gray-500">Операций</p>
                          <p className="font-semibold text-gray-900">{manager.operations}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Средний чек</p>
                          <p className="font-semibold text-gray-900">${formatUSDT(manager.avgCheck)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Зарплата</p>
                          <p className="font-semibold text-green-700">${formatUSDT(manager.salary)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-3xl font-bold text-gray-900">${formatUSDT(manager.revenue)}</p>
                    <p className="text-sm text-gray-600">Выручка</p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Структура расходов */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Dialog>
            <DialogTrigger asChild>
              <Card className="shadow-lg cursor-pointer hover:shadow-xl transition-all group">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-red-600" />
                      Структура расходов
                    </div>
                    <Eye className="w-5 h-5 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseStructure}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseStructure.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${formatUSDT(value as number)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {expenseStructure.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-semibold">${formatUSDT(item.value)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-4">Нажмите для детализации</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-red-700 flex items-center gap-2">
                  <PieChartIcon className="w-6 h-6" />
                  Детальная структура расходов
                </DialogTitle>
                <DialogDescription>
                  Разбивка всех расходов компании за период {currentPeriod.startDate} — {currentPeriod.endDate}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Общая сумма */}
                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-red-900">Общие расходы:</span>
                    <span className="text-3xl font-bold text-red-700">
                      ${formatUSDT(expenseStructure.reduce((sum, item) => sum + item.value, 0))}
                    </span>
                  </div>
                </div>

                {/* Детализация по категориям */}
                <div className="space-y-3">
                  {expenseStructure.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white border-2 rounded-lg hover:shadow-md transition-shadow"
                      style={{ borderColor: COLORS[index % COLORS.length] + '40' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              {((item.value / expenseStructure.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}% от общих расходов
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                            ${formatUSDT(item.value)}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${(item.value / expenseStructure.reduce((sum, i) => sum + i.value, 0)) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Card className="shadow-lg cursor-pointer hover:shadow-xl transition-all group">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-blue-600" />
                      Средний чек по командам
                    </div>
                    <Eye className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-purple-700">Команда Зета</span>
                        <span className="text-2xl font-bold text-purple-700">
                          ${formatUSDT(zetStats.operationsCount > 0 ? zetStats.totalRevenue / zetStats.operationsCount : 0)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (zetStats.operationsCount > 0 ? (zetStats.totalRevenue / zetStats.operationsCount) / 100 : 0))}%`
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {zetStats.operationsCount} операций
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-blue-700">Команда Зета</span>
                        <span className="text-2xl font-bold text-blue-700">
                          ${formatUSDT(zetStats.operationsCount > 0 ? zetStats.totalRevenue / zetStats.operationsCount : 0)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (zetStats.operationsCount > 0 ? (zetStats.totalRevenue / zetStats.operationsCount) / 100 : 0))}%`
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {zetStats.operationsCount} операций
                      </p>
                    </div>



                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Средний по компании</span>
                        <span className="text-2xl font-bold text-gray-900">
                          ${formatUSDT(periodOperations.length > 0 ? companyTotals.totalRevenue / periodOperations.length : 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-4">Нажмите для детализации</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-blue-700 flex items-center gap-2">
                  <BarChart2 className="w-6 h-6" />
                  Детальная статистика по командам
                </DialogTitle>
                <DialogDescription>
                  Сравнение эффективности команд за период {currentPeriod.startDate} — {currentPeriod.endDate}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Команда Зета */}
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Команда Зета
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600">Выручка</p>
                      <p className="text-2xl font-bold text-purple-700">${formatUSDT(zetStats.totalRevenue)}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600">Операций</p>
                      <p className="text-2xl font-bold text-purple-700">{zetStats.operationsCount}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600">Средний чек</p>
                      <p className="text-2xl font-bold text-purple-700">
                        ${formatUSDT(zetStats.operationsCount > 0 ? zetStats.totalRevenue / zetStats.operationsCount : 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600">Менеджеров</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {employees.filter(e => e.team === 'zet' && e.role === 'manager').length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Команда Зета */}
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Команда Зета
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600">Выручка</p>
                      <p className="text-2xl font-bold text-blue-700">${formatUSDT(zetStats.totalRevenue)}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600">Операций</p>
                      <p className="text-2xl font-bold text-blue-700">{zetStats.operationsCount}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600">Средний чек</p>
                      <p className="text-2xl font-bold text-blue-700">
                        ${formatUSDT(zetStats.operationsCount > 0 ? zetStats.totalRevenue / zetStats.operationsCount : 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600">Менеджеров</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {employees.filter(e => e.team === 'zet' && e.role === 'manager').length}
                      </p>
                    </div>
                  </div>
                </div>



                {/* Сравнение */}
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">📊 Сравнение</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Выручка на менеджера (Зет):</span>
                      <span className="font-bold text-purple-700">
                        ${formatUSDT(teamEfficiency[0].revenuePerManager)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Выручка на менеджера (Зет):</span>
                      <span className="font-bold text-blue-700">
                        ${formatUSDT(teamEfficiency[1].revenuePerManager)}
                      </span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-semibold">Общая выручка:</span>
                        <span className="text-2xl font-bold text-green-700">
                          ${formatUSDT(zetStats.totalRevenue + zetStats.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Дополнительная аналитика */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Общая статистика */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <BarChart3 className="w-5 h-5" />
                Общая статистика
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg">
                <p className="text-sm text-gray-600">Всего операций</p>
                <p className="text-2xl font-bold text-indigo-700">{periodOperations.length}</p>
              </div>
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg">
                <p className="text-sm text-gray-600">Растаможки / Добивы</p>
                <p className="text-xl font-bold text-indigo-700">
                  {conversionStats.rastamozhka} / {conversionStats.dobiv}
                </p>
              </div>
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg">
                <p className="text-sm text-gray-600">Прибыль компании</p>
                <p className={`text-2xl font-bold ${companyTotals.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ${formatUSDT(companyTotals.netProfit)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Лучший менеджер */}
          {topManagers.length > 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <Award className="w-5 h-5" />
                  Лучший менеджер
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                    1
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">{topManagers[0].name}</p>
                  <Badge variant={topManagers[0].team === 'zet' ? 'default' : 'secondary'} className="mb-3">
                    {topManagers[0].team === 'zet' ? 'Команда Зета' : 'Команда Зета'}
                  </Badge>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-2 bg-white/80 backdrop-blur-sm rounded">
                      <p className="text-xs text-gray-600">Выручка</p>
                      <p className="text-lg font-bold text-yellow-700">${formatUSDT(topManagers[0].revenue)}</p>
                    </div>
                    <div className="p-2 bg-white/80 backdrop-blur-sm rounded">
                      <p className="text-xs text-gray-600">Операций</p>
                      <p className="text-lg font-bold text-yellow-700">{topManagers[0].operations}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Средние показатели */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700">
                <Target className="w-5 h-5" />
                Средние показатели
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg">
                <p className="text-sm text-gray-600">Средний чек</p>
                <p className="text-2xl font-bold text-teal-700">
                  ${formatUSDT(periodOperations.length > 0 ? companyTotals.totalRevenue / periodOperations.length : 0)}
                </p>
              </div>
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg">
                <p className="text-sm text-gray-600">Выручка на менеджера</p>
                <p className="text-xl font-bold text-teal-700">
                  ${formatUSDT(employees.filter(e => e.role === 'manager' && !e.isSpecial).length > 0
                    ? companyTotals.totalRevenue / employees.filter(e => e.role === 'manager' && !e.isSpecial).length
                    : 0)}
                </p>
              </div>
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg">
                <p className="text-sm text-gray-600">Рентабельность</p>
                <p className={`text-2xl font-bold ${companyTotals.profitMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatUSDT(companyTotals.profitMargin)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Предупреждения и рекомендации */}
        {(zetStats.netProfit < 0 || zetStats.netProfit < 0 || conversionStats.conversionRate < 50) && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-300 opacity-10 rounded-full -mr-20 -mt-20" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                Требуется внимание
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {zetStats.netProfit < 0 && (
                  <div className="p-4 bg-white/80 backdrop-blur-sm rounded-lg border-l-4 border-red-500 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-red-900 text-lg">Команда Зета в убытке</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Убыток: <span className="font-bold text-red-700">${formatUSDT(Math.abs(zetStats.netProfit))}</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          💡 Рекомендация: Пересмотреть структуру расходов или увеличить среднюю выручку с операции
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {zetStats.netProfit < 0 && (
                  <div className="p-4 bg-white/80 backdrop-blur-sm rounded-lg border-l-4 border-red-500 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-red-900 text-lg">Команда Зета в убытке</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Убыток: <span className="font-bold text-red-700">${formatUSDT(Math.abs(zetStats.netProfit))}</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          💡 Рекомендация: Пересмотреть структуру расходов или увеличить среднюю выручку с операции
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {conversionStats.conversionRate < 50 && (
                  <div className="p-4 bg-white/80 backdrop-blur-sm rounded-lg border-l-4 border-amber-500 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Activity className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-amber-900 text-lg">Низкая конверсия в добивы</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Конверсия: <span className="font-bold text-amber-700">{conversionStats.conversionRate.toFixed(0)}%</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          💡 Рекомендация: Усилить работу с клиентами после растаможки. Оптимальный показатель - от 80%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
