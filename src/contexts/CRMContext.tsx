"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { Lead, Employee } from "@/types/finance";
import { supabase, checkSupabaseConnection, dbToApp, appToDb } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CRMContextType {
  leads: Lead[];
  employees: Employee[];
  isLoaded: boolean;
  useSupabase: boolean;
  isRealtime: boolean; // Показывает активна ли real-time синхронизация
  addLead: (lead: Lead) => Promise<void>;
  updateLead: (id: string, lead: Lead) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  reloadData: () => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useSupabase, setUseSupabase] = useState(false);
  const [isRealtime, setIsRealtime] = useState(false);

  // Ref для хранения канала подписки
  const leadsChannelRef = useRef<RealtimeChannel | null>(null);
  const employeesChannelRef = useRef<RealtimeChannel | null>(null);

  // ===== ЗАГРУЗКА МЕНЕДЖЕРОВ ИЗ LOCALSTORAGE (fallback) =====
  const loadEmployeesFromLocalStorage = useCallback(() => {
    try {
      const financeEmployees = localStorage.getItem('finance_employees');
      if (financeEmployees) {
        const parsed = JSON.parse(financeEmployees);
        if (Array.isArray(parsed)) {
          const managers = parsed.filter((e: Employee) =>
            e.role === 'manager' || e.role === 'teamlead'
          );
          setEmployees(managers);
          console.log('[CRM] Загружено менеджеров из localStorage:', managers.length);
        }
      }
    } catch (error) {
      console.error('[CRM] Ошибка загрузки менеджеров:', error);
    }
  }, []);

  // ===== ЗАГРУЗКА МЕНЕДЖЕРОВ ИЗ SUPABASE =====
  const loadEmployeesFromSupabase = useCallback(async () => {
    if (!supabase) {
      loadEmployeesFromLocalStorage();
      return;
    }

    try {
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .in('role', ['manager', 'teamlead'])
        .order('name');

      if (empError) {
        console.warn('[CRM] Ошибка загрузки сотрудников из Supabase:', empError);
        loadEmployeesFromLocalStorage();
      } else if (employeesData) {
        setEmployees(employeesData.map(dbToApp.employee));
        console.log('[CRM] Загружено менеджеров из Supabase:', employeesData.length);
      }
    } catch (error) {
      console.error('[CRM] Ошибка загрузки менеджеров:', error);
      loadEmployeesFromLocalStorage();
    }
  }, [loadEmployeesFromLocalStorage]);

  // ===== REAL-TIME ПОДПИСКИ =====
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!supabase) return;

    console.log('[CRM] Настройка real-time подписок...');

    // Подписка на изменения в таблице leads
    leadsChannelRef.current = supabase
      .channel('crm-leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          console.log('[CRM Realtime] Изменение в leads:', payload.eventType);

          if (payload.eventType === 'INSERT') {
            const newLead = dbToApp.lead(payload.new);
            setLeads(prev => {
              // Проверяем, нет ли уже такого лида (избегаем дубликатов от своих же операций)
              if (prev.some(l => l.id === newLead.id)) return prev;
              return [...prev, newLead];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedLead = dbToApp.lead(payload.new);
            setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setLeads(prev => prev.filter(l => l.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[CRM] ✅ Real-time подписка на leads активна');
          setIsRealtime(true);
        }
      });

    // Подписка на изменения в таблице employees (для обновления списка менеджеров)
    employeesChannelRef.current = supabase
      .channel('crm-employees-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        (payload) => {
          console.log('[CRM Realtime] Изменение в employees:', payload.eventType);
          // Перезагружаем только менеджеров
          loadEmployeesFromSupabase();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[CRM] ✅ Real-time подписка на employees активна');
        }
      });
  }, [loadEmployeesFromSupabase]);

  // Очистка подписок при размонтировании
  useEffect(() => {
    return () => {
      if (leadsChannelRef.current) {
        supabase?.removeChannel(leadsChannelRef.current);
      }
      if (employeesChannelRef.current) {
        supabase?.removeChannel(employeesChannelRef.current);
      }
    };
  }, []);

  // ===== ЗАГРУЗКА ЛИДОВ ИЗ LOCALSTORAGE =====
  const loadLeadsFromLocalStorage = () => {
    try {
      const savedLeads = localStorage.getItem('crm_leads');
      if (savedLeads) {
        const parsed = JSON.parse(savedLeads);
        setLeads(parsed);
        console.log('[CRM] Загружено лидов из localStorage:', parsed.length);
      }
    } catch (error) {
      console.error('[CRM] Ошибка загрузки лидов из localStorage:', error);
    }
  };

  // ===== ЗАГРУЗКА ВСЕХ ДАННЫХ ИЗ LOCALSTORAGE =====
  const loadFromLocalStorage = useCallback(() => {
    loadLeadsFromLocalStorage();
    loadEmployeesFromLocalStorage();
  }, [loadEmployeesFromLocalStorage]);

  // ===== ЗАГРУЗКА ДАННЫХ ИЗ SUPABASE =====
  const loadFromSupabase = useCallback(async () => {
    if (!supabase) return;

    try {
      // Загружаем лиды
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.warn('[CRM] Ошибка загрузки лидов из Supabase:', leadsError);
        // Таблица может не существовать, используем localStorage
        loadLeadsFromLocalStorage();
      } else if (leadsData) {
        setLeads(leadsData.map(dbToApp.lead));
        console.log('[CRM] Загружено лидов из Supabase:', leadsData.length);
      }

      // Загружаем менеджеров через выделенную функцию
      await loadEmployeesFromSupabase();

      // Активируем real-time подписки после успешной загрузки
      setupRealtimeSubscriptions();
    } catch (error) {
      console.error('[CRM] Ошибка загрузки из Supabase:', error);
      loadFromLocalStorage();
      setUseSupabase(false);
    }
  }, [loadEmployeesFromSupabase, loadFromLocalStorage, setupRealtimeSubscriptions]);

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  useEffect(() => {
    const loadInitialData = async () => {
      if (typeof window === 'undefined') return;

      // Проверяем, доступен ли Supabase
      const supabaseAvailable = await checkSupabaseConnection();
      setUseSupabase(supabaseAvailable);

      if (supabaseAvailable && supabase) {
        console.log('[CRM] Используется Supabase БД');
        await loadFromSupabase();
      } else {
        console.log('[CRM] Supabase недоступен, используется localStorage');
        loadFromLocalStorage();
      }

      setIsLoaded(true);
    };

    loadInitialData();
  }, [loadFromSupabase, loadFromLocalStorage]);

  // ===== АВТОСОХРАНЕНИЕ В LOCALSTORAGE (резервная копия) =====
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('crm_leads', JSON.stringify(leads));
    }
  }, [leads, isLoaded]);

  // ===== CRUD ОПЕРАЦИИ =====
  const addLead = async (lead: Lead) => {
    if (useSupabase && supabase) {
      try {
        const { error } = await supabase
          .from('leads')
          .insert([appToDb.lead(lead)] as any);

        if (error) {
          console.error('[CRM] Ошибка добавления лида в Supabase:', error);
          alert('Ошибка сохранения лида в БД');
          return;
        }
        console.log('[CRM] Лид сохранен в Supabase:', lead.id);
        // При использовании real-time, лид добавится автоматически через подписку
        // Но для немедленного отображения добавляем и локально
      } catch (err) {
        console.error('[CRM] Ошибка при добавлении лида:', err);
        alert('Ошибка сохранения лида');
        return;
      }
    }
    setLeads(prev => [...prev, lead]);
  };

  const updateLead = async (id: string, lead: Lead) => {
    // Находим старый лид для проверки изменения статуса
    const oldLead = leads.find(l => l.id === id);

    // Обновляем updatedAt перед сохранением
    const updatedLead = { ...lead, updatedAt: new Date().toISOString() };

    // Если статус изменился, добавляем запись в историю
    if (oldLead && oldLead.stage !== lead.stage) {
      const historyEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        previousStage: oldLead.stage,
        newStage: lead.stage,
        changedBy: lead.managerId, // Можно улучшить, передавая ID текущего пользователя
        notes: lead.notes,
        lostReason: lead.stage === 'lost' ? lead.lostReason : undefined,
        lostReasonText: lead.stage === 'lost' ? lead.lostReasonText : undefined,
        lostAtStage: lead.stage === 'lost' ? lead.lostAtStage : undefined
      };

      const existingHistory = lead.stageHistory || [];
      updatedLead.stageHistory = [...existingHistory, historyEntry];

      console.log('[CRM] Изменен статус лида:', {
        leadId: id,
        from: oldLead.stage,
        to: lead.stage,
        lostReason: lead.stage === 'lost' ? lead.lostReason : null,
        history: updatedLead.stageHistory.length
      });
    }

    if (useSupabase && supabase) {
      try {
        const { error } = await supabase
          .from('leads')
          .update(appToDb.lead(updatedLead))
          .eq('id', id);

        if (error) {
          console.error('[CRM] Ошибка обновления лида в Supabase:', error);
          alert('Ошибка обновления лида в БД');
          return;
        }
        console.log('[CRM] Лид обновлен в Supabase:', id);
      } catch (err) {
        console.error('[CRM] Ошибка при обновлении лида:', err);
        alert('Ошибка обновления лида');
        return;
      }
    }
    setLeads(prev => prev.map(l => l.id === id ? updatedLead : l));
  };

  const deleteLead = async (id: string) => {
    if (useSupabase && supabase) {
      try {
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('[CRM] Ошибка удаления лида из Supabase:', error);
          alert('Ошибка удаления лида из БД');
          return;
        }
        console.log('[CRM] Лид удален из Supabase:', id);
      } catch (err) {
        console.error('[CRM] Ошибка при удалении лида:', err);
        alert('Ошибка удаления лида');
        return;
      }
    }
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const reloadData = async () => {
    if (useSupabase) {
      await loadFromSupabase();
      console.log('[CRM] Данные обновлены из Supabase');
    } else {
      loadFromLocalStorage();
      console.log('[CRM] Данные обновлены из localStorage');
    }
  };

  return (
    <CRMContext.Provider
      value={{
        leads,
        employees,
        isLoaded,
        useSupabase,
        isRealtime,
        addLead,
        updateLead,
        deleteLead,
        reloadData,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
