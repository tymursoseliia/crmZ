"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Crown, LogOut, Home, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CRMProvider } from "@/contexts/CRMContext";
import { TelegramProvider } from "@/contexts/TelegramContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import CRMLeadsTab from "@/components/crm/CRMLeadsTab";
import TelegramAnalyticsTab from "@/components/telegram/TelegramAnalyticsTab";

const CRM_PASSWORD = "srm2026";

export default function CRMPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCRMAccess, setHasCRMAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Проверяем основную авторизацию
    const token = localStorage.getItem("auth_token");
    if (!token || token !== "authenticated") {
      router.push("/login");
      return;
    }

    setIsAuthenticated(true);

    // Проверяем доступ к CRM
    const crmAccess = localStorage.getItem("crm_access");
    if (crmAccess === "granted") {
      setHasCRMAccess(true);
    }

    setIsLoading(false);
  }, [router]);

  const handleCRMPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordInput === CRM_PASSWORD) {
      localStorage.setItem("crm_access", "granted");
      setHasCRMAccess(true);
      setPasswordError("");
      setPasswordInput("");
    } else {
      setPasswordError("Неверный пароль!");
      setPasswordInput("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("crm_access");
    router.push("/login");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500">
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

  // Форма ввода пароля для CRM
  if (!hasCRMAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-4">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Доступ к CRM
              </h2>
              <p className="text-gray-600">
                Введите пароль для доступа к воронке лидов
              </p>
            </div>

            <form onSubmit={handleCRMPasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="crm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль CRM
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="crm-password"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Введите пароль"
                    className="pl-10 h-12 text-base"
                    autoFocus
                  />
                </div>
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span>
                    {passwordError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-base font-medium"
              >
                Войти в CRM
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={handleBackToHome}
                className="text-gray-600 hover:text-gray-900"
              >
                <Home className="w-4 h-4 mr-2" />
                Вернуться на главную
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-purple-200 bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleBackToHome}
                className="text-gray-600 hover:text-purple-600"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-500" />
                <span className="font-bold text-gray-800">Империя СКАМА</span>
              </div>
              <div className="h-6 w-px bg-gray-300" />
              <span className="text-purple-600 font-medium">CRM - Воронка лидов</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        <FinanceProvider>
          <CRMProvider>
            <Tabs defaultValue="leads" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                <TabsTrigger value="leads" className="text-base">
                  Воронка лидов
                </TabsTrigger>
                <TabsTrigger value="telegram" className="text-base">
                  Telegram
                </TabsTrigger>
              </TabsList>

              <TabsContent value="leads" className="mt-0">
                <CRMLeadsTab />
              </TabsContent>

              <TabsContent value="telegram" className="mt-0">
                <TelegramProvider>
                  <TelegramAnalyticsTab />
                </TelegramProvider>
              </TabsContent>
            </Tabs>
          </CRMProvider>
        </FinanceProvider>
      </main>
    </div>
  );
}
