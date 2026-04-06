"use client";
import { useFinance } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Lock, ChevronDown, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function PeriodSelector() {
  const { currentPeriod, periods, createNewPeriod, closePeriod, switchToPeriod } = useFinance();
  const [showDropdown, setShowDropdown] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleCreatePeriod = async () => {
    if (confirm('Создать новый период?')) {
      await createNewPeriod();
    }
  };

  const handleClosePeriod = async () => {
    if (currentPeriod.isClosed) {
      alert('Период уже закрыт');
      return;
    }
    if (confirm(`Закрыть период "${formatDate(currentPeriod.startDate)} - ${formatDate(currentPeriod.endDate)}"?\n\nПосле закрытия редактирование будет невозможно!`)) {
      await closePeriod(currentPeriod.id);
      alert('Период закрыт');
    }
  };

  const sortedPeriods = [...periods].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Селектор периода */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">
              {formatDate(currentPeriod.startDate)} - {formatDate(currentPeriod.endDate)}
            </span>
            {currentPeriod.isClosed && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                <Lock className="w-2.5 h-2.5 mr-0.5" />
                Закрыт
              </Badge>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>

          {/* Dropdown с периодами */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                {sortedPeriods.map(period => (
                  <button
                    key={period.id}
                    onClick={() => {
                      switchToPeriod(period.id);
                      setShowDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                      period.id === currentPeriod.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      </span>
                      {period.isClosed && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          <Lock className="w-2.5 h-2.5 mr-0.5" />
                          Закрыт
                        </Badge>
                      )}
                    </div>
                    {period.id === currentPeriod.id && (
                      <Badge variant="default" className="text-[10px]">Текущий</Badge>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Кнопка создания нового периода */}
        <Button
          onClick={handleCreatePeriod}
          size="sm"
          variant="outline"
          className="flex items-center gap-1.5 h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Новый период
        </Button>

        {/* Кнопка закрытия периода */}
        {!currentPeriod.isClosed && (
          <Button
            onClick={handleClosePeriod}
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 h-8 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <Lock className="w-3.5 h-3.5" />
            Закрыть период
          </Button>
        )}
      </div>


    </div>
  );
}
