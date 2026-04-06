import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PeriodSelector from "@/components/finance/PeriodSelector";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Activity,
  Layers,
  BarChart3,
  Check,
  AlertCircle,
  Eye
} from "lucide-react";
import {
  calculateTeamStats,
  calculateOfficeStats,
  calculateCompanyTotals,
  filterOperationsByPeriod,
  filterExpensesByPeriod
} from "@/lib/financeCalculations";
import { initialSettings } from "@/lib/financeData";
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function FinanceDashboard() {
  const { operations, expenses, employees, currentPeriod, isLoaded, useSupabase } = useFinance();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  // Фильтруем данные по текущему периоду
  const periodOperations = filterOperationsByPeriod(
    operations,
    currentPeriod.startDate,
    currentPeriod.endDate
  );

  const periodExpenses = filterExpensesByPeriod(
    expenses,
    currentPeriod.startDate,
    currentPeriod.endDate
  );

  // Рассчитываем статистику команд
  const zetStats = calculateTeamStats(
    'zet',
    periodOperations,
    periodExpenses,
    employees,
    initialSettings,
    currentPeriod.id,
    currentPeriod.calculation_version || 'v1'
  );

  const officeStats = calculateOfficeStats(
    periodOperations,
    periodExpenses,
    employees,
    initialSettings,
    currentPeriod.id,
    currentPeriod
  );

  const companyTotals = calculateCompanyTotals(
    zetStats,
    officeStats,
    employees,
    periodOperations,
    periodExpenses,
    initialSettings,
    currentPeriod.calculation_version || 'v1'
  );

  const formatUSDT = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Данные для графиков
  const revenueData = [];
  revenueData.push({ name: 'Команда Зета', value: zetStats.totalRevenue });
  revenueData.push({ name: 'Офис', value: officeStats.totalOfficeRevenue });

  const expensesData = [];
  expensesData.push({ name: 'Команда Зета', value: zetStats.totalExpenses });

  // Динамика команд по дням
  const dailyData: { [key: string]: { date: string; zet: number; } } = {};

  periodOperations.forEach(op => {
    const date = op.date.split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = { date, zet: 0 };
    }

    if (op.team === 'zet') {
      dailyData[date].zet += op.usdtAfterCommission;
    }
  });

  const teamDailyDynamics = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

  const COLORS = ['#3B82F6', '#10B981'];

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      {/* Индикатор подключения */}
      <Card className={`${useSupabase ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50'} shadow-sm hover:shadow-md transition-shadow`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${useSupabase ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'} shadow-lg`} />
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                {useSupabase ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Supabase БД подключена
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    Используется localStorage
                  </>
                )}
              </p>
              <p className="text-xs text-gray-600">
                {useSupabase
                  ? 'Все данные синхронизируются с облачной базой данных'
                  : 'Данные хранятся только в браузере. Настройте Supabase для облачного хранения'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Финансовый Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Полная аналитика Команды Зета</p>
        </div>
        <PeriodSelector />
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Dialog>
          <DialogTrigger asChild>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative cursor-pointer group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">
                  Общая выручка
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  ${formatUSDT(companyTotals.effectiveRevenue)}
                </div>
                <div className="flex items-center gap-1 text-blue-100 text-sm">
                  <Activity className="w-4 h-4" />
                  <span>{periodOperations.length} операций • Нажмите для детализации</span>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue-700">
                Детальная разбивка выручки
              </DialogTitle>
              <DialogDescription>
                Все операции за период {currentPeriod.startDate} — {currentPeriod.endDate}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Общая информация */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Общая выручка компании</p>
                  <p className="text-2xl font-bold text-blue-700">${formatUSDT(companyTotals.totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Компенсация Бубона</p>
                  <p className="text-2xl font-bold text-amber-600">${formatUSDT(companyTotals.bubonCompensation)}</p>
                  <p className="text-xs text-amber-600">50% тех. расходов</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Эффективная выручка</p>
                  <p className="text-2xl font-bold text-green-700">${formatUSDT(companyTotals.effectiveRevenue)}</p>
                </div>
              </div>

              {/* Разбивка по командам */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Команда Зета */}
                <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50 cursor-pointer hover:bg-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 rounded-full bg-blue-600" />
                    <h3 className="font-semibold text-lg text-blue-900">Команда Зета</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Операций:</span>
                      <span className="font-semibold">{zetStats.operationsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Выручка:</span>
                      <span className="text-xl font-bold text-blue-700">${formatUSDT(zetStats.totalRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* Офис */}
                <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50 md:col-span-1 border-opacity-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 rounded-full bg-green-600" />
                    <h3 className="font-semibold text-lg text-green-900">Офис</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Выручка:</span>
                      <span className="text-xl font-bold text-green-700">${formatUSDT(officeStats.totalOfficeRevenue)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Итоговая сумма */}
              <div className="p-4 bg-blue-100 rounded-lg border-2 border-blue-500">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-blue-900">ИТОГО ВЫРУЧКА:</span>
                  <span className="text-3xl font-bold text-blue-700">
                    ${formatUSDT(companyTotals.totalRevenue)} USDT
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {periodOperations.length} операций
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative cursor-pointer group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">
                  Прямые расходы
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  ${formatUSDT(companyTotals.directExpensesOnly)}
                </div>
                <div className="flex items-center gap-1 text-purple-100 text-sm">
                  <Layers className="w-4 h-4" />
                  <span>{periodExpenses.length} расходов • Нажмите для детализации</span>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-purple-700">
                Детальная разбивка расходов
              </DialogTitle>
              <DialogDescription>
                Все расходы за период {currentPeriod.startDate} — {currentPeriod.endDate}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Общая информация */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Общая сумма</p>
                  <p className="text-2xl font-bold text-purple-700">${formatUSDT(companyTotals.directExpensesOnly)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Всего записей</p>
                  <p className="text-2xl font-bold text-purple-700">{periodExpenses.length}</p>
                </div>
              </div>

              {/* Список всех расходов */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Все расходы ({periodExpenses.length})</h3>
                <div className="space-y-2">
                  {periodExpenses
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((expense, index) => (
                      <div
                        key={expense.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-700">
                                {index + 1}. {expense.category}
                              </span>
                              <Badge variant={
                                expense.type === 'personal' ? 'default' :
                                expense.type === 'tech' ? 'secondary' :
                                expense.type === 'fixed' ? 'outline' : 'destructive'
                              }>
                                {expense.type === 'personal' ? 'Персональный' :
                                 expense.type === 'tech' ? 'Технический' :
                                 expense.type === 'fixed' ? 'Постоянный' : 'Общий'}
                              </Badge>
                              {expense.teamId && (
                                <Badge variant="outline">
                                  {expense.teamId === 'zet' ? 'Зет' : 'Офис'}
                                </Badge>
                              )}
                            </div>

                            <div className="text-sm text-muted-foreground">
                              📅 {new Date(expense.date).toLocaleDateString('ru-RU')}
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-purple-700">
                              ${expense.sumUsdt.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">USDT</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Итоговая сумма */}
              <div className="p-4 bg-purple-100 rounded-lg border-2 border-purple-500">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-purple-900">ИТОГО:</span>
                  <span className="text-3xl font-bold text-purple-700">
                    ${formatUSDT(companyTotals.directExpensesOnly)} USDT
                  </span>
                </div>
                <p className="text-sm text-purple-700 mt-1">
                  Сумма {periodExpenses.length} расходов
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100">
              Чистая прибыль
            </CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              ${formatUSDT(companyTotals.netProfit)}
            </div>
            <div className="flex items-center gap-1 text-emerald-100 text-sm">
              {companyTotals.profitMargin >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{formatUSDT(companyTotals.profitMargin)}% маржа</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">
              Всего ЗП
            </CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              ${formatUSDT(companyTotals.totalSalaries)}
            </div>
            <div className="flex items-center gap-1 text-orange-100 text-sm">
              <Users className="w-4 h-4" />
              <span>{employees.length} сотрудников</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График динамики команд по дням */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Динамика выручки команды Зета по дням
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamDailyDynamics.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={teamDailyDynamics} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorZet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(date) => formatDate(date)}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        padding: '12px'
                      }}
                      itemStyle={{
                        fontSize: '14px',
                        fontWeight: 600,
                        padding: '4px 0'
                      }}
                      formatter={(value) => [`${formatUSDT(value as number)}`, '']}
                      labelFormatter={(date) => formatDate(date)}
                      labelStyle={{
                        color: '#111827',
                        fontWeight: 700,
                        marginBottom: '8px',
                        fontSize: '13px'
                      }}
                      separator=": "
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                      iconType="circle"
                    />
                    <Line
                      type="monotone"
                      dataKey="zet"
                      stroke="#3B82F6"
                      strokeWidth={4}
                      dot={{
                        fill: '#3B82F6',
                        r: 6,
                        strokeWidth: 3,
                        stroke: '#fff',
                        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.4))'
                      }}
                      activeDot={{
                        r: 8,
                        fill: '#3B82F6',
                        stroke: '#fff',
                        strokeWidth: 3,
                        filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.6))'
                      }}
                      name="Команда Зета"
                      fill="url(#colorZet)"
                      animationDuration={1500}
                      animationBegin={200}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-6 flex text-sm items-center justify-center">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-4 h-4 rounded-full bg-blue-600 shadow-lg" />
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Команда Зета</p>
                      <p className="text-lg font-bold text-blue-900">${formatUSDT(zetStats.totalRevenue)}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Нет данных о выручке
              </div>
            )}
          </CardContent>
        </Card>

        {/* Круговая диаграмма выручки */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Распределение выручки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `$${formatUSDT(value as number)}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Детальная статистика команд */}
      <div className={`flex justify-center`}>
        {/* Команда Зета */}
        <div className="w-full max-w-4xl">
          <Dialog>
            <DialogTrigger asChild>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="text-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-500 text-white rounded-lg">
                        <Users className="w-5 h-5" />
                      </div>
                      Команда Зета
                    </div>
                    <Eye className="w-5 h-5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Выручка</p>
                      <p className="text-2xl font-bold text-purple-600">${formatUSDT(zetStats.totalRevenue)}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Расходы (вкл. IT)</p>
                      <p className="text-2xl font-bold text-red-600">${formatUSDT(zetStats.totalExpenses)}</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${zetStats.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <p className="text-sm text-gray-600 mb-1">Чистая прибыль</p>
                    <p className={`text-3xl font-bold ${zetStats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${formatUSDT(zetStats.netProfit)}
                    </p>
                  </div>
                  <p className="text-xs text-center text-gray-500">Нажмите для детализации</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-purple-700">
                  Детальный расчет прибыли команды Зета
                </DialogTitle>
                <DialogDescription>
                  Полная разбивка за период {currentPeriod.startDate} — {currentPeriod.endDate}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Выручка */}
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-2">💰 Выручка</h3>
                  <div className="flex justify-between items-center">
                    <span>Операций: {zetStats.operationsCount}</span>
                    <span className="text-2xl font-bold text-purple-700">${formatUSDT(zetStats.totalRevenue)}</span>
                  </div>
                </div>

                {/* Расходы детально */}
                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <h3 className="font-semibold text-red-900 mb-3">📊 Расходы (детализация)</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-white rounded">
                      <span className="text-gray-700">Персональные расходы команды:</span>
                      <span className="font-semibold">${formatUSDT(zetStats.personalExpenses)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded">
                      <span className="text-gray-700">Фиксированные расходы (вкл. IT $3000):</span>
                      <span className="font-semibold">${formatUSDT(zetStats.fixedExpenses)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded">
                      <span className="text-gray-700">Прочие (Тех/Общие):</span>
                      <span className="font-semibold">${formatUSDT(zetStats.commonExpenses + zetStats.techExpenses)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded">
                      <span className="text-gray-700">Зарплаты и клоузеры:</span>
                      <span className="font-semibold">${formatUSDT(zetStats.teamSalaries + zetStats.closersExpenses)}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t-2 border-red-300 flex justify-between">
                      <span className="font-bold text-red-900">ИТОГО РАСХОДОВ:</span>
                      <span className="text-2xl font-bold text-red-700">${formatUSDT(zetStats.totalExpenses)}</span>
                    </div>
                  </div>
                </div>

                {/* Чистая прибыль */}
                <div className={`p-4 rounded-lg border-2 ${zetStats.netProfit >= 0 ? 'bg-emerald-100 border-emerald-500' : 'bg-red-100 border-red-500'}`}>
                  <h3 className={`font-semibold mb-2 ${zetStats.netProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                    {zetStats.netProfit >= 0 ? '✅ Чистая прибыль' : '⚠️ Убыток'}
                  </h3>
                  <div className={`text-sm mb-2 ${zetStats.netProfit >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                    ${formatUSDT(zetStats.totalRevenue)} (выручка) - ${formatUSDT(zetStats.totalExpenses)} (расходы) =
                  </div>
                  <div className="text-center">
                    <span className={`text-4xl font-bold ${zetStats.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      ${formatUSDT(zetStats.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
