"use client";
import { useState, useMemo, useEffect } from "react";
import { useCRM } from "@/contexts/CRMContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LeadStatusChanger from "./LeadStatusChanger";
import {
  Users,
  Plus,
  TrendingUp,
  FileText,
  CheckCircle2,
  CircleDollarSign,
  Phone,
  Mail,
  Calendar,
  Edit2,
  Trash2,
  Search,
  Filter,
  User,
  X,
  ArrowRight,
  Scissors,
  AlertTriangle,
  Activity
} from "lucide-react";
import type { Lead, LeadStage, TeamName, ServiceType } from "@/types/finance";

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

// Цвета этапов
const stageColors: Record<LeadStage, string> = {
  contract_done: 'bg-blue-100 text-blue-700 border-blue-300',
  gave_requisites: 'bg-purple-100 text-purple-700 border-purple-300',
  payment_customs: 'bg-amber-100 text-amber-700 border-amber-300',
  payment_car: 'bg-green-100 text-green-700 border-green-300',
  payment_recycling: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  payment_fee: 'bg-pink-100 text-pink-700 border-pink-300',
  payment_deposit: 'bg-orange-100 text-orange-700 border-orange-300',
  payment_other: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  lost: 'bg-gray-100 text-gray-700 border-gray-300'
};

