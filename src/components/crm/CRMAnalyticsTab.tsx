"use client";
import { useMemo } from "react";
import { useCRM } from "@/contexts/CRMContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Activity,
  Target
} from "lucide-react";
import type { Lead, LeadStage, LostReason } from "@/types/finance";

// Названия причин потери
const lostReasonNames: Record<LostReason, string> = {
  high_price: 'Высокая цена',
  long_wait: 'Долгое ожидание',
  found_competitor: 'Нашел конкурента',
  changed_mind: 'Передумал',
  no_money: 'Нет денег',
  no_response: 'Не отвечает',
  other: 'Другое'
};

// Названия этапов
const stageNames: Record<LeadStage, string> = {
  contract_done: 'Договор сделан',
  gave_requisites: 'Дал реквизиты',
  payment_customs: 'Оплата за растаможку',
  payment_car: 'Оплата за авто',
  payment_recycling: 'Оплата за утиль',
  payment_fee: 'Оплата за госпошлину',
  payment_deposit: 'Оплата за залоговый платеж',
  payment_other: 'Оплата прочее',
  completed: 'Завершено',
  lost: 'Потеряно'
};

// Порядок этапов в воронке (без "Потеряно")
const funnelStages: LeadStage[] = [
  'contract_done',
  'gave_requisites',
  'payment_customs',
  'payment_car',
  'payment_recycling',
  'payment_fee',
  'payment_deposit',
  'payment_other',
  'completed'
];

