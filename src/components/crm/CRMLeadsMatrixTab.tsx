"use client";
import { useState, useEffect, useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Loader2, Save, Calendar as CalendarIcon, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CRMLeadsMatrixTab() {
  const { employees, isLoaded: financeLoaded, useSupabase } = useFinance();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [periods, setPeriods] = useState<any[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<any | null>(null);
  const [isCreatingPeriod, setIsCreatingPeriod] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Matrix data: managerId -> date -> leads count
  const [matrixData, setMatrixData] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    if (financeLoaded) loadPeriods();
  }, [financeLoaded]);

  const createFirstPeriod = async () => {
    const firstPeriod = {
      id: 'tg-period-2026-01-26',
      period_number: 1,
      start_date: '2026-01-26',
      end_date: '2026-02-08', // Будет заменен при создании нового
      is_current: true,
      is_closed: false
    };
    if (supabase) {
      try { await supabase.from('telegram_periods').insert([firstPeriod]); } catch(e) {}
    }
    setCurrentPeriod(firstPeriod);
    setPeriods([firstPeriod]);
  };

  const loadPeriods = async () => {
    try {
      if (!supabase) { setIsLoaded(true); return; }
      
      const { data, error } = await supabase
        .from('telegram_periods')
        .select('*')
        .order('period_number', { ascending: false });
      if (error) {
        await createFirstPeriod(); // Фолбек
        setIsLoaded(true);
        return;
      }
      
      if (data && data.length > 0) {
        setPeriods(data);
        setCurrentPeriod(data.find(p => p.is_current) || data[0]);
      } else {
        await createFirstPeriod();
      }
    } catch (e) {
      await createFirstPeriod();
    } finally {
      setIsLoaded(true);
    }
  };

  const switchPeriod = async (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (!period) return;
    if (supabase) {
      await supabase.from('telegram_periods').update({ is_current: false }).neq('id', periodId);
      await supabase.from('telegram_periods').update({ is_current: true }).eq('id', periodId);
    }
    setCurrentPeriod(period);
  };

  const createNewPeriod = async () => {
    if (isCreatingPeriod || !currentPeriod || !supabase) return;
    setIsCreatingPeriod(true);
    try {
      const lastEndDate = new Date(currentPeriod.end_date);
      const newStartDate = new Date(lastEndDate);
      newStartDate.setDate(newStartDate.getDate() + 1);
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + 6); // Ровно 1 неделя
      const newPeriod = {
        id: `tg-period-${newStartDate.toISOString().split('T')[0]}`,
        period_number: currentPeriod.period_number + 1,
        start_date: newStartDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
        is_current: true,
        is_closed: false
      };
      await supabase.from('telegram_periods').update({ is_current: false }).eq('id', currentPeriod.id);
      await supabase.from('telegram_periods').insert([newPeriod]);
      setPeriods(prev => [newPeriod, ...prev.map(p => ({...p, is_current: false}))]);
      setCurrentPeriod(newPeriod);
    } finally {
      setIsCreatingPeriod(false);
    }
  };
  
  // Get all dates in current period
  const periodDates = useMemo(() => {
    if (!currentPeriod) return [];
    const dates: string[] = [];
    const start = new Date(currentPeriod.start_date);
    const end = new Date(currentPeriod.end_date);
    
    // limit to reasonable amount if period is too long to display
    const limitEnd = new Date(start);
    limitEnd.setDate(limitEnd.getDate() + 30);
    const actualEnd = end > limitEnd ? limitEnd : end;

    for (let d = new Date(start); d <= actualEnd; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [currentPeriod]);

  // Managers of Zeta team
  const zetaManagers = useMemo(() => {
    return employees.filter(e => e.role === 'manager' && e.team === 'zet' && !e.isSpecial);
  }, [employees]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!useSupabase || !supabase || !currentPeriod) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('daily_activity')
          .select('manager_id, date, leads_contacted')
          .gte('date', currentPeriod.start_date)
          .lte('date', currentPeriod.end_date);
          
        if (error) throw error;
        
        const newMatrixData: Record<string, Record<string, number>> = {};
        
        zetaManagers.forEach(m => {
          newMatrixData[m.id] = {};
          periodDates.forEach(d => {
            newMatrixData[m.id][d] = 0;
          });
        });

        if (data) {
          data.forEach(row => {
            if (newMatrixData[row.manager_id]) {
              newMatrixData[row.manager_id][row.date] = row.leads_contacted || 0;
            }
          });
        }
        
        setMatrixData(newMatrixData);
      } catch (err) {
        console.error('Failed to load matrix data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentPeriod, useSupabase, zetaManagers, periodDates]);

  const handleCellChange = (managerId: string, date: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setMatrixData(prev => ({
      ...prev,
      [managerId]: {
        ...(prev[managerId] || {}),
        [date]: numValue
      }
    }));
  };

  const handleSave = async () => {
    if (!useSupabase || !supabase) {
      alert("Supabase не подключен");
      return;
    }
    
    setSaving(true);
    try {
      const recordsToUpsert: any[] = [];
      
      // We will upset leads_contacted for all matrix cells that we touched
      for (const managerId of Object.keys(matrixData)) {
        for (const date of Object.keys(matrixData[managerId])) {
          const val = matrixData[managerId][date];
          if (val >= 0) {
            // Check if record exists to keep other fields like calls_made etc
            // But since this is a matrix update, we will just use conflict resolution on (manager_id, date) if there's a constraint,
            // Or we just query first if no unique constraint exists.
            // Let's query first to be safe and avoid overwriting other activity fields.
            
            recordsToUpsert.push({ managerId, date, value: val });
          }
        }
      }

      for (const record of recordsToUpsert) {
        const { data: existing } = await supabase
          .from('daily_activity')
          .select('*')
          .eq('manager_id', record.managerId)
          .eq('date', record.date)
          .single();

        if (existing) {
          if (existing.leads_contacted !== record.value) {
            await supabase
              .from('daily_activity')
              .update({ leads_contacted: record.value })
              .eq('id', existing.id);
          }
        } else if (record.value > 0) {
          await supabase
            .from('daily_activity')
            .insert([{
              id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              date: record.date,
              manager_id: record.managerId,
              calls_made: 0,
              meetings_held: 0,
              leads_contacted: record.value
            }]);
        }
      }
      
      alert("✅ Матрица лидов успешно сохранена");
    } catch (err) {
      console.error(err);
      alert("❌ Ошибка при сохранении данных");
    } finally {
      setSaving(false);
    }
  };

  const getTotalForDate = (date: string) => {
    let sum = 0;
    Object.keys(matrixData).forEach(mId => {
      sum += matrixData[mId][date] || 0;
    });
    return sum;
  };

  const getTotalForManager = (managerId: string) => {
    let sum = 0;
    if (matrixData[managerId]) {
      Object.values(matrixData[managerId]).forEach(val => {
        sum += val || 0;
      });
    }
    return sum;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}.${d.getMonth() + 1}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-600" />
          Leads Matrix
        </h2>
        <div className="flex items-center gap-3">
          {/* Селектор */}
          <select 
            value={currentPeriod?.id || ''} 
            onChange={(e) => switchPeriod(e.target.value)}
            className="px-3 py-2 border border-purple-200 rounded-lg text-sm bg-white text-purple-900 font-medium cursor-pointer"
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                Период {p.period_number}: {new Date(p.start_date).toLocaleDateString('ru-RU')} - {new Date(p.end_date).toLocaleDateString('ru-RU')}
              </option>
            ))}
          </select>
          {/* Кнопка создания */}
          <Button 
            onClick={createNewPeriod} 
            disabled={isCreatingPeriod || !isLoaded} 
            variant="outline" 
            className="bg-white border-purple-200 text-purple-700 hover:bg-purple-50 h-9"
          >
            {isCreatingPeriod ? 'Создание...' : 'Создать период (+7 дней)'}
          </Button>
          {/* Существующая кнопка */}
          <Button 
            onClick={handleSave} 
            disabled={loading || saving || !isLoaded}
            className="bg-purple-600 hover:bg-purple-700 h-9"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Сохранить изменения
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Матрица лидов Команды Зета</CardTitle>
          <CardDescription>
            Ежедневный ввод количества полученных/обработанных лидов менеджерами.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right border-collapse relative">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 w-[180px] sticky left-0 bg-white shadow-[1px_0_0_0_#e5e7eb] z-10 border-b border-gray-200">Менеджер</th>
                    {periodDates.map(date => (
                      <th scope="col" key={date} className="px-4 py-3 text-center min-w-[60px] whitespace-nowrap bg-indigo-50 border-x border-b border-white">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-500">
                            {new Date(date).toLocaleDateString('ru-RU', { weekday: 'short' })}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatDate(date)}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-3 text-center font-bold bg-gray-50 border-b border-gray-200 sticky right-0 shadow-[-1px_0_0_0_#e5e7eb] z-10">
                      Итого
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {zetaManagers.map(manager => (
                    <tr key={manager.id} className="bg-white hover:bg-slate-50 transition-colors border-b">
                      <td className="px-4 py-4 font-medium sticky left-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[1px_0_0_0_#e5e7eb] z-10">
                        {manager.name}
                      </td>
                      {periodDates.map(date => (
                        <td key={`${manager.id}-${date}`} className="p-1 border-x border-gray-100">
                          <Input
                            type="number"
                            min="0"
                            className="w-full text-center h-10 border-transparent hover:border-gray-300 focus:border-purple-500 rounded"
                            value={matrixData[manager.id]?.[date] === 0 ? '' : matrixData[manager.id]?.[date] || ''}
                            onChange={(e) => handleCellChange(manager.id, date, e.target.value)}
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-4 text-center sticky right-0 bg-gray-50 font-bold text-purple-700 shadow-[-1px_0_0_0_#e5e7eb] z-10">
                        {getTotalForManager(manager.id)}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Итоговая строка */}
                  <tr className="bg-purple-50/50">
                    <td className="px-4 py-4 font-bold text-gray-900 sticky left-0 bg-purple-50/50 shadow-[1px_0_0_0_#e5e7eb] z-10">
                      ИТОГО КОМАНДА
                    </td>
                    {periodDates.map(date => (
                      <td key={`total-${date}`} className="px-4 py-4 text-center font-bold text-gray-900 bg-purple-50 border-x border-purple-100">
                        {getTotalForDate(date)}
                      </td>
                    ))}
                    <td className="px-4 py-4 text-center font-bold text-purple-800 text-lg sticky right-0 bg-purple-100 shadow-[-1px_0_0_0_#e5e7eb] z-10">
                      {periodDates.reduce((sum, date) => sum + getTotalForDate(date), 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