export default function CRMLeadsTab() {
  const { leads, employees, isLoaded, addLead, updateLead, deleteLead } = useCRM();
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [changingStatusLead, setChangingStatusLead] = useState<Lead | null>(null);
  const [initialStageForDialog, setInitialStageForDialog] = useState<LeadStage | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<LeadStage | 'all'>('all');
  const [filterTeam, setFilterTeam] = useState<TeamName | 'all'>('all');
  const [filterManager, setFilterManager] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    email: '',
    phone2: '',
    stage: 'contract_done' as LeadStage,
    serviceType: 'rastamozhka' as ServiceType,
    managerId: '',
    amount: '',
    notes: ''
  });

  // Статистика по этапам
  const stageStats = useMemo(() => {
    const stats: Record<LeadStage, number> = {
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

    leads.forEach(lead => {
      stats[lead.stage]++;
    });

    return stats;
  }, [leads]);

  // Фильтрованные и отсортированные лиды
  const filteredLeads = useMemo(() => {
    const filtered = leads.filter(lead => {
      if (filterStage !== 'all' && lead.stage !== filterStage) return false;
      if (filterTeam !== 'all' && lead.teamId !== filterTeam) return false;
      if (filterManager !== 'all' && lead.managerId !== filterManager) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          lead.clientName.toLowerCase().includes(query) ||
          lead.phone.includes(query) ||
          lead.phone2?.includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          (lead.amount && lead.amount.toString().includes(query))
        );
      }
      return true;
    });

    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'amount') {
        comparison = (a.amount || 0) - (b.amount || 0);
      } else if (sortBy === 'name') {
        comparison = a.clientName.localeCompare(b.clientName);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [leads, filterStage, filterTeam, filterManager, searchQuery, sortBy, sortOrder]);

  // Функция быстрой смены статуса
  const handleQuickStatusChange = (leadId: string, newStage: LeadStage) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Очищаем сумму при переходе на этапы без оплаты
    const shouldClearAmount = ['contract_done', 'gave_requisites'].includes(newStage);

    updateLead(leadId, {
      ...lead,
      stage: newStage,
      amount: shouldClearAmount ? undefined : lead.amount,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация
    if (!formData.clientName.trim()) {
      alert('Введите ФИО клиента');
      return;
    }
    if (!formData.phone.trim()) {
      alert('Введите телефон');
      return;
    }
    if (!formData.managerId) {
      alert('Выберите менеджера');
      return;
    }

    // Сумма обязательна для всех статусов кроме "Договор сделан"
    const needsAmount = formData.stage !== 'contract_done';
    if (needsAmount && !formData.amount) {
      alert('Введите сумму оплаты');
      return;
    }

    // Определяем команду по менеджеру
    const manager = employees.find(e => e.id === formData.managerId);
    const teamId = manager?.team || 'office';

    const newLead: Lead = {
      id: editingLead?.id || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      clientName: formData.clientName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      phone2: formData.phone2.trim() || undefined,
      stage: formData.stage, // Статус выбирает документалист
      serviceType: 'rastamozhka', // По умолчанию растаможка
      managerId: formData.managerId,
      teamId: teamId,
      amount: needsAmount && formData.amount ? Number(formData.amount) : undefined,
      createdBy: editingLead?.createdBy || 'Пользователь',
      createdAt: editingLead?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: formData.notes.trim() || undefined,
      stageHistory: editingLead?.stageHistory || [{
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        previousStage: null,
        newStage: formData.stage,
        changedBy: formData.managerId,
        notes: 'Создан лид'
      }]
    };

    if (editingLead) {
      updateLead(editingLead.id, newLead);
      setEditingLead(null);
    } else {
      addLead(newLead);
    }

    // Сброс формы
    setFormData({
      clientName: '',
      phone: '',
      email: '',
      phone2: '',
      stage: 'contract_done',
      serviceType: 'rastamozhka',
      managerId: '',
      amount: '',
      notes: ''
    });
    setShowForm(false);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      clientName: lead.clientName,
      phone: lead.phone,
      email: lead.email || '',
      phone2: lead.phone2 || '',
      stage: lead.stage,
      serviceType: lead.serviceType,
      managerId: lead.managerId || '',
      amount: lead.amount?.toString() || '',
      notes: lead.notes || ''
    });
    setShowForm(true);
  };

  // Обработчик для кнопки "Срез" - открывает диалог с предустановленным статусом "Потеряно"
  const handleLostStatus = (lead: Lead) => {
    setChangingStatusLead(lead);
    setInitialStageForDialog('lost'); // Предустановить статус "Потеряно"
  };

  const handleStatusUpdate = (updatedLead: Lead) => {
    updateLead(updatedLead.id, updatedLead);
    setChangingStatusLead(null);
    setInitialStageForDialog(undefined);
  };

  const handleDelete = (leadId: string) => {
    if (confirm('Удалить этого лида?')) {
      deleteLead(leadId);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  if (!isLoaded) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Заголовок */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Воронка лидов</h2>
            <p className="text-sm text-gray-600">
              Отслеживание клиентов от документов до завершения сделки
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить лида
          </Button>
        </div>

        {/* Общая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Всего лидов (фиолетовая) */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">{leads.length}</Badge>
              </div>
              <p className="text-sm opacity-90">Всего лидов</p>
              <p className="text-3xl font-bold mt-1">{leads.length}</p>
            </CardContent>
          </Card>

          {/* 2. В работе (синяя) */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">
                  {leads.filter(l => l.stage !== 'lost').length}
                </Badge>
              </div>
              <p className="text-sm opacity-90">В работе</p>
              <p className="text-3xl font-bold mt-1">
                {leads.filter(l => l.stage !== 'lost').length}
              </p>
            </CardContent>
          </Card>

          {/* 3. Срезы (красная) - потерянные лиды */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Scissors className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">{stageStats.lost}</Badge>
              </div>
              <p className="text-sm opacity-90">Срезы</p>
              <p className="text-3xl font-bold mt-1">{stageStats.lost}</p>
              <p className="text-xs opacity-75 mt-1">
                {leads.length > 0 ? ((stageStats.lost / leads.length) * 100).toFixed(1) : 0}% потерь
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Воронка оплат */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Воронка оплат
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Договор сделан */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Договор сделан</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-700">{stageStats.contract_done || 0}</p>
                  <p className="text-xs text-gray-500">
                    {leads.length > 0 ? ((stageStats.contract_done || 0) / leads.length * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>

              {/* Дал реквизиты */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Дал реквизиты</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-700">{stageStats.gave_requisites || 0}</p>
                  <p className="text-xs text-gray-500">
                    {leads.length > 0 ? ((stageStats.gave_requisites || 0) / leads.length * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>

              {/* Оплата растаможки */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-amber-200 hover:border-amber-400 transition-colors">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700">Растаможка</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-700">{stageStats.payment_customs || 0}</p>
                  <p className="text-xs text-gray-500">
                    {leads.length > 0 ? ((stageStats.payment_customs || 0) / leads.length * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>

              {/* Оплата за машину */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">За машину</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700">{stageStats.payment_car || 0}</p>
                  <p className="text-xs text-gray-500">
                    {leads.length > 0 ? ((stageStats.payment_car || 0) / leads.length * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>

              {/* Оплата утиль */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-indigo-200 hover:border-indigo-400 transition-colors">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">Утиль</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-700">{stageStats.payment_recycling || 0}</p>
                  <p className="text-xs text-gray-500">
                    {leads.length > 0 ? ((stageStats.payment_recycling || 0) / leads.length * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>

              {/* Оплата госпошлина */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-pink-200 hover:border-pink-400 transition-colors">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-medium text-gray-700">Госпошлина</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-pink-700">{stageStats.payment_fee || 0}</p>
                  <p className="text-xs text-gray-500">
                    {leads.length > 0 ? ((stageStats.payment_fee || 0) / leads.length * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>

              {/* Оплата залог */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-colors">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">Залог</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-700">{stageStats.payment_deposit || 0}</p>
                  <p className="text-xs text-gray-500">
                    {leads.length > 0 ? ((stageStats.payment_deposit || 0) / leads.length * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>

              {/* Оплата прочее */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-cyan-200 hover:border-cyan-400 transition-colors">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-cyan-600" />
                  <span className="text-sm font-medium text-gray-700">Прочее</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-cyan-700">{stageStats.payment_other || 0}</p>
                  <p className="text-xs text-gray-500">
                    {leads.length > 0 ? ((stageStats.payment_other || 0) / leads.length * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Фильтры и сортировка */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Поиск и сортировка */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">Фильтры и сортировка</span>
                </div>

                {/* Поиск */}
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Поиск по имени, телефону, сумме..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Сортировка */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                >
                  <option value="date">По дате</option>
                  <option value="amount">По сумме</option>
                  <option value="name">По имени</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                  title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {/* Фильтры */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Фильтр по статусу */}
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value as typeof filterStage)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">Все статусы</option>
                  {Object.entries(stageNames).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>

                {/* Фильтр по команде */}
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value as typeof filterTeam)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">Все команды</option>
                  <option value="voha">Команда Вохи</option>
                  <option value="zet">Команда Зета</option>
                  <option value="office">Офис</option>
                </select>

                {/* Фильтр по менеджеру */}
                <select
                  value={filterManager}
                  onChange={(e) => setFilterManager(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">Все менеджеры</option>
                  {employees
                    .filter(e => e.role === 'manager')
                    .map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                </select>

                {/* Сброс фильтров */}
                {(filterStage !== 'all' || filterTeam !== 'all' || filterManager !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterStage('all');
                      setFilterTeam('all');
                      setFilterManager('all');
                      setSearchQuery('');
                    }}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>

              {/* Информация */}
              <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-3">
                <span>Найдено: <strong className="text-purple-600">{filteredLeads.length}</strong> из {leads.length}</span>
                <span className="text-gray-400">•</span>
                <span>Менеджеров: <strong className="text-purple-600">{employees.length}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Список лидов - компактный вид */}
        <div className="space-y-2">
          {filteredLeads.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {searchQuery || filterStage !== 'all' || filterTeam !== 'all' || filterManager !== 'all'
                    ? 'Нет лидов, соответствующих фильтрам'
                    : 'Лидов пока нет'}
                </p>
                <p className="text-sm mt-2">
                  {searchQuery || filterStage !== 'all' || filterTeam !== 'all' || filterManager !== 'all'
                    ? 'Попробуйте изменить параметры поиска'
                    : 'Добавьте первого лида чтобы начать отслеживание'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map(lead => (
              <Card key={lead.id} className="shadow-sm hover:shadow-md transition-all border-l-4 hover:border-l-8" style={{ borderLeftColor: (stageColors[lead.stage] || 'bg-gray-100').split(' ')[0].replace('bg-', '') }}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Аватар */}
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {lead.clientName.charAt(0).toUpperCase()}
                    </div>

                    {/* Основная информация */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 mb-1">{lead.clientName}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </span>
                        {lead.phone2 && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.phone2}
                          </span>
                        )}
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(lead.createdAt)}
                        </span>
                      </div>

                      {/* Причина потери для статуса "Потеряно" */}
                      {lead.stage === 'lost' && lead.lostReasonText && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-red-700 mb-1">
                                Причина среза:
                              </p>
                              <p className="text-xs text-red-600">
                                {lead.lostReasonText}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Статус и теги */}
                    <div className="flex flex-col flex-shrink-0">
                      {/* Первый ряд - только badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge className={stageColors[lead.stage] || 'bg-gray-100 text-gray-700 border-gray-300'}>
                          {stageNames[lead.stage] || lead.stage}
                        </Badge>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                          👤 {employees.find(e => e.id === lead.managerId)?.name || '?'}
                        </Badge>
                        {lead.amount && lead.stage !== 'contract_done' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            💰 {lead.amount.toLocaleString('ru-RU')} ₽
                          </Badge>
                        )}
                      </div>

                      {/* Второй ряд - кнопки действий */}
                      {/* ТОЛЬКО если есть быстрые действия для этого статуса */}
                      {(lead.stage === 'contract_done' || lead.stage === 'gave_requisites') && (
                        <div className="flex items-center gap-2">
                          {/* Кнопки быстрых действий для статуса "Договор сделан" */}
                          {lead.stage === 'contract_done' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickStatusChange(lead.id, 'gave_requisites')}
                                title="Изменить статус на 'Дал реквизиты'"
                                className="bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400 transition-colors text-xs px-2 py-1 h-7"
                              >
                                <ArrowRight className="w-3 h-3 mr-1" />
                                Дал реквизиты
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLostStatus(lead)}
                                title="Изменить статус на 'Потеряно' (Срез) - требуется причина"
                                className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 transition-colors text-xs px-2 py-1 h-7"
                              >
                                <Scissors className="w-3 h-3 mr-1" />
                                Срез
                              </Button>
                            </>
                          )}

                          {/* Кнопка быстрого действия для статуса "Дал реквизиты" */}
                          {lead.stage === 'gave_requisites' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickStatusChange(lead.id, 'payment_customs')}
                              title="Изменить статус на 'Оплата за растаможку'"
                              className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-colors text-xs px-2 py-1 h-7"
                            >
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Оплата растаможки
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Сумма - крупно и выделенно (только для этапов оплаты) */}
                    {lead.amount && !['contract_done', 'gave_requisites'].includes(lead.stage) ? (
                      <div className="flex-shrink-0 text-right bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg border border-green-200">
                        <div className="text-xs text-green-600 font-medium mb-1">Сумма</div>
                        <div className="text-xl font-bold text-green-700">
                          {lead.amount.toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                    ) : !['contract_done', 'gave_requisites'].includes(lead.stage) ? (
                      <div className="flex-shrink-0 text-right bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 font-medium mb-1">Сумма</div>
                        <div className="text-sm text-gray-400">Не указана</div>
                      </div>
                    ) : null}

                    {/* Действия */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(lead)}
                        title="Редактировать данные и изменить статус"
                        className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Редактировать
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(lead.id)}
                        title="Удалить лида"
                        className="hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Форма добавления/редактирования лида */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) {
          setEditingLead(null);
          setFormData({
            clientName: '',
            phone: '',
            email: '',
            phone2: '',
            stage: 'contract_done',
            serviceType: 'rastamozhka',
            managerId: '',
            amount: '',
            notes: ''
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              {editingLead ? 'Редактировать лида' : 'Добавить нового лида'}
            </DialogTitle>
            <DialogDescription>
              Заполните основную информацию о клиенте
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {/* ФИО клиента */}
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                ФИО клиента <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
                placeholder="Иванов Иван Иванович"
                className="text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Телефон */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Телефон <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="+7 (999) 123-45-67"
                  className="text-base"
                />
              </div>

              {/* Второй телефон */}
              <div className="space-y-2">
                <Label htmlFor="phone2" className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Второй телефон
                </Label>
                <Input
                  id="phone2"
                  type="tel"
                  value={formData.phone2}
                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                  placeholder="+7 (999) 987-65-43"
                  className="text-base"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@example.com"
                className="text-base"
              />
            </div>

            {/* Ответственный менеджер */}
            <div className="space-y-2">
                <Label htmlFor="managerId" className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Ответственный менеджер <span className="text-red-500">*</span>
                </Label>
                <select
                  id="managerId"
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Выберите менеджера</option>
                  {employees
                    .filter(e => e.role === 'manager')
                    .map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.team === 'voha' ? 'Команда Вохи' : manager.team === 'zet' ? 'Команда Зета' : 'Офис'})
                      </option>
                    ))}
                </select>
              </div>

            {/* Статус - можно выбирать всегда */}
            <div className="space-y-2">
              <Label htmlFor="stage" className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Статус {editingLead && <span className="text-purple-600 text-xs">(изменить статус лида)</span>}
                <span className="text-red-500">*</span>
              </Label>
              <select
                id="stage"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as LeadStage })}
                className={`w-full px-4 py-3 border-2 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  editingLead
                    ? 'border-purple-300 bg-purple-50 font-semibold'
                    : 'border-gray-300 bg-white'
                }`}
                required
              >
                <option value="contract_done">Договор сделан</option>
                <option value="payment_customs">Оплата за растаможку</option>
                <option value="payment_car">Оплата за авто</option>
                <option value="payment_recycling">Оплата за утиль</option>
                <option value="payment_fee">Оплата за госпошлину</option>
                <option value="payment_deposit">Оплата за залоговый платеж</option>
                {editingLead && (
                  <>
                    <option value="gave_requisites">Дал реквизиты</option>
                    <option value="payment_other">Оплата прочее</option>
                    <option value="completed">Завершено</option>
                    <option value="lost">Потеряно</option>
                  </>
                )}
              </select>
              {editingLead ? (
                <p className="text-xs text-purple-600 font-medium">
                  💡 Измените статус лида на актуальный этап работы
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Выберите начальный статус для нового лида
                </p>
              )}
            </div>

            {/* Сумма оплаты - показываем для всех статусов кроме "Договор сделан" */}
            {formData.stage !== 'contract_done' && (
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-semibold flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4" />
                  Сумма оплаты (₽) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Введите сумму в рублях"
                  className="text-base"
                  required
                />
              </div>
            )}

            {/* Заметки */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Заметки
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительная информация о клиенте..."
                rows={3}
                className="text-base resize-none"
              />
            </div>

            {/* Кнопки */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingLead(null);
                }}
                className="min-w-[100px]"
              >
                <X className="w-4 h-4 mr-2" />
                Отмена
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 min-w-[100px]"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {editingLead ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Диалог изменения статуса */}
      {changingStatusLead && (
        <LeadStatusChanger
          lead={changingStatusLead}
          isOpen={!!changingStatusLead}
          onClose={() => {
            setChangingStatusLead(null);
            setInitialStageForDialog(undefined);
          }}
          onUpdate={handleStatusUpdate}
          initialStage={initialStageForDialog}
        />
      )}
    </div>
  );
}