export default function CRMAnalyticsTab() {
  const { leads, employees } = useCRM();

  // Статистика по этапам
  const stageStats = useMemo(() => {
    const stats: Record<LeadStage, { count: number; amount: number; leads: Lead[] }> = {
      contract_done: { count: 0, amount: 0, leads: [] },
      gave_requisites: { count: 0, amount: 0, leads: [] },
      payment_customs: { count: 0, amount: 0, leads: [] },
      payment_car: { count: 0, amount: 0, leads: [] },
      payment_recycling: { count: 0, amount: 0, leads: [] },
      payment_fee: { count: 0, amount: 0, leads: [] },
      payment_deposit: { count: 0, amount: 0, leads: [] },
      payment_other: { count: 0, amount: 0, leads: [] },
      completed: { count: 0, amount: 0, leads: [] },
      lost: { count: 0, amount: 0, leads: [] }
    };

    leads.forEach(lead => {
      stats[lead.stage].count++;
      stats[lead.stage].amount += lead.amount || 0;
      stats[lead.stage].leads.push(lead);
    });

    return stats;
  }, [leads]);

  // Анализ срезов - откуда лиды переходят в "Потеряно"
  const lostLeadsAnalysis = useMemo(() => {
    const lostFromStage: Record<LeadStage, number> = {
      contract_done: 0,
      gave_requisites: 0,
      payment_customs: 0,
      payment_car: 0,
      payment_recycling: 0,
      payment_fee: 0,
      payment_deposit: 0,
      payment_other: 0,
      completed: 0,
      lost: 0
    };

    const lostLeads = stageStats.lost.leads;

    lostLeads.forEach(lead => {
      // Приоритет: используем lostAtStage если указан
      if (lead.lostAtStage) {
        lostFromStage[lead.lostAtStage]++;
      } else if (lead.stageHistory && lead.stageHistory.length > 0) {
        // Fallback: берем последнюю запись в истории с lostAtStage
        const history = lead.stageHistory;
        const lostEntry = history.find(h => h.newStage === 'lost');
        if (lostEntry?.lostAtStage) {
          lostFromStage[lostEntry.lostAtStage]++;
        } else if (lostEntry?.previousStage) {
          // Еще один fallback: используем previousStage
          lostFromStage[lostEntry.previousStage]++;
        }
      }
    });

    return lostFromStage;
  }, [stageStats]);

  // Анализ причин потери
  const lostReasonsAnalysis = useMemo(() => {
    const reasonsCount: Record<LostReason, number> = {
      high_price: 0,
      long_wait: 0,
      found_competitor: 0,
      changed_mind: 0,
      no_money: 0,
      no_response: 0,
      other: 0
    };

    const lostLeads = stageStats.lost.leads;
    lostLeads.forEach(lead => {
      if (lead.lostReason) {
        reasonsCount[lead.lostReason]++;
      }
    });

    return reasonsCount;
  }, [stageStats]);

  // Конверсия между этапами
  const conversionStats = useMemo(() => {
    const conversions: { stage: LeadStage; rate: number }[] = [];

    for (let i = 0; i < funnelStages.length - 1; i++) {
      const currentStage = funnelStages[i];
      const nextStage = funnelStages[i + 1];

      // Считаем сколько лидов прошло текущий этап
      let passedCurrentStage = 0;
      for (let j = i; j < funnelStages.length; j++) {
        passedCurrentStage += stageStats[funnelStages[j]].count;
      }

      // Считаем сколько дошло до следующего
      let reachedNextStage = 0;
      for (let j = i + 1; j < funnelStages.length; j++) {
        reachedNextStage += stageStats[funnelStages[j]].count;
      }

      const rate = passedCurrentStage > 0 ? (reachedNextStage / passedCurrentStage) * 100 : 0;
      conversions.push({ stage: currentStage, rate });
    }

    return conversions;
  }, [stageStats]);

  // Среднее время на каждом этапе
  const averageTimePerStage = useMemo(() => {
    const timeStats: Record<LeadStage, { totalDays: number; count: number; avgDays: number }> = {
      contract_done: { totalDays: 0, count: 0, avgDays: 0 },
      gave_requisites: { totalDays: 0, count: 0, avgDays: 0 },
      payment_customs: { totalDays: 0, count: 0, avgDays: 0 },
      payment_car: { totalDays: 0, count: 0, avgDays: 0 },
      payment_recycling: { totalDays: 0, count: 0, avgDays: 0 },
      payment_fee: { totalDays: 0, count: 0, avgDays: 0 },
      payment_deposit: { totalDays: 0, count: 0, avgDays: 0 },
      payment_other: { totalDays: 0, count: 0, avgDays: 0 },
      completed: { totalDays: 0, count: 0, avgDays: 0 },
      lost: { totalDays: 0, count: 0, avgDays: 0 }
    };

    leads.forEach(lead => {
      if (lead.stageHistory && lead.stageHistory.length > 0) {
        const history = lead.stageHistory;

        for (let i = 0; i < history.length; i++) {
          const entry = history[i];
          const nextEntry = history[i + 1];

          const startTime = new Date(entry.timestamp).getTime();
          const endTime = nextEntry
            ? new Date(nextEntry.timestamp).getTime()
            : new Date(lead.updatedAt).getTime();

          const days = (endTime - startTime) / (1000 * 60 * 60 * 24);

          timeStats[entry.newStage].totalDays += days;
          timeStats[entry.newStage].count++;
        }
      }
    });

    // Вычисляем средние
    Object.keys(timeStats).forEach(stage => {
      const stat = timeStats[stage as LeadStage];
      stat.avgDays = stat.count > 0 ? stat.totalDays / stat.count : 0;
    });

    return timeStats;
  }, [leads]);

  // Общая статистика
  const totalStats = useMemo(() => {
    const total = leads.length;
    const active = leads.filter(l => l.stage !== 'completed' && l.stage !== 'lost').length;
    const completed = stageStats.completed.count;
    const lost = stageStats.lost.count;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const lossRate = total > 0 ? (lost / total) * 100 : 0;
    const totalRevenue = stageStats.completed.amount;
    const potentialRevenue = leads
      .filter(l => l.stage !== 'completed' && l.stage !== 'lost')
      .reduce((sum, l) => sum + (l.amount || 0), 0);

    return { total, active, completed, lost, completionRate, lossRate, totalRevenue, potentialRevenue };
  }, [leads, stageStats]);

  return (
    <div className="space-y-6 p-6">
      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Всего лидов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalStats.total}</div>
            <div className="text-sm text-gray-500 mt-1">
              Активных: <span className="font-semibold text-blue-600">{totalStats.active}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Завершено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalStats.completed}</div>
            <div className="text-sm text-gray-500 mt-1">
              Конверсия: <span className="font-semibold">{totalStats.completionRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Потеряно
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{totalStats.lost}</div>
            <div className="text-sm text-gray-500 mt-1">
              Процент срезов: <span className="font-semibold">{totalStats.lossRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Выручка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {totalStats.totalRevenue.toLocaleString()} ₽
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Потенциал: <span className="font-semibold">{totalStats.potentialRevenue.toLocaleString()} ₽</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Воронка продаж */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Воронка продаж
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelStages.map((stage, index) => {
              const stat = stageStats[stage];
              const maxCount = Math.max(...funnelStages.map(s => stageStats[s].count));
              const widthPercent = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
              const conversion = conversionStats[index];

              return (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{stageNames[stage]}</span>
                    <div className="flex items-center gap-3">
                      {conversion && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          conversion.rate >= 70 ? 'bg-green-100 text-green-700' :
                          conversion.rate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          ↓ {conversion.rate.toFixed(0)}%
                        </span>
                      )}
                      <span className="font-semibold text-gray-900">{stat.count} лидов</span>
                      {stat.amount > 0 && (
                        <span className="text-gray-500">• {stat.amount.toLocaleString()} ₽</span>
                      )}
                    </div>
                  </div>
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-end pr-3 text-white text-sm font-medium transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    >
                      {widthPercent > 20 && `${stat.count}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Анализ срезов */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Анализ срезов - откуда теряются лиды
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {funnelStages.map(stage => {
              const lostCount = lostLeadsAnalysis[stage];
              if (lostCount === 0) return null;

              const totalLost = totalStats.lost;
              const percentOfLost = totalLost > 0 ? (lostCount / totalLost) * 100 : 0;

              return (
                <div key={stage} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-sm font-medium text-gray-700">{stageNames[stage]}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">{lostCount} лидов</Badge>
                    <span className="text-xs text-gray-600">
                      {percentOfLost.toFixed(1)}% от всех потерь
                    </span>
                  </div>
                </div>
              );
            })}
            {Object.values(lostLeadsAnalysis).every(v => v === 0) && (
              <div className="text-center text-gray-500 py-4">
                Нет данных о срезах. История изменений статусов пока не заполнена.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Анализ причин потери */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600" />
            Детальный анализ причин потери
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.entries(lostReasonsAnalysis) as [LostReason, number][]).map(([reason, count]) => {
              if (count === 0) return null;

              const totalLost = totalStats.lost;
              const percentage = totalLost > 0 ? (count / totalLost) * 100 : 0;

              return (
                <div key={reason} className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">{lostReasonNames[reason]}</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-red-600">{count}</span>
                    <span className="text-sm text-gray-600">лидов</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {percentage.toFixed(1)}% от всех потерь
                  </div>

                  {/* Прогресс-бар */}
                  <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.values(lostReasonsAnalysis).every(v => v === 0) && (
              <div className="col-span-full text-center text-gray-500 py-4">
                Нет данных о причинах потери. При переводе лидов в статус "Потеряно" указывайте причину.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Среднее время на этапах */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Среднее время на каждом этапе
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {funnelStages.map(stage => {
              const timeStat = averageTimePerStage[stage];
              if (timeStat.count === 0) return null;

              return (
                <div key={stage} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-gray-700 mb-1">{stageNames[stage]}</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {timeStat.avgDays.toFixed(1)} дн.
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    На основе {timeStat.count} {timeStat.count === 1 ? 'лида' : 'лидов'}
                  </div>
                </div>
              );
            })}
            {Object.values(averageTimePerStage).every(v => v.count === 0) && (
              <div className="col-span-full text-center text-gray-500 py-4">
                Нет данных о времени на этапах. История изменений статусов пока не заполнена.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Статистика по командам */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Команда Зета</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Всего лидов:</span>
                <span className="font-semibold">{leads.filter(l => l.teamId === 'zet').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Завершено:</span>
                <span className="font-semibold text-green-600">
                  {leads.filter(l => l.teamId === 'zet' && l.stage === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Потеряно:</span>
                <span className="font-semibold text-red-600">
                  {leads.filter(l => l.teamId === 'zet' && l.stage === 'lost').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
