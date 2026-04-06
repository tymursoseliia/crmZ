import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase не настроен! Используется localStorage.');
  console.warn('Для работы с БД создайте файл .env.local с переменными:');
  console.warn('NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
}

// Используем createClient без generic типов для избежания TypeScript ошибок
// Типы можно сгенерировать позже с помощью: npx supabase gen types typescript
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Проверка подключения
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('employees').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Утилиты для преобразования данных БД в типы приложения
export const dbToApp = {
  employee: (row: any) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    team: row.team,
    salary: Number(row.salary),
    percentRastamozhka: Number(row.percent_rastamozhka),
    percentDobiv: Number(row.percent_dobiv),
    percentProfit: Number(row.percent_profit),
    isSpecial: row.is_special,
    fixedPay: row.fixed_pay ? Number(row.fixed_pay) : undefined,
    percentDobivDyadya: row.percent_dobiv_dyadya ? Number(row.percent_dobiv_dyadya) : undefined,
  }),

  operation: (row: any) => ({
    id: row.id,
    date: row.date,
    sumRub: Number(row.sum_rub),
    dropId: row.drop_id,
    dropCommission: Number(row.drop_commission),
    exchangeRate: Number(row.exchange_rate),
    type: row.type,
    managerId: row.manager_id,
    closerId: row.closer_id,
    comment: row.comment,
    usdtAfterCommission: Number(row.usdt_after_commission),
    managerEarning: Number(row.manager_earning),
    closerEarning: row.closer_earning ? Number(row.closer_earning) : undefined,
    team: row.team,
  }),

  expense: (row: any) => ({
    id: row.id,
    date: row.date,
    category: row.category,
    sumUsdt: Number(row.sum_usdt),
    type: row.type,
    teamId: row.team_id,
    employeeId: row.employee_id,
    issuedBy: row.issued_by,
    recipient: row.recipient,
    comment: row.comment,
  }),

  dailyActivity: (row: any) => ({
    id: row.id,
    date: row.date,
    managerId: row.manager_id,
    callsMade: Number(row.calls_made),
    meetingsHeld: Number(row.meetings_held),
    leadsContacted: Number(row.leads_contacted),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }),

  lead: (row: any) => ({
    id: row.id,
    clientName: row.client_name,
    phone: row.phone,
    email: row.email,
    phone2: row.phone2,
    stage: row.stage,
    serviceType: row.service_type,
    managerId: row.manager_id,
    teamId: row.team_id,
    amount: row.amount ? Number(row.amount) : undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notes: row.notes,
    operationId: row.operation_id,
    stageHistory: row.stage_history ? JSON.parse(row.stage_history) : undefined,
    lostReason: row.lost_reason,
    lostReasonText: row.lost_reason_text,
    lostAtStage: row.lost_at_stage,
  }),
};

export const appToDb = {
  employee: (emp: any) => ({
    id: emp.id,
    name: emp.name,
    role: emp.role,
    team: emp.team,
    salary: emp.salary,
    percent_rastamozhka: emp.percentRastamozhka,
    percent_dobiv: emp.percentDobiv,
    percent_profit: emp.percentProfit,
    is_special: emp.isSpecial,
    fixed_pay: emp.fixedPay,
    percent_dobiv_dyadya: emp.percentDobivDyadya,
  }),

  operation: (op: any) => ({
    id: op.id,
    date: op.date,
    sum_rub: op.sumRub,
    drop_id: op.dropId,
    drop_commission: op.dropCommission,
    exchange_rate: op.exchangeRate,
    type: op.type,
    manager_id: op.managerId,
    closer_id: op.closerId,
    comment: op.comment,
    usdt_after_commission: op.usdtAfterCommission,
    manager_earning: op.managerEarning,
    closer_earning: op.closerEarning,
    team: op.team,
  }),

  expense: (exp: any) => ({
    id: exp.id,
    date: exp.date,
    category: exp.category,
    sum_usdt: exp.sumUsdt,
    type: exp.type,
    team_id: exp.teamId,
    employee_id: exp.employeeId,
    issued_by: exp.issuedBy,
    recipient: exp.recipient,
    comment: exp.comment,
  }),

  dailyActivity: (activity: any) => ({
    id: activity.id,
    date: activity.date,
    manager_id: activity.managerId,
    calls_made: activity.callsMade,
    meetings_held: activity.meetingsHeld,
    leads_contacted: activity.leadsContacted,
    notes: activity.notes,
  }),

  lead: (lead: any) => ({
    id: lead.id,
    client_name: lead.clientName,
    phone: lead.phone,
    email: lead.email,
    phone2: lead.phone2,
    stage: lead.stage,
    service_type: lead.serviceType,
    manager_id: lead.managerId,
    team_id: lead.teamId,
    amount: lead.amount,
    created_by: lead.createdBy,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
    notes: lead.notes,
    operation_id: lead.operationId,
    stage_history: lead.stageHistory ? JSON.stringify(lead.stageHistory) : null,
    lost_reason: lead.lostReason,
    lost_reason_text: lead.lostReasonText,
    lost_at_stage: lead.lostAtStage,
  }),
};
