"use client";
import { useState, useMemo, useEffect } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import OperationsTableView from "./OperationsTableView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, DollarSign, TrendingUp, Activity, Users, Filter, Search, X, Calendar, Grid, List, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import type { Operation, OperationType, TeamName } from "@/types/finance";
import {
  calculateUsdtAfterCommission,
  calculateManagerEarning,
  calculateCloserEarning
} from "@/lib/financeCalculations";

export default function OperationsTab() {
  const {
    operations,
    employees,
    drops,
    addOperation,
    deleteOperation,
    updateOperation,
    currentPeriod,
    periods,
    isLoaded
  } = useFinance();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sumRub: '',
    dropCommission: '22',
    exchangeRate: '95.50',
    type: 'растаможка' as OperationType,
    managerId: '',
    closerId: '',
    comment: '',
  });

  const [isAdmin, setIsAdmin] = useState(false);

  // Use a proper useEffect to only run client-side to avoid hydration errors
  
  useEffect(() => {
    setIsAdmin(sessionStorage.getItem('finance_role') === 'admin');
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [filterType, setFilterType] = useState<OperationType | 'all'>('all');
  const [filterTeam, setFilterTeam] = useState<TeamName | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'manager'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Статистика по текущему периоду
  const stats = useMemo(() => {
    // Фильтруем операции по текущему периоду
    const periodOperations = operations.filter(op => {
      const opDate = new Date(op.date);
      const start = new Date(currentPeriod.startDate);
      const end = new Date(currentPeriod.endDate);
      return opDate >= start && opDate <= end;
    });

    const rastamozhka = periodOperations.filter(op => op.type === 'растаможка');
    const dobiv = periodOperations.filter(op => op.type === 'добив');

    return {
      total: periodOperations.length,
      rastamozhkaCount: rastamozhka.length,
      dobivCount: dobiv.length,
      totalRevenue: periodOperations.reduce((sum, op) => sum + op.usdtAfterCommission, 0),
      rastamozhkaRevenue: rastamozhka.reduce((sum, op) => sum + op.usdtAfterCommission, 0),
      dobivRevenue: dobiv.reduce((sum, op) => sum + op.usdtAfterCommission, 0),
    };
  }, [operations, currentPeriod]);

  // Фильтрация операций
  const filteredOperations = useMemo(() => {
    console.log('[OperationsTab] Всего операций в БД:', operations.length);
    console.log('[OperationsTab] Текущий период:', currentPeriod.startDate, '-', currentPeriod.endDate);

    return operations.filter(op => {
      // Фильтр по периоду
      const opDate = new Date(op.date);
      const start = new Date(currentPeriod.startDate);
      const end = new Date(currentPeriod.endDate);

      const inPeriod = opDate >= start && opDate <= end;
      if (!inPeriod) {
        console.log('[OperationsTab] Операция вне периода:', op.date, op.managerId);
      }

      if (opDate < start || opDate > end) return false;

      if (filterType !== 'all' && op.type !== filterType) return false;
      if (filterTeam !== 'all' && op.team !== filterTeam) return false;
      if (searchQuery) {
        const manager = employees.find(e => e.id === op.managerId);
        const closer = op.closerId ? employees.find(e => e.id === op.closerId) : null;
        const searchLower = searchQuery.toLowerCase();

        return (
          manager?.name.toLowerCase().includes(searchLower) ||
          closer?.name.toLowerCase().includes(searchLower) ||
          op.comment?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [operations, filterType, filterTeam, searchQuery, employees, currentPeriod]);

  // Сортировка
  const filteredAndSortedOperations = useMemo(() => {
    const sorted = [...filteredOperations];
    sorted.sort((a, b) => {
      if (sortBy === 'date') {
        const aDate = new Date(a.date).getTime();
        const bDate = new Date(b.date).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      if (sortBy === 'amount') {
        return sortOrder === 'asc'
          ? a.usdtAfterCommission - b.usdtAfterCommission
          : b.usdtAfterCommission - a.usdtAfterCommission;
      }
      if (sortBy === 'manager') {
        const aManager = employees.find(e => e.id === a.managerId)?.name || '';
        const bManager = employees.find(e => e.id === b.managerId)?.name || '';
        return sortOrder === 'asc'
          ? aManager.localeCompare(bManager)
          : bManager.localeCompare(aManager);
      }
      return 0;
    });
    return sorted;
  }, [filteredOperations, sortBy, sortOrder, employees]);

  // Пагинация
  const totalPages = Math.ceil(filteredAndSortedOperations.length / itemsPerPage);
  const paginatedOperations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedOperations.slice(start, start + itemsPerPage);
  }, [filteredAndSortedOperations, currentPage, itemsPerPage]);

  // Группировка по датам (оставлено для формы, не используется в табличном виде)
  const groupedOperations = useMemo(() => {
    const groups: { [key: string]: Operation[] } = {};

    filteredOperations.forEach(op => {
      const date = op.date.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(op);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredOperations]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  const managers = employees.filter(emp =>
    emp.role === 'manager'
  );
  const closersAndManagers = employees.filter(emp =>
    emp.role === 'closer' || emp.role === 'manager'
  );

  const handleEdit = (operation: Operation) => {
    // Заполняем форму данными операции
    setEditingOperation(operation);

    setFormData({
      date: operation.date,
      sumRub: operation.sumRub.toString(),
      dropCommission: operation.dropCommission.toString(),
      exchangeRate: operation.exchangeRate.toString(),
      type: operation.type,
      managerId: operation.managerId,
      closerId: operation.closerId || '',
      comment: operation.comment || '',
    });

    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверка: операция не должна попадать в закрытый период
    const operationDate = new Date(formData.date);
    const targetPeriod = periods.find(p => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return operationDate >= start && operationDate <= end;
    });

    if (targetPeriod?.isClosed) {
      alert(`❌ Период ${formatDate(targetPeriod.startDate)} - ${formatDate(targetPeriod.endDate)} закрыт!\n\nНельзя создавать операции в закрытом периоде.\nВыберите дату из текущего открытого периода или откройте нужный период.`);
      return;
    }

    if (currentPeriod.isClosed) {
      alert('Период закрыт! Создайте новый период или переключитесь на открытый период для добавления операций.');
      return;
    }

    if (!formData.sumRub || !formData.managerId || !formData.dropCommission) {
      alert('Заполните все обязательные поля');
      return;
    }

    if (formData.type === 'добив' && !formData.closerId) {
      alert('Для добива нужно выбрать клоузера');
      return;
    }

    const sumRub = parseFloat(formData.sumRub);
    const exchangeRate = parseFloat(formData.exchangeRate);
    const dropCommission = parseFloat(formData.dropCommission);

    if (isNaN(sumRub) || isNaN(exchangeRate) || isNaN(dropCommission)) {
      alert('Неверный формат чисел');
      return;
    }

    if (dropCommission < 0 || dropCommission > 100) {
      alert('% комиссии дропа должен быть от 0 до 100');
      return;
    }

    const manager = employees.find(e => e.id === formData.managerId);
    if (!manager) return;

    const usdtAfterCommission = calculateUsdtAfterCommission(
      sumRub,
      dropCommission,
      exchangeRate
    );

    const managerEarning = calculateManagerEarning(
      usdtAfterCommission,
      manager,
      formData.type
    );

    let closerEarning = 0;
    if (formData.type === 'добив' && formData.closerId) {
      const closer = employees.find(e => e.id === formData.closerId);
      if (closer) {
        closerEarning = calculateCloserEarning(usdtAfterCommission, closer);
      }
    }

    if (editingOperation) {
      // Режим редактирования
      const updatedOperation: Operation = {
        ...editingOperation,
        date: formData.date,
        sumRub,
        dropCommission,
        exchangeRate,
        type: formData.type,
        managerId: formData.managerId,
        closerId: formData.type === 'добив' ? formData.closerId : undefined,
        comment: formData.comment,
        usdtAfterCommission,
        managerEarning,
        closerEarning: formData.type === 'добив' ? closerEarning : undefined,
        team: manager.id === 'zhigul' ? 'zhigul' as TeamName :
              manager.id === 'klycha' ? 'klycha' as TeamName :
              manager.team || 'office',
      };

      await updateOperation(editingOperation.id, updatedOperation);
      setEditingOperation(null);
    } else {
      // Режим добавления
      const newOperation: Operation = {
        id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: formData.date,
        sumRub,
        dropId: 'manual', // Больше не используем дропы из списка
        dropCommission,
        exchangeRate,
        type: formData.type,
        managerId: formData.managerId,
        closerId: formData.type === 'добив' ? formData.closerId : undefined,
        comment: formData.comment,
        usdtAfterCommission,
        managerEarning,
        closerEarning: formData.type === 'добив' ? closerEarning : undefined,
        team: manager.id === 'zhigul' ? 'zhigul' as TeamName :
              manager.id === 'klycha' ? 'klycha' as TeamName :
              manager.team || 'office',
      };

      addOperation(newOperation);
    }

    // Сброс формы
    setFormData({
      date: new Date().toISOString().split('T')[0],
      sumRub: '',
      dropCommission: '22',
      exchangeRate: '95.50',
      type: 'растаможка',
      managerId: '',
      closerId: '',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              Операции (Доходы)
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Учет растаможек и добивов
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить операцию
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">{stats.total}</Badge>
              </div>
              <p className="text-sm opacity-90 mb-1">Всего операций</p>
              <p className="text-3xl font-bold">${formatUSDT(stats.totalRevenue)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">{stats.rastamozhkaCount}</Badge>
              </div>
              <p className="text-sm opacity-90 mb-1">Растаможка</p>
              <p className="text-3xl font-bold">${formatUSDT(stats.rastamozhkaRevenue)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">{stats.dobivCount}</Badge>
              </div>
              <p className="text-sm opacity-90 mb-1">Добив</p>
              <p className="text-3xl font-bold">${formatUSDT(stats.dobivRevenue)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">
                  {new Set(operations.map(op => op.managerId)).size}
                </Badge>
              </div>
              <p className="text-sm opacity-90 mb-1">Активных менеджеров</p>
              <p className="text-3xl font-bold">
                {formatUSDT(stats.totalRevenue / (operations.length || 1))}
              </p>
              <p className="text-xs opacity-75">средний чек</p>
            </CardContent>
          </Card>
        </div>

        {/* Фильтры */}
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
                  placeholder="Поиск по менеджеру, клоузеру..."
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все типы</option>
                <option value="растаможка">Растаможка</option>
                <option value="добив">Добив</option>
              </select>

              {/* Фильтр по команде */}
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value as typeof filterTeam)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все команды</option>
                <option value="voha">Команда Вохи</option>
                <option value="zet">Команда Зета</option>
                <option value="zhigul">Жигуль</option>
                <option value="klycha">Клыча</option>
              </select>

              {(filterType !== 'all' || filterTeam !== 'all' || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterType('all');
                    setFilterTeam('all');
                    setSearchQuery('');
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
          {/* Список операций */}
          <div className={showForm ? "col-span-8" : "col-span-12"}>
            {filteredAndSortedOperations.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="py-12 text-center text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  {operations.length > 0 ? (
                    <>
                      <p className="text-lg font-medium text-amber-600">⚠️ Нет операций за выбранный период</p>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 inline-block">
                        <p className="text-sm text-gray-700">
                          Всего операций в базе: <strong className="text-blue-600 text-xl">{operations.length}</strong>
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          📅 Текущий период: <strong>{formatDate(currentPeriod.startDate)}</strong> - <strong>{formatDate(currentPeriod.endDate)}</strong>
                        </p>
                      </div>
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg inline-block">
                        <p className="text-sm font-medium text-amber-800">
                          💡 Операции находятся в другом периоде
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Переключите период в правом верхнем углу страницы
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium">Операций пока нет</p>
                      <p className="text-sm mt-2">Нажмите кнопку "Добавить операцию" чтобы начать</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  {/* Табличный вид */}
                  <OperationsTableView
                    operations={paginatedOperations}
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
                    onDelete={deleteOperation}
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
                            {Math.min(currentPage * itemsPerPage, filteredAndSortedOperations.length)}
                          </span>
                          {' '}из{' '}
                          <span className="font-medium">{filteredAndSortedOperations.length}</span>
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
              <Card className="shadow-lg sticky top-6 border-t-4 border-t-blue-500">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Plus className="w-5 h-5 text-blue-600" />
                      {editingOperation ? 'Редактировать операцию' : 'Новая операция'}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowForm(false);
                        setEditingOperation(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                      <Label htmlFor="type" className="text-xs">Тип операции *</Label>
                      <select
                        id="type"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as OperationType })}
                        required
                      >
                        <option value="растаможка">Растаможка</option>
                        <option value="добив">Добив</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="sumRub" className="text-xs">Сумма RUB *</Label>
                      <Input
                        id="sumRub"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.sumRub}
                        onChange={(e) => setFormData({ ...formData, sumRub: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="exchangeRate" className="text-xs">Курс *</Label>
                        <Input
                          id="exchangeRate"
                          type="number"
                          step="0.01"
                          placeholder="95.50"
                          value={formData.exchangeRate}
                          onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="dropCommission" className="text-xs">Комиссия % *</Label>
                        <Input
                          id="dropCommission"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="22"
                          value={formData.dropCommission}
                          onChange={(e) => setFormData({ ...formData, dropCommission: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="managerId" className="text-xs">Менеджер *</Label>
                      <select
                        id="managerId"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.managerId}
                        onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                        required
                      >
                        <option value="">Выберите</option>
                        {managers.map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name} ({manager.team === 'voha' ? 'Воха' : manager.team === 'zet' ? 'Зет' : 'Офис'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.type === 'добив' && (
                      <div>
                        <Label htmlFor="closerId" className="text-xs">Кто добил *</Label>
                        <select
                          id="closerId"
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.closerId}
                          onChange={(e) => setFormData({ ...formData, closerId: e.target.value })}
                          required={formData.type === 'добив'}
                        >
                          <option value="">Выберите</option>
                          <optgroup label="Клоузеры">
                            {closersAndManagers.filter(e => e.role === 'closer').map(closer => (
                              <option key={closer.id} value={closer.id}>
                                {closer.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Менеджеры">
                            {closersAndManagers.filter(e => e.role === 'manager').map(manager => (
                              <option key={manager.id} value={manager.id}>
                                {manager.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="comment" className="text-xs">Комментарий</Label>
                      <Input
                        id="comment"
                        type="text"
                        placeholder="Необязательно"
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={currentPeriod.isClosed}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {currentPeriod.isClosed ? 'Период закрыт' : editingOperation ? 'Сохранить' : 'Добавить'}
                    </Button>

                    {editingOperation && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingOperation(null);
                          setFormData({
                            date: new Date().toISOString().split('T')[0],
                            sumRub: '',
                            dropCommission: '22',
                            exchangeRate: '95.50',
                            type: 'растаможка',
                            managerId: '',
                            closerId: '',
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
