"use client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, RefreshCw, Download, X, Check, Plus, Calendar as CalendarIcon, ChevronDown, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useFinance } from "@/contexts/FinanceContext";

interface DailyLeads {
  managerId: string;
  managerName: string;
  date: string;
  newLeads: number;
  teamId?: string;
}

interface TelegramPeriod {
  id: string;
  period_number: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_closed: boolean;
}

export default function TelegramAnalyticsTab() {
  const { employees = [], isLoaded: employeesLoaded = false } = useFinance();

  const [isLoaded, setIsLoaded] = useState(false);
  const [historyData, setHistoryData] = useState<Record<string, DailyLeads[]>>({});
  const [editingCell, setEditingCell] = useState<{ managerId: string; date: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Периоды
  const [periods, setPeriods] = useState<TelegramPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<TelegramPeriod | null>(null);
  const [isCreatingPeriod, setIsCreatingPeriod] = useState(false);

  // Выбранная команда (только Зета)
  const [selectedTeam] = useState<'zet'>('zet');

  const today = new Date().toISOString().split('T')[0];

  // Даты берем из текущего периода
  const dateFrom = currentPeriod?.start_date || '2026-01-26';
  const dateTo = currentPeriod?.end_date || '2026-02-08';

  // Менеджеры выбранной команды
  const selectedManagers = Array.isArray(employees)
    ? employees.filter(emp => emp?.team === selectedTeam && emp?.role === 'manager')
    : [];

  useEffect(() => {
    if (employeesLoaded) {
      loadPeriods();
    }
  }, [employeesLoaded]);

  useEffect(() => {
    if (currentPeriod) {
      loadHistory();
      setIsLoaded(true);
    }
  }, [currentPeriod, selectedTeam]);

  // Real-time синхронизация периодов
  useEffect(() => {
    if (!supabase) return;

    // Подписка на изменения в таблице telegram_periods
    const channel = supabase
      .channel('telegram-periods-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Слушаем все события (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'telegram_periods'
        },
        (payload) => {
          console.log('[Telegram] Real-time update:', payload);

          // Обновляем список периодов
          if (payload.eventType === 'UPDATE') {
            const updatedPeriod = payload.new as TelegramPeriod;
            const oldPeriod = payload.old as TelegramPeriod;

            // Обновляем список периодов
            setPeriods(prev => prev.map(p =>
              p.id === updatedPeriod.id ? updatedPeriod : p
            ));

            // Если обновлён текущий период - обновляем его
            if (currentPeriod?.id === updatedPeriod.id) {
              setCurrentPeriod(updatedPeriod);

              // Показываем уведомление если период был закрыт другим пользователем
              if (!oldPeriod.is_closed && updatedPeriod.is_closed) {
                alert('🔒 Период был закрыт другим пользователем.\n\nРедактирование больше невозможно.');
              }
            }
          } else if (payload.eventType === 'INSERT') {
            const newPeriod = payload.new as TelegramPeriod;
            setPeriods(prev => [newPeriod, ...prev]);

            // Уведомление о новом периоде (только если он текущий и создан не этим пользователем)
            if (newPeriod.is_current) {
              console.log('[Telegram] Новый период создан:', newPeriod);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setPeriods(prev => prev.filter(p => p.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Очистка подписки при размонтировании
    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, currentPeriod]);

  const loadPeriods = async () => {
    try {
      if (!supabase) {
        alert('❌ Supabase не подключен! Проверьте настройки базы данных.');
        return;
      }

      const { data, error } = await supabase
        .from('telegram_periods')
        .select('*')
        .order('period_number', { ascending: false });

      if (error) {
        console.error('[Telegram] Ошибка загрузки периодов:', error);
        return;
      }

      if (data && data.length > 0) {
        setPeriods(data);
        const current = data.find(p => p.is_current) || data[0];
        setCurrentPeriod(current);
      } else {
        // Создаем первый период если его нет
        await createFirstPeriod();
      }
    } catch (error) {
      console.error('[Telegram] Ошибка:', error);
    }
  };

  const createFirstPeriod = async () => {
    const firstPeriod: TelegramPeriod = {
      id: 'tg-period-2026-01-26',
      period_number: 1,
      start_date: '2026-01-26',
      end_date: '2026-02-08',
      is_current: true,
      is_closed: false
    };

    if (supabase) {
      try {
        await supabase.from('telegram_periods').insert([firstPeriod]);
      } catch (error) {
        console.error('[Telegram] Ошибка создания первого периода:', error);
      }
    }

    setCurrentPeriod(firstPeriod);
    setPeriods([firstPeriod]);
    localStorage.setItem('telegram_current_period', JSON.stringify(firstPeriod));
  };

  const createNewPeriod = async () => {
    if (isCreatingPeriod) return;
    if (!currentPeriod) return;

    setIsCreatingPeriod(true);

    try {
      // Вычисляем даты нового периода (следующие 2 недели)
      const lastEndDate = new Date(currentPeriod.end_date);
      const newStartDate = new Date(lastEndDate);
      newStartDate.setDate(newStartDate.getDate() + 1);

      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + 6); // +6 дней = 7 дней (неделя)

      const newPeriod: TelegramPeriod = {
        id: `tg-period-${newStartDate.toISOString().split('T')[0]}`,
        period_number: currentPeriod.period_number + 1,
        start_date: newStartDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
        is_current: true,
        is_closed: false
      };

      if (supabase) {
        // Снимаем флаг is_current с текущего периода
        await supabase
          .from('telegram_periods')
          .update({ is_current: false })
          .eq('id', currentPeriod.id);

        // Создаем новый период
        await supabase.from('telegram_periods').insert([newPeriod]);
      }

      // Обновляем локальное состояние
      setPeriods(prev => [newPeriod, ...prev.map(p => ({ ...p, is_current: false }))]);
      setCurrentPeriod(newPeriod);
      localStorage.setItem('telegram_current_period', JSON.stringify(newPeriod));

      alert(`✅ Создан новый период!\n\nПериод ${newPeriod.period_number}: ${formatDate(newPeriod.start_date)} - ${formatDate(newPeriod.end_date)}`);
    } catch (error) {
      console.error('[Telegram] Ошибка создания периода:', error);
      alert('❌ Ошибка создания нового периода');
    } finally {
      setIsCreatingPeriod(false);
    }
  };

  const switchPeriod = async (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (!period) return;

    if (supabase) {
      // Обновляем флаг is_current в БД
      await supabase
        .from('telegram_periods')
        .update({ is_current: false })
        .neq('id', periodId);

      await supabase
        .from('telegram_periods')
        .update({ is_current: true })
        .eq('id', periodId);
    }

    setCurrentPeriod(period);
    localStorage.setItem('telegram_current_period', JSON.stringify(period));
  };

  const closePeriod = async () => {
    if (!currentPeriod) return;
    if (currentPeriod.is_closed) {
      alert('⚠️ Период уже закрыт');
      return;
    }

    if (!confirm(`Закрыть период "${formatDate(currentPeriod.start_date)} - ${formatDate(currentPeriod.end_date)}"?\n\n⚠️ После закрытия редактирование будет НЕВОЗМОЖНО!`)) {
      return;
    }

    try {
      if (supabase) {
        // Закрываем период в БД
        await supabase
          .from('telegram_periods')
          .update({ is_closed: true })
          .eq('id', currentPeriod.id);
      }

      // Обновляем локальное состояние
      const updatedPeriod = { ...currentPeriod, is_closed: true };
      setCurrentPeriod(updatedPeriod);
      setPeriods(prev => prev.map(p => p.id === currentPeriod.id ? updatedPeriod : p));

      alert(`✅ Период закрыт!\n\nРедактирование данных больше невозможно.`);
    } catch (error) {
      console.error('[Telegram] Ошибка закрытия периода:', error);
      alert('❌ Ошибка закрытия периода');
    }
  };

  const loadHistory = async () => {
    if (typeof window === 'undefined') return;
    if (!currentPeriod) return;

    try {
      if (!supabase) {
        const history: Record<string, DailyLeads[]> = {};

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);

          // Новый формат: telegram_leads_{team}_{date}
          if (key?.startsWith(`telegram_leads_${selectedTeam}_`)) {
            const date = key.replace(`telegram_leads_${selectedTeam}_`, '');
            const saved = localStorage.getItem(key);
            if (saved) {
              history[date] = JSON.parse(saved);
            }
          }
        }

        setHistoryData(history);
        return;
      }

      // Загружаем данные для выбранной команды
      let query = supabase
        .from('telegram_daily_leads')
        .select('*')
        .gte('date', currentPeriod.start_date)
        .lte('date', currentPeriod.end_date)
        .order('date', { ascending: false });

      // Для Зета только с конкретным team_id
      query = query.eq('team_id', selectedTeam);

      const { data, error } = await query;

      if (error) {
        console.error('[Telegram] Ошибка загрузки:', error);
        return;
      }

      if (data) {
        const history: Record<string, DailyLeads[]> = {};
        data.forEach(item => {
          if (!history[item.date]) {
            history[item.date] = [];
          }
          history[item.date].push({
            managerId: item.manager_id,
            managerName: item.manager_name,
            date: item.date,
            newLeads: item.new_leads,
            teamId: item.team_id
          });
        });
        setHistoryData(history);
      }
    } catch (error) {
      console.error('[Telegram] Ошибка:', error);
    }
  };

  const dateRange = useMemo(() => {
    if (!currentPeriod) return [];

    const dates: string[] = [];
    const start = new Date(currentPeriod.start_date);
    const end = new Date(currentPeriod.end_date);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates;
  }, [currentPeriod]);

  const getCellValue = (managerId: string, date: string): number => {
    const dayData = historyData[date] || [];
    const lead = dayData.find(l => l.managerId === managerId);
    return lead?.newLeads || 0;
  };

  const startEdit = (managerId: string, date: string) => {
    const value = getCellValue(managerId, date);
    setEditingCell({ managerId, date });
    setEditValue(value.toString());
  };

  const saveCellEdit = async () => {
    if (!editingCell) return;

    const { managerId, date } = editingCell;
    const newValue = parseInt(editValue) || 0;
    const manager = selectedManagers.find(m => m.id === managerId);

    if (!manager) return;

    setIsSaving(true);

    const dayData = historyData[date] || [];
    const existingIndex = dayData.findIndex(l => l.managerId === managerId);

    let updatedDayData: DailyLeads[];
    if (existingIndex >= 0) {
      updatedDayData = [...dayData];
      updatedDayData[existingIndex] = {
        ...updatedDayData[existingIndex],
        newLeads: newValue,
        teamId: selectedTeam
      };
    } else {
      updatedDayData = [
        ...dayData,
        {
          managerId,
          managerName: manager.name,
          date,
          newLeads: newValue,
          teamId: selectedTeam
        }
      ];
    }

    setHistoryData(prev => ({
      ...prev,
      [date]: updatedDayData
    }));

    // Сохраняем с указанием команды в ключе
    localStorage.setItem(`telegram_leads_${selectedTeam}_${date}`, JSON.stringify(updatedDayData));

    if (supabase) {
      try {
        await supabase
          .from('telegram_daily_leads')
          .delete()
          .eq('date', date)
          .eq('manager_id', managerId)
          .eq('team_id', selectedTeam);

        if (newValue > 0) {
          await supabase
            .from('telegram_daily_leads')
            .insert({
              manager_id: managerId,
              manager_name: manager.name,
              date: date,
              new_leads: newValue,
              team_id: selectedTeam
            });
        }
      } catch (error) {
        console.error('[Telegram] Ошибка сохранения:', error);
      }
    }

    setEditingCell(null);
    setEditValue('');
    setIsSaving(false);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getRowTotal = (managerId: string): number => {
    return dateRange.reduce((sum, date) => sum + getCellValue(managerId, date), 0);
  };

  const getColumnTotal = (date: string): number => {
    return selectedManagers.reduce((sum, manager) => sum + getCellValue(manager.id, date), 0);
  };

  const grandTotal = useMemo(() => {
    return selectedManagers.reduce((sum, manager) => {
      return sum + dateRange.reduce((rowSum, date) => rowSum + getCellValue(manager.id, date), 0);
    }, 0);
  }, [selectedManagers, dateRange, historyData]);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('ru-RU', { month: 'short' });
    const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' });
    const isToday = dateStr === today;

    return { day, month, weekday, isToday };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const exportToCSV = () => {
    if (!currentPeriod) return;

    let csv = 'Менеджер,' + dateRange.join(',') + ',Итого\n';

    selectedManagers.forEach(manager => {
      const row = [
        manager.name,
        ...dateRange.map(date => getCellValue(manager.id, date)),
        getRowTotal(manager.id)
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `telegram_leads_period_${currentPeriod.period_number}.csv`;
    link.click();
  };

  if (!employeesLoaded || !isLoaded || !currentPeriod) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-purple-600" />
                Telegram лиды - Команда Зета
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Табличный учет новых лидов по дням
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={loadHistory}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Обновить
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Экспорт CSV
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* Селектор периода */}
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Период:</span>
              <select
                value={currentPeriod.id}
                onChange={(e) => switchPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white"
              >
                {periods.map(period => (
                  <option key={period.id} value={period.id}>
                    Период {period.period_number}: {formatDate(period.start_date)} - {formatDate(period.end_date)}
                    {period.is_current ? ' (текущий)' : ''}
                    {period.is_closed ? ' [закрыт]' : ''}
                  </option>
                ))}
              </select>

              <Button
                onClick={createNewPeriod}
                disabled={isCreatingPeriod}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
              >
                {isCreatingPeriod ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Создать новый период
                  </>
                )}
              </Button>

              {/* Кнопка закрытия периода */}
              {!currentPeriod.is_closed && (
                <Button
                  onClick={closePeriod}
                  size="sm"
                  variant="outline"
                  className="bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100 hover:border-orange-400 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Закрыть период
                </Button>
              )}

              {/* Индикатор закрытого периода */}
              {currentPeriod.is_closed && (
                <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-300 px-3 py-1 text-sm">
                  <Lock className="w-3 h-3 mr-1" />
                  Период закрыт
                </Badge>
              )}
            </div>



            <div className="ml-auto flex items-center gap-4 text-sm">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                {dateRange.length} дней
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {selectedManagers.length} менеджеров
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {grandTotal} лидов
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b-2 border-gray-200 bg-gray-100 sticky left-0 z-20 min-w-[160px]">
                    Менеджер
                  </th>
                  {dateRange.map(date => {
                    const { day, month, weekday, isToday } = formatDateHeader(date);
                    return (
                      <th
                        key={date}
                        className={`px-3 py-2 text-center text-xs font-semibold border-b-2 border-l border-gray-200 min-w-[80px] ${
                          isToday ? 'bg-purple-100 text-purple-900 border-purple-300' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className={`text-xs ${isToday ? 'text-purple-600' : 'text-gray-500'}`}>
                            {weekday}
                          </span>
                          <span className={`text-lg font-bold ${isToday ? 'text-purple-900' : 'text-gray-900'}`}>
                            {day}
                          </span>
                          <span className={`text-xs ${isToday ? 'text-purple-600' : 'text-gray-500'}`}>
                            {month}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-b-2 border-l-2 border-gray-300 bg-gray-100 sticky right-0 z-20 min-w-[100px]">
                    Итого
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedManagers.map((manager, managerIndex) => (
                  <tr
                    key={manager.id}
                    className={managerIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-200 bg-gray-50 sticky left-0 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {manager.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{manager.name}</span>
                      </div>
                    </td>
                    {dateRange.map(date => {
                      const value = getCellValue(manager.id, date);
                      const isEditing = editingCell?.managerId === manager.id && editingCell?.date === date;
                      const isToday = date === today;

                      return (
                        <td
                          key={date}
                          className={`px-2 py-2 text-center border-b border-l border-gray-200 ${
                            isToday ? 'bg-purple-50' : ''
                          }`}
                          onClick={() => !isEditing && !currentPeriod.is_closed && startEdit(manager.id, date)}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveCellEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                className="h-8 w-16 text-center text-sm"
                                autoFocus
                                disabled={isSaving}
                              />
                              <Button
                                onClick={saveCellEdit}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                disabled={isSaving}
                              >
                                <Check className="w-3 h-3 text-green-600" />
                              </Button>
                              <Button
                                onClick={cancelEdit}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                disabled={isSaving}
                              >
                                <X className="w-3 h-3 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              className={`w-full h-full px-2 py-1 text-sm font-semibold rounded transition-colors ${
                                currentPeriod.is_closed
                                  ? 'cursor-not-allowed opacity-60'
                                  : 'hover:bg-gray-100 cursor-pointer'
                              } ${
                                value > 0
                                  ? 'text-purple-700 bg-purple-100 hover:bg-purple-200'
                                  : 'text-gray-400'
                              }`}
                              title={currentPeriod.is_closed ? 'Период закрыт для редактирования' : 'Нажмите для редактирования'}
                              disabled={currentPeriod.is_closed}
                            >
                              {value > 0 ? value : '—'}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center text-sm font-bold text-purple-700 border-b border-l-2 border-gray-300 bg-purple-50 sticky right-0 z-10">
                      {getRowTotal(manager.id)}
                    </td>
                  </tr>
                ))}

                <tr className="bg-gray-100 font-bold">
                  <td className="px-4 py-3 text-sm text-gray-900 border-t-2 border-gray-300 sticky left-0 z-10 bg-gray-100">
                    Итого
                  </td>
                  {dateRange.map(date => (
                    <td
                      key={date}
                      className="px-3 py-3 text-center text-sm text-gray-900 border-t-2 border-l border-gray-300"
                    >
                      {getColumnTotal(date)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center text-sm text-purple-900 border-t-2 border-l-2 border-gray-300 bg-purple-100 sticky right-0 z-10">
                    {grandTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Как использовать таблицу:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Периоды:</strong> Выберите период из списка или создайте новый (автоматически 2 недели)</li>
                <li>• <strong>Редактирование:</strong> Нажмите на любую ячейку чтобы ввести количество лидов</li>
                <li>• <strong>Сохранение:</strong> Нажмите ✓ или Enter для сохранения, Esc для отмены</li>
                <li>• <strong>Закрытие периода:</strong> Нажмите "Закрыть период" когда работа завершена (редактирование станет невозможным)</li>
                <li>• <strong>Экспорт:</strong> Нажмите "Экспорт CSV" для сохранения данных в Excel</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
