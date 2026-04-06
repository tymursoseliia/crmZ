"use client";
import { useState, useMemo, useEffect } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import ExpensesTableView from "./ExpensesTableView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Receipt, TrendingDown, Users, Filter, Search, X, Calendar, Briefcase, Cpu, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import type { Expense, ExpenseType, TeamName } from "@/types/finance";

export default function ExpensesTab() {
  const {
    expenses,
    employees,
    expenseCategories,
    addExpense,
    deleteExpense,
    updateExpense,
    currentPeriod,
    periods,
    isLoaded
  } = useFinance();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: expenseCategories[0]?.id || '',
    sumUsdt: '',
    cashRegister: 'voha' as 'voha' | 'zet' | 'tech' | 'common' | 'office',
    issuedBy: 'Звук',
    recipient: '',
    comment: '',
  });

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterType, setFilterType] = useState<ExpenseType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCashRegister, setFilterCashRegister] = useState<'all' | 'voha' | 'zet' | 'tech' | 'common' | 'office'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("finance_role") === "admin");
  }, []);

  // Функция для определения кассы по расходу
  const getCashRegisterFromExpense = (expense: Expense): 'voha' | 'zet' | 'tech' | 'common' | 'zhigul' | 'klycha' | 'office' | 'unknown' => {
    if (expense.type === 'tech') return 'tech';
    if (expense.type === 'common') return 'common';
    // legacy special employee logic removed
    if (expense.teamId === 'voha') return 'voha';
    if (expense.teamId === 'zet') return 'zet';
    if (expense.teamId === 'office') return 'office';
    return 'unknown';
  };

  // Статистика по текущему периоду
  const stats = useMemo(() => {
    // Фильтруем расходы по текущему периоду
    const periodExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const start = new Date(currentPeriod.startDate);
      const end = new Date(currentPeriod.endDate);
      return expDate >= start && expDate <= end;
    });

    const personal = periodExpenses.filter(exp => exp.type === 'personal');
    const tech = periodExpenses.filter(exp => exp.type === 'tech');
    const fixed = periodExpenses.filter(exp => exp.type === 'fixed');
    const common = periodExpenses.filter(exp => exp.type === 'common');

    return {
      total: periodExpenses.length,
      totalAmount: periodExpenses.reduce((sum, exp) => sum + exp.sumUsdt, 0),
      personalCount: personal.length,
      personalAmount: personal.reduce((sum, exp) => sum + exp.sumUsdt, 0),
      techCount: tech.length,
      techAmount: tech.reduce((sum, exp) => sum + exp.sumUsdt, 0),
      fixedCount: fixed.length,
      fixedAmount: fixed.reduce((sum, exp) => sum + exp.sumUsdt, 0),
      commonCount: common.length,
      commonAmount: common.reduce((sum, exp) => sum + exp.sumUsdt, 0),
    };
  }, [expenses, currentPeriod]);

  // Фильтрация и сортировка расходов
  const filteredAndSortedExpenses = useMemo(() => {
    console.log('[ExpensesTab] Всего расходов в БД:', expenses.length);
    console.log('[ExpensesTab] Текущий период:', currentPeriod.startDate, '-', currentPeriod.endDate);

    const filtered = expenses.filter(exp => {
      // Фильтр по периоду
      const expDate = new Date(exp.date);
      const start = new Date(currentPeriod.startDate);
      const end = new Date(currentPeriod.endDate);

      const inPeriod = expDate >= start && expDate <= end;
      if (!inPeriod) {
        console.log('[ExpensesTab] Расход вне периода:', exp.date, exp.category);
      }

      if (expDate < start || expDate > end) return false;

      if (filterType !== 'all' && exp.type !== filterType) return false;
      if (filterCategory !== 'all' && exp.category !== expenseCategories.find(c => c.id === filterCategory)?.name) return false;

      // Фильтр по кассе
      if (filterCashRegister !== 'all') {
        const expCashRegister = getCashRegisterFromExpense(exp);
        if (expCashRegister !== filterCashRegister) return false;
      }

      // Фильтр по дате
      if (dateFrom && exp.date < dateFrom) return false;
      if (dateTo && exp.date > dateTo) return false;

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const employee = exp.employeeId ? employees.find(e => e.id === exp.employeeId) : null;

        return (
          exp.category.toLowerCase().includes(searchLower) ||
          exp.recipient.toLowerCase().includes(searchLower) ||
          exp.issuedBy.toLowerCase().includes(searchLower) ||
          employee?.name.toLowerCase().includes(searchLower) ||
          exp.comment?.toLowerCase().includes(searchLower) ||
          exp.sumUsdt.toString().includes(searchLower)
        );
      }
      return true;
    });

    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.sumUsdt - b.sumUsdt;
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [expenses, filterType, filterCategory, filterCashRegister, dateFrom, dateTo, searchQuery, employees, expenseCategories, sortBy, sortOrder, currentPeriod]);

  // Пагинация
  const totalPages = Math.ceil(filteredAndSortedExpenses.length / itemsPerPage);
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedExpenses.slice(start, start + itemsPerPage);
  }, [filteredAndSortedExpenses, currentPage, itemsPerPage]);

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterCategory, filterCashRegister, dateFrom, dateTo, searchQuery]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  const handleEdit = (expense: Expense) => {
    // Заполняем форму данными расхода
    setEditingExpense(expense);

    // Определяем cashRegister по типу расхода
    let cashRegister: typeof formData.cashRegister = 'voha';

    if (expense.type === 'tech') {
      cashRegister = 'tech';
    } else if (expense.type === 'common') {
      cashRegister = 'common';
    } else if (expense.teamId) {
      cashRegister = expense.teamId;
    }

    setFormData({
      date: expense.date,
      category: expenseCategories.find(c => c.name === expense.category)?.id || '',
      sumUsdt: expense.sumUsdt.toString(),
      cashRegister,
      issuedBy: expense.issuedBy,
      recipient: expense.recipient,
      comment: expense.comment || '',
    });

    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверка: расход не должен попадать в закрытый период
    const expenseDate = new Date(formData.date);
    const targetPeriod = periods.find(p => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return expenseDate >= start && expenseDate <= end;
    });

    if (targetPeriod?.isClosed) {
      alert(`❌ Период ${formatDate(targetPeriod.startDate)} - ${formatDate(targetPeriod.endDate)} закрыт!\n\nНельзя создавать расходы в закрытом периоде.\nВыберите дату из текущего открытого периода или откройте нужный период.`);
      return;
    }

    if (currentPeriod.isClosed) {
      alert('Период закрыт! Создайте новый период или переключитесь на открытый период для добавления расходов.');
      return;
    }

    if (!formData.sumUsdt || !formData.category) {
      alert('Заполните все обязательные поля');
      return;
    }

    const sumUsdt = parseFloat(formData.sumUsdt);
    if (isNaN(sumUsdt)) {
      alert('Неверный формат суммы');
      return;
    }

    // Определяем тип и команду на основе выбранной кассы
    let type: ExpenseType;
    let teamId: 'voha' | 'zet' | 'office' | undefined;
    let isForSpecialEmployee = false;
    let specialEmployeeId: string | undefined;

    if (formData.cashRegister === 'tech') {
      // Касса техников - технические расходы (25% Воха + 25% Зет + 50% Офис)
      type = 'tech';
      teamId = undefined;
    } else if (formData.cashRegister === 'common') {
      // Общие расходы команд - (50% Воха + 50% Зет)
      type = 'common';
      teamId = undefined;
    } else {
      // Касса команды - персональные расходы
      type = 'personal';
      teamId = formData.cashRegister;
    }

    if (editingExpense) {
      // Режим редактирования
      const updatedExpense: Expense = {
        ...editingExpense,
        date: formData.date,
        category: expenseCategories.find(c => c.id === formData.category)?.name || '',
        sumUsdt,
        type,
        teamId,
        issuedBy: formData.issuedBy,
        recipient: formData.issuedBy, // Получатель = кто выдал
        comment: formData.comment,
      };

      await updateExpense(editingExpense.id, updatedExpense);
      setEditingExpense(null);
    } else {
      // Режим добавления
      const newExpense: Expense = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: formData.date,
        category: expenseCategories.find(c => c.id === formData.category)?.name || '',
        sumUsdt,
        type,
        teamId,
        employeeId: undefined,
        issuedBy: formData.issuedBy,
        recipient: formData.issuedBy, // Получатель = кто выдал
        comment: formData.comment,
      };

      addExpense(newExpense);
    }

    // Сброс формы
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: expenseCategories[0]?.id || '',
      sumUsdt: '',
      cashRegister: 'voha',
      issuedBy: 'Звук',
      recipient: '',
      comment: '',
    });

    setShowForm(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatUSDT = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getExpenseTypeBadge = (type: ExpenseType) => {
    switch (type) {
      case 'personal':
        return <Badge className="bg-blue-500">Персональный</Badge>;
      case 'tech':
        return <Badge className="bg-gray-600">Тех.отдел</Badge>;
      case 'fixed':
        return <Badge className="bg-purple-500">Постоянный</Badge>;
      case 'common':
        return <Badge variant="outline">Общий</Badge>;
    }
  };

  const getExpenseTypeIcon = (type: ExpenseType) => {
    switch (type) {
      case 'personal': return <Users className="w-5 h-5" />;
      case 'tech': return <Cpu className="w-5 h-5" />;
      case 'fixed': return <Lock className="w-5 h-5" />;
      case 'common': return <Briefcase className="w-5 h-5" />;
    }
  };

  const getExpenseTypeColor = (type: ExpenseType) => {
    switch (type) {
      case 'personal': return 'from-blue-500 to-blue-600';
      case 'tech': return 'from-gray-500 to-gray-600';
      case 'fixed': return 'from-purple-500 to-purple-600';
      case 'common': return 'from-orange-500 to-orange-600';
    }
  };

  const getExpenseTypeBorderColor = (type: ExpenseType) => {
    switch (type) {
      case 'personal': return 'border-l-blue-500 hover:border-l-blue-600';
      case 'tech': return 'border-l-gray-500 hover:border-l-gray-600';
      case 'fixed': return 'border-l-purple-500 hover:border-l-purple-600';
      case 'common': return 'border-l-orange-500 hover:border-l-orange-600';
    }
  };

  const getExpenseTypeBgColor = (type: ExpenseType) => {
    switch (type) {
      case 'personal': return 'bg-blue-100';
      case 'tech': return 'bg-gray-100';
      case 'fixed': return 'bg-purple-100';
      case 'common': return 'bg-orange-100';
    }
  };

  const getExpenseTypeTextColor = (type: ExpenseType) => {
    switch (type) {
      case 'personal': return 'text-blue-600';
      case 'tech': return 'text-gray-600';
      case 'fixed': return 'text-purple-600';
      case 'common': return 'text-orange-600';
    }
  };

  // Получаем описание распределения на основе выбранной кассы
  const getCashRegisterDescription = (register: 'voha' | 'zet' | 'tech' | 'common' | 'zhigul' | 'klycha' | 'office') => {
    switch (register) {
      case 'voha':
        return '100% списывается с команды Вохи';
      case 'zet':
        return '100% списывается с команды Зета';
      case 'tech':
        return '25% Воха + 25% Зет + 50% офис';
      case 'common':
        return '50% Воха + 50% Зет';
      case 'zhigul':
        return '⚡ 50% платит Жигуль + 50% компания (25% Воха + 25% Зет)';
      case 'klycha':
        return '⚡ 50% платит Клыча + 50% компания (25% Воха + 25% Зет)';
      case 'office':
        return '100% списывается с офиса';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-red-600" />
              Расходы
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Учет всех расходов компании
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить расход
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Receipt className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">{stats.total}</Badge>
              </div>
              <p className="text-sm opacity-90 mb-1">Всего расходов</p>
              <p className="text-3xl font-bold">${formatUSDT(stats.totalAmount)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">{stats.personalCount}</Badge>
              </div>
              <p className="text-sm opacity-90 mb-1">Персональные</p>
              <p className="text-3xl font-bold">${formatUSDT(stats.personalAmount)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-gray-500 to-gray-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Cpu className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">{stats.techCount}</Badge>
              </div>
              <p className="text-sm opacity-90 mb-1">Технические</p>
              <p className="text-3xl font-bold">${formatUSDT(stats.techAmount)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Lock className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">{stats.fixedCount}</Badge>
              </div>
              <p className="text-sm opacity-90 mb-1">Постоянные</p>
              <p className="text-3xl font-bold">${formatUSDT(stats.fixedAmount)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Фильтры и сортировка */}
        <Card className="shadow-sm mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Фильтры:</span>
              </div>

              {/* Поиск */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Поиск по категории, получателю..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Фильтр по типу */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Все типы</option>
                <option value="personal">Персональные</option>
                <option value="tech">Технические</option>
                <option value="fixed">Постоянные</option>
                <option value="common">Общие</option>
              </select>

              {/* Фильтр по категории */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Все категории</option>
                {expenseCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Фильтр по кассе */}
              <select
                value={filterCashRegister}
                onChange={(e) => setFilterCashRegister(e.target.value as typeof filterCashRegister)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Все кассы</option>
                <option value="voha">Касса Вохи</option>
                <option value="zet">Касса Зета</option>
                <option value="tech">Касса Техников</option>
                <option value="office">Касса Офиса</option>
                <option value="common">Общие расходы команд</option>
              </select>

              {/* Дата фильтрация */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-gray-600">-</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* Сортировка */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Сортировать:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none"
                >
                  <option value="date">По дате</option>
                  <option value="amount">По сумме</option>
                  <option value="category">По категории</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-gray-600"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>

              {(filterType !== 'all' || filterCategory !== 'all' || searchQuery || filterCashRegister !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterType('all');
                    setFilterCategory('all');
                    setSearchQuery('');
                    setFilterCashRegister('all');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-gray-600"
                >
                  <X className="w-4 h-4 mr-1" />
                  Сбросить
                </Button>
              )}
            </div>
          </CardContent>
        </Card>


        <div className="grid grid-cols-12 gap-6">
          {/* Список расходов */}
          <div className={showForm ? "col-span-8" : "col-span-12"}>
            {filteredAndSortedExpenses.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="py-12 text-center text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  {expenses.length > 0 ? (
                    <>
                      <p className="text-lg font-medium text-amber-600">⚠️ Нет расходов за выбранный период</p>
                      <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 inline-block">
                        <p className="text-sm text-gray-700">
                          Всего расходов в базе: <strong className="text-red-600 text-xl">{expenses.length}</strong>
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          📅 Текущий период: <strong>{formatDate(currentPeriod.startDate)}</strong> - <strong>{formatDate(currentPeriod.endDate)}</strong>
                        </p>
                      </div>
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg inline-block">
                        <p className="text-sm font-medium text-amber-800">
                          💡 Расходы находятся в другом периоде
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Переключите период в правом верхнем углу страницы
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium">Расходов пока нет</p>
                      <p className="text-sm mt-2">Нажмите кнопку "Добавить расход" чтобы начать</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  {/* Табличный вид */}
                  <ExpensesTableView
                    expenses={paginatedExpenses}
                    employees={employees}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={(column) => {
                      if (sortBy === column) {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy(column);
                        setSortOrder('desc');
                      }
                    }}
                    onDelete={deleteExpense}
                    onEdit={handleEdit}
                    isPeriodClosed={currentPeriod.isClosed}
                    isAdmin={isAdmin}
                  />

                  {/* Пагинация */}
                  {totalPages > 1 && (
                    <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Показано{' '}
                          <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                          {' '}-{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, filteredAndSortedExpenses.length)}
                          </span>
                          {' '}из{' '}
                          <span className="font-medium">{filteredAndSortedExpenses.length}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>

                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNumber;
                              if (totalPages <= 5) {
                                pageNumber = i + 1;
                              } else if (currentPage <= 3) {
                                pageNumber = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNumber = totalPages - 4 + i;
                              } else {
                                pageNumber = currentPage - 2 + i;
                              }

                              return (
                                <Button
                                  key={pageNumber}
                                  variant={currentPage === pageNumber ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNumber)}
                                  className="h-8 w-8 p-0"
                                >
                                  {pageNumber}
                                </Button>
                              );
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-8"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          {/* Форма добавления (боковая панель) */}
          {showForm && (
            <div className="col-span-4">
              <Card className="shadow-lg sticky top-6 border-t-4 border-t-red-500">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Plus className="w-5 h-5 text-red-600" />
                      {editingExpense ? 'Редактировать расход' : 'Новый расход'}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowForm(false);
                        setEditingExpense(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Выбор кассы - ПЕРВОЕ МЕСТО в форме */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">
                        Выберите кассу *
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        {/* Касса Вохи */}
                        <label
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.cashRegister === 'voha'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="cashRegister"
                            value="voha"
                            checked={formData.cashRegister === 'voha'}
                            onChange={(e) => setFormData({ ...formData, cashRegister: e.target.value as typeof formData.cashRegister })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="font-medium text-gray-900">Касса Вохи</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-0.5">
                              100% списывается с команды Вохи
                            </p>
                          </div>
                        </label>

                        {/* Касса Зета */}
                        <label
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.cashRegister === 'zet'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="cashRegister"
                            value="zet"
                            checked={formData.cashRegister === 'zet'}
                            onChange={(e) => setFormData({ ...formData, cashRegister: e.target.value as typeof formData.cashRegister })}
                            className="w-4 h-4 text-green-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="font-medium text-gray-900">Касса Зета</span>
                            </div>
                            <p className="text-xs text-green-600 mt-0.5">
                              100% списывается с команды Зета
                            </p>
                          </div>
                        </label>

                        {/* Касса Техников */}
                        <label
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.cashRegister === 'tech'
                              ? 'border-gray-500 bg-gray-100'
                              : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="cashRegister"
                            value="tech"
                            checked={formData.cashRegister === 'tech'}
                            onChange={(e) => setFormData({ ...formData, cashRegister: e.target.value as typeof formData.cashRegister })}
                            className="w-4 h-4 text-gray-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Cpu className="w-3 h-3 text-gray-600" />
                              <span className="font-medium text-gray-900">Касса Техников</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              25% Воха + 25% Зет + 50% офис
                            </p>
                          </div>
                        </label>

                        {/* Касса Офиса */}
                        <label
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.cashRegister === 'office'
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="cashRegister"
                            value="office"
                            checked={formData.cashRegister === 'office'}
                            onChange={(e) => setFormData({ ...formData, cashRegister: e.target.value as typeof formData.cashRegister })}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-3 h-3 text-indigo-600" />
                              <span className="font-medium text-gray-900">Касса Офиса</span>
                            </div>
                            <p className="text-xs text-indigo-600 mt-0.5">
                              100% списывается с офиса (не влияет на прибыль команд)
                            </p>
                          </div>
                        </label>

                        {/* Общие расходы команд */}
                        <label
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.cashRegister === 'common'
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="cashRegister"
                            value="common"
                            checked={formData.cashRegister === 'common'}
                            onChange={(e) => setFormData({ ...formData, cashRegister: e.target.value as typeof formData.cashRegister })}
                            className="w-4 h-4 text-orange-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-3 h-3 text-orange-600" />
                              <span className="font-medium text-gray-900">Общие расходы команд</span>
                            </div>
                            <p className="text-xs text-orange-600 mt-0.5">
                              50% Воха + 50% Зет (аренда, безопасность)
                            </p>
                          </div>
                        </label>

                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="date" className="text-xs">Дата *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        min={currentPeriod.startDate}
                        max={currentPeriod.endDate}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        📅 Текущий период: {formatDate(currentPeriod.startDate)} - {formatDate(currentPeriod.endDate)}
                        {currentPeriod.isClosed && <span className="text-red-600 ml-1">🔒 Закрыт</span>}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-xs">Категория *</Label>
                      <select
                        id="category"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        {expenseCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="sumUsdt" className="text-xs">Сумма USDT *</Label>
                      <Input
                        id="sumUsdt"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.sumUsdt}
                        onChange={(e) => setFormData({ ...formData, sumUsdt: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="issuedBy" className="text-xs">Кто выдал *</Label>
                      <Input
                        id="issuedBy"
                        type="text"
                        value={formData.issuedBy}
                        onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="comment" className="text-xs">
                        Комментарий <span className="text-gray-400">(укажите менеджера)</span>
                      </Label>
                      <Input
                        id="comment"
                        type="text"
                        placeholder="Например: Мен. Денис"
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={currentPeriod.isClosed}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {currentPeriod.isClosed ? 'Период закрыт' : editingExpense ? 'Сохранить' : 'Добавить'}
                    </Button>

                    {editingExpense && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingExpense(null);
                          setFormData({
                            date: new Date().toISOString().split('T')[0],
                            category: expenseCategories[0]?.id || '',
                            sumUsdt: '',
                            cashRegister: 'voha',
                            issuedBy: 'Звук',
                            recipient: '',
                            comment: '',
                          });
                        }}
                        className="w-full"
                      >
                        Отмена
                      </Button>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
