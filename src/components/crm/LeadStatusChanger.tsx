"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Lead, LeadStage } from "@/types/finance";

interface LeadStatusChangerProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => void;
  initialStage?: LeadStage; // Начальный статус для диалога (например, 'lost' при нажатии "Срез")
}

// Названия статусов
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

// Последовательность статусов (для валидации)
const stageOrder: LeadStage[] = [
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

// Статусы оплат (требуют сумму)
const paymentStages: LeadStage[] = [
  'payment_customs',
  'payment_car',
  'payment_recycling',
  'payment_fee',
  'payment_deposit',
  'payment_other'
];

export default function LeadStatusChanger({ lead, isOpen, onClose, onUpdate, initialStage }: LeadStatusChangerProps) {
  const [newStage, setNewStage] = useState<LeadStage>(initialStage || lead.stage);
  const [amount, setAmount] = useState(lead.amount?.toString() || '');
  const [lostReasonText, setLostReasonText] = useState('');
  const [notes, setNotes] = useState('');

  // Получить доступные статусы для перехода
  const getAvailableStages = (): LeadStage[] => {
    const currentIndex = stageOrder.indexOf(lead.stage);

    // Если уже в финальном статусе - нельзя менять
    if (lead.stage === 'completed' || lead.stage === 'lost') {
      return [lead.stage];
    }

    // Доступны: текущий, следующий, "потеряно"
    const available: LeadStage[] = [];

    // Текущий статус
    available.push(lead.stage);

    // Следующий статус (если есть)
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      available.push(stageOrder[currentIndex + 1]);
    }

    // Всегда можно перейти в "потеряно"
    available.push('lost');

    return available;
  };

  const availableStages = getAvailableStages();

  const handleSubmit = () => {
    // Валидация: если статус оплаты - нужна сумма
    if (paymentStages.includes(newStage) && !amount) {
      alert('Укажите сумму оплаты');
      return;
    }

    // Валидация: если "потеряно" - нужна причина
    if (newStage === 'lost' && !lostReasonText.trim()) {
      alert('Укажите причину среза');
      return;
    }

    // Если статус не изменился
    if (newStage === lead.stage) {
      alert('Статус не изменился');
      return;
    }

    // Создаем обновленный лид
    const updatedLead: Lead = {
      ...lead,
      stage: newStage,
      // Очищаем сумму для этапов без оплаты (Договор сделан, Дал реквизиты)
      amount: ['contract_done', 'gave_requisites'].includes(newStage)
        ? undefined
        : (amount ? Number(amount) : lead.amount),
      lostReasonText: newStage === 'lost' ? lostReasonText : undefined,
      notes: notes.trim() || lead.notes,
      updatedAt: new Date().toISOString()
    };

    onUpdate(updatedLead);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Изменить статус лида</DialogTitle>
          <DialogDescription>
            {lead.clientName} • {lead.phone}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Текущий статус */}
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Текущий статус:</p>
            <p className="font-semibold text-gray-900">{stageNames[lead.stage]}</p>
          </div>

          {/* Новый статус */}
          <div>
            <Label htmlFor="newStage">Новый статус *</Label>
            <select
              id="newStage"
              value={newStage}
              onChange={(e) => setNewStage(e.target.value as LeadStage)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {availableStages.map(stage => (
                <option key={stage} value={stage}>
                  {stageNames[stage]}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Можно перейти только на следующий этап или в "Потеряно"
            </p>
          </div>

          {/* Сумма (если статус оплаты) */}
          {paymentStages.includes(newStage) && (
            <div>
              <Label htmlFor="amount">Сумма оплаты (₽) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Введите сумму"
                className="mt-1"
              />
            </div>
          )}

          {/* Причина потери (если "Потеряно") */}
          {newStage === 'lost' && (
            <div className="space-y-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Укажите причину среза</span>
              </div>

              <div>
                <Label htmlFor="lostReasonText">Причина среза *</Label>
                <Textarea
                  id="lostReasonText"
                  value={lostReasonText}
                  onChange={(e) => setLostReasonText(e.target.value)}
                  placeholder="Опишите подробно почему лид потерян (например: 'Высокая цена, нашел дешевле у конкурента', 'Не отвечает на звонки уже 2 недели' и т.д.)"
                  rows={4}
                  className="mt-1 border-red-300 focus:ring-red-500"
                />
                <p className="text-xs text-red-600 mt-1">
                  Обязательное поле. Чем подробнее - тем лучше для анализа.
                </p>
              </div>
            </div>
          )}

          {/* Заметки */}
          <div>
            <Label htmlFor="notes">Комментарий к изменению</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация..."
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              className={`flex-1 ${
                newStage === 'lost'
                  ? 'bg-red-600 hover:bg-red-700'
                  : newStage === 'completed'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white`}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
