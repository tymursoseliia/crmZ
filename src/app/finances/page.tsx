"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, DollarSign, Receipt, Users, Calculator, BarChart3, Target, LogOut, Lock, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceProvider } from "@/contexts/FinanceContext";
import dynamic from 'next/dynamic';

// Динамический импорт компонентов
const FinanceDashboard = dynamic(() => import('@/components/finance/FinanceDashboard'), {
  loading: () => <div className="bg-white rounded-lg shadow p-6">Загрузка...</div>
});

const OperationsTab = dynamic(() => import('@/components/finance/OperationsTab'), {
  loading: () => <div className="bg-white rounded-lg shadow p-6">Загрузка...</div>
});

const ExpensesTab = dynamic(() => import('@/components/finance/ExpensesTab'), {
  loading: () => <div className="bg-white rounded-lg shadow p-6">Загрузка...</div>
});

const EmployeesTab = dynamic(() => import('@/components/finance/EmployeesTab'), {
  loading: () => <div className="bg-white rounded-lg shadow p-6">Загрузка...</div>
});

const SalaryCalculationTab = dynamic(() => import('@/components/finance/SalaryCalculationTab'), {
  loading: () => <div className="bg-white rounded-lg shadow p-6">Загрузка...</div>
});

const ReportsTab = dynamic(() => import('@/components/finance/ReportsTab'), {
  loading: () => <div className="bg-white rounded-lg shadow p-6">Загрузка...</div>
});

const KPIMetricsTab = dynamic(() => import('@/components/finance/KPIMetricsTab'), {
  loading: () => <div className="bg-white rounded-lg shadow p-6">Загрузка...</div>
});

const CRMLeadsMatrixTab = dynamic(() => import('@/components/crm/CRMLeadsMatrixTab'), {
  loading: () => <div className="bg-white rounded-lg shadow p-6">Загрузка...</div>
});

function FinancesContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем основную авторизацию
    const token = localStorage.getItem("auth_token");
    if (!token || token !== "authenticated") {
      router.push("/login");
      return;
    }

    // Устанавливаем права админа для модуля финансов (отключение 2FA)
    sessionStorage.setItem("finance_token", "finance_authenticated");
    sessionStorage.setItem("finance_role", "admin");

    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("finance_token");
    sessionStorage.removeItem("finance_role");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-lg font-medium">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-[1800px] mx-auto">

        {/* Табы */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
            <div className="px-6 py-4 flex items-center justify-between">
              <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-gray-100/50 p-1.5 text-gray-600 gap-1">
                <TabsTrigger
                  value="dashboard"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </TabsTrigger>

                <TabsTrigger
                  value="operations"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Операции</span>
                </TabsTrigger>

                <TabsTrigger
                  value="expenses"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Расходы</span>
                </TabsTrigger>

                <TabsTrigger
                  value="employees"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Сотрудники</span>
                </TabsTrigger>

                <TabsTrigger
                  value="salary"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Расчет ЗП</span>
                </TabsTrigger>

                <TabsTrigger
                  value="reports"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Отчеты</span>
                </TabsTrigger>

                <TabsTrigger
                  value="kpi"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md gap-2"
                >
                  <Target className="w-4 h-4" />
                  <span>KPI & Метрики</span>
                </TabsTrigger>

                <TabsTrigger
                  value="matrix"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Учет лидов</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Выйти</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Контент табов */}
          <TabsContent value="dashboard">
            <FinanceDashboard />
          </TabsContent>

          <TabsContent value="operations">
            <OperationsTab />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesTab />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeesTab />
          </TabsContent>

          <TabsContent value="salary">
            <SalaryCalculationTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>

          <TabsContent value="kpi">
            <KPIMetricsTab />
          </TabsContent>

          <TabsContent value="matrix">
            <CRMLeadsMatrixTab />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

export default function FinancesPage() {
  return (
    <FinanceProvider>
      <FinancesContent />
    </FinanceProvider>
  );
}
