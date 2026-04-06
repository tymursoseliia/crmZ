"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Users, FileText, Calendar, Save, Loader2 } from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";
import type { DailyActivity } from "@/types/finance";
import { supabase } from "@/lib/supabase";

export default function DailyActivityForm() {
  const { employees } = useFinance();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedManager, setSelectedManager] = useState("");
  const [callsMade, setCallsMade] = useState("");
  const [meetingsHeld, setMeetingsHeld] = useState("");
  const [leadsContacted, setLeadsContacted] = useState("");
  const [notes, setNotes] = useState("");
  const [existingActivity, setExistingActivity] = useState<DailyActivity | null>(null);

  // Только менеджеры (не особые)
  const managers = employees.filter(e => e.role === 'manager' && !e.isSpecial);

  // Загружаем существующую активность при изменении даты или менеджера
  useEffect(() => {
    if (selectedDate && selectedManager) {
      loadExistingActivity();
    } else {
      setExistingActivity(null);
      setCallsMade("");
      setMeetingsHeld("");
      setLeadsContacted("");
      setNotes("");
    }
  }, [selectedDate, selectedManager]);

  const loadExistingActivity = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('date', selectedDate)
        .eq('manager_id', selectedManager)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Ошибка загрузки активности:', error);
        return;
      }

      if (data) {
        setExistingActivity({
          id: data.id,
          date: data.date,
          managerId: data.manager_id,
          callsMade: data.calls_made,
          meetingsHeld: data.meetings_held,
          leadsContacted: data.leads_contacted,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
        setCallsMade(data.calls_made.toString());
        setMeetingsHeld(data.meetings_held.toString());
        setLeadsContacted(data.leads_contacted.toString());
        setNotes(data.notes || "");
      } else {
        setExistingActivity(null);
        setCallsMade("");
        setMeetingsHeld("");
        setLeadsContacted("");
        setNotes("");
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedManager) {
      alert('Выберите менеджера');
      return;
    }

    setLoading(true);

    const activityData = {
      date: selectedDate,
      manager_id: selectedManager,
      calls_made: Number.parseInt(callsMade) || 0,
      meetings_held: Number.parseInt(meetingsHeld) || 0,
      leads_contacted: Number.parseInt(leadsContacted) || 0,
      notes: notes || null,
    };

    try {
      if (supabase) {
        if (existingActivity) {
          // Обновляем существующую запись
          const { error } = await supabase
            .from('daily_activity')
            .update(activityData)
            .eq('id', existingActivity.id);

          if (error) throw error;
          alert('✅ Активность обновлена!');
        } else {
          // Создаем новую запись
          const { error } = await supabase
            .from('daily_activity')
            .insert([{
              id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              ...activityData,
            }]);

          if (error) throw error;
          alert('✅ Активность сохранена!');
        }

        // Перезагружаем данные
        await loadExistingActivity();
      } else {
        alert('⚠️ Supabase не подключен. Активность сохранена только локально.');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('❌ Ошибка сохранения активности');
    } finally {
      setLoading(false);
    }
  };

  const selectedManagerData = managers.find(m => m.id === selectedManager);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          Ежедневный отчет активности
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Зафиксируйте количество звонков, встреч и контактов за день
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Дата и менеджер */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Дата
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="border-gray-300"
              />
            </div>

            <div>
              <Label htmlFor="manager" className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" />
                Менеджер
              </Label>
              <Select value={selectedManager} onValueChange={setSelectedManager}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Выберите менеджера" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedManager && (
            <>
              {/* Показываем информацию о менеджере */}
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm font-medium text-indigo-900">
                  Отчет для: {selectedManagerData?.name} ({selectedManagerData?.team === 'zet' ? 'Команда Зета' : 'Офис'})
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  Дата: {new Date(selectedDate).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                {existingActivity && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Активность за эту дату уже записана. Вы можете обновить данные.
                  </p>
                )}
              </div>

              {/* Показатели активности */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="calls" className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    Звонков сделано
                  </Label>
                  <Input
                    id="calls"
                    type="number"
                    min="0"
                    value={callsMade}
                    onChange={(e) => setCallsMade(e.target.value)}
                    placeholder="0"
                    className="border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Исходящие звонки клиентам
                  </p>
                </div>

                <div>
                  <Label htmlFor="meetings" className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-600" />
                    Встреч проведено
                  </Label>
                  <Input
                    id="meetings"
                    type="number"
                    min="0"
                    value={meetingsHeld}
                    onChange={(e) => setMeetingsHeld(e.target.value)}
                    placeholder="0"
                    className="border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Встречи с клиентами
                  </p>
                </div>

                <div>
                  <Label htmlFor="leads" className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Контактов с лидами
                  </Label>
                  <Input
                    id="leads"
                    type="number"
                    min="0"
                    value={leadsContacted}
                    onChange={(e) => setLeadsContacted(e.target.value)}
                    placeholder="0"
                    className="border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Новые лиды в работе
                  </p>
                </div>
              </div>

              {/* Заметки */}
              <div>
                <Label htmlFor="notes" className="mb-2">
                  Заметки (опционально)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                  placeholder="Особенности работы за день, важные события..."
                  className="border-gray-300 min-h-[100px]"
                />
              </div>

              {/* Кнопка сохранения */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {existingActivity ? 'Обновить отчет' : 'Сохранить отчет'}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {!selectedManager && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Выберите менеджера и дату для заполнения отчета</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
