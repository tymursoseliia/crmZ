"use client";
import { useState, useEffect } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Users, Crown, Headphones, Code, Star, Edit, RefreshCw, RotateCcw, Save, X, Check, AlertCircle, Info, FileText } from "lucide-react";
import type { Employee } from "@/types/finance";

export default function EmployeesTab() {
  const { employees, updateEmployee, isLoaded, reloadData, resetToInitial, syncEmployees, operations } = useFinance();
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingTeamleads, setIsUpdatingTeamleads] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminStatus = sessionStorage.getItem('finance_role') === 'admin';
    setIsAdmin(adminStatus);
  }, []);

  const updateTeamleadsData = async () => {
    setIsUpdatingTeamleads(true);
    try {
      // Проверяем операции у Вохи и Зета
      const vohaOps = operations.filter(op => op.managerId === 'voha');
      const zetOps = operations.filter(op => op.managerId === 'zet');

      if (vohaOps.length > 0 || zetOps.length > 0) {
        const message = `⚠️ ВНИМАНИЕ!\n\nНайдены операции у Вохи и Зета:\n` +
          `- Воха: ${vohaOps.length} операций\n` +
          `- Зет: ${zetOps.length} операций\n\n` +
          `Они НЕ должны иметь своих операций!\n\n` +
          `❗ НУЖНО:\n` +
          `1. Зайти на страницу "Операции"\n` +
          `2. Удалить или переназначить все операции где менеджер = Воха или Зет\n` +
          `3. После этого вернуться сюда и снова нажать кнопку\n\n` +
          `Или удалить через Supabase SQL Editor:\n` +
          `DELETE FROM operations WHERE manager_id IN ('voha', 'zet');`;
        alert(message);
        setIsUpdatingTeamleads(false);
        return;
      }

      // Обновляем Воху
      const voha = employees.find(e => e.id === 'voha');
      if (voha) {
        await updateEmployee({
          ...voha,
          role: 'manager', // Меняем с teamlead на manager
          salary: 350,
          percentProfit: 0,
          percentRastamozhka: 15,
          percentDobiv: 10,
        });
      }

      // Обновляем Зета
      const zet = employees.find(e => e.id === 'zet');
      if (zet) {
        await updateEmployee({
          ...zet,
          role: 'manager', // Меняем с teamlead на manager
          salary: 350,
          percentProfit: 0,
          percentRastamozhka: 15,
          percentDobiv: 10,
        });
      }

      await reloadData();
      alert('✅ Данные Вохи и Зета обновлены!\n\nВоха и Зет:\n- Минималка: $350\n- % от прибыли: 0\n- Растаможка: 15%\n- Добив: 10%');
    } catch (error) {
      console.error('Ошибка обновления Вохи и Зета:', error);
      alert('❌ Ошибка обновления данных');
    } finally {
      setIsUpdatingTeamleads(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Загрузка...</p>
      </div>
    );
  }

  const vohaTeam = employees.filter(emp => emp.team === 'voha');
  const zetTeam = employees.filter(emp => emp.team === 'zet');
  const closers = employees.filter(emp => emp.role === 'closer');
  const itDepartment = employees.filter(emp => emp.role === 'it');

  const getRoleBadge = (employee: Employee) => {
    if (employee.role === 'closer') {
      return <Badge className="bg-blue-500"><Headphones className="w-3 h-3 mr-1" />Клоузер</Badge>;
    }
    if (employee.role === 'it') {
      return <Badge className="bg-gray-600"><Code className="w-3 h-3 mr-1" />IT</Badge>;
    }
    if (employee.role === 'special') {
      return <Badge className="bg-amber-500"><Star className="w-3 h-3 mr-1" />Особая роль</Badge>;
    }
    if (employee.isSpecial) {
      return <Badge className="bg-orange-500">50/50</Badge>;
    }
    return <Badge variant="outline">Менеджер</Badge>;
  };

  const handleEditClick = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      salary: emp.salary,
      percentRastamozhka: emp.percentRastamozhka,
      percentDobiv: emp.percentDobiv,
      percentProfit: emp.percentProfit,
      fixedPay: emp.fixedPay,
      percentDobivDyadya: emp.percentDobivDyadya,
    });
  };

  const handleSaveEmployee = async () => {
    if (!editingEmployee || isSaving) return;

    const updatedEmployee: Employee = {
      ...editingEmployee,
      salary: Number(formData.salary) || 0,
      percentRastamozhka: Number(formData.percentRastamozhka) || 0,
      percentDobiv: Number(formData.percentDobiv) || 0,
      percentProfit: Number(formData.percentProfit) || 0,
      fixedPay: formData.fixedPay ? Number(formData.fixedPay) : undefined,
      percentDobivDyadya: formData.percentDobivDyadya ? Number(formData.percentDobivDyadya) : undefined,
    };

    setIsSaving(true);
    console.log('[DB] Сохранение в БД:', updatedEmployee.name, updatedEmployee);

    try {
      await updateEmployee(updatedEmployee);
      setEditingEmployee(null);
      setFormData({});

      // Показываем уведомление об успехе
      alert(`Сохранено!\n\nДанные ${updatedEmployee.name} обновлены в БД.\nИзменения синхронизированы на всех устройствах.`);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения в БД. Попробуйте еще раз.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setFormData({});
  };

  const EmployeeRow = ({ emp }: { emp: Employee }) => {
    const rowClass = false
      ? "border-b bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100"
      : "border-b hover:bg-gray-50";

    return (
      <tr className={rowClass}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            
            <span className={"font-medium"}>{emp.name}</span>
          </div>
        </td>
        <td className="px-4 py-3">{getRoleBadge(emp)}</td>
        <td className="px-4 py-3 text-right font-semibold text-green-700">
          ${emp.salary > 0 ? emp.salary : '-'}
        </td>
        <td className="px-4 py-3 text-right">
          {emp.percentRastamozhka > 0 ? `${emp.percentRastamozhka}%` : '-'}
        </td>
        <td className="px-4 py-3 text-right">
          {emp.percentDobiv > 0 ? `${emp.percentDobiv}%` : '-'}
        </td>
        <td className="px-4 py-3 text-right">
          {emp.percentDobivDyadya ? `${emp.percentDobivDyadya}%` : '-'}
        </td>
        <td className="px-4 py-3 text-right">
          {emp.percentProfit > 0 ? (
            <span className="text-purple-700 font-bold bg-purple-100 px-2 py-1 rounded">{emp.percentProfit}%</span>
          ) : '-'}
        </td>
        <td className="px-4 py-3 text-right">
          {emp.fixedPay ? `$${emp.fixedPay}` : '-'}
        </td>
        {isAdmin && (
          <td className="px-4 py-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditClick(emp)}
              className={false
                ? "text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              }
            >
              <Edit className="w-4 h-4" />
            </Button>
          </td>
        )}
      </tr>
    );
  };

  const TeamTable = ({ title, teamEmployees, icon, colorClass }: {
    title: string;
    teamEmployees: Employee[];
    icon: React.ReactNode;
    colorClass: string;
  }) => (
    <Card className={`border-t-4 ${colorClass}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title} ({teamEmployees.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Имя</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Роль</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Ставка</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">% растам.</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">% добив</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">% добив Дяди</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">% прибыль</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Фикс</th>
                {isAdmin && <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {teamEmployees.map(emp => (
                <EmployeeRow key={emp.id} emp={emp} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Сотрудники</h2>
          <p className="text-gray-600">Справочник всех сотрудников компании</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              onClick={reloadData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 hover:bg-blue-50"
              title="Обновить список с сервера (если кто-то изменил данные на другом компьютере)"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить с сервера
            </Button>
            {isAdmin && (
              <>
                <Button
                  onClick={async () => {
                    setIsSyncing(true);
                    await syncEmployees();
                    setIsSyncing(false);
                  }}
                  variant="outline"
                  size="sm"
                  disabled={isSyncing}
                  className="flex items-center gap-2 text-white bg-green-600 hover:bg-green-700 border-green-600 disabled:opacity-50"
                  title="Синхронизирует с начальными данными (если я добавил нового сотрудника в код)"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Синхронизация...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Синхронизация с кодом
                    </>
                  )}
                </Button>
                <Button
                  onClick={updateTeamleadsData}
                  variant="outline"
                  size="sm"
                  disabled={isUpdatingTeamleads}
                  className="flex items-center gap-2 text-white bg-purple-600 hover:bg-purple-700 border-purple-600 disabled:opacity-50"
                  title="Обновить данные Вохи и Зета (350 USDT, без % от прибыли)"
                >
                  {isUpdatingTeamleads ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Обновление...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      Обновить Воху и Зета
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetToInitial}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-white bg-red-600 hover:bg-red-700 border-red-600"
                >
                  <RotateCcw className="w-4 h-4" />
                  Полный сброс
                </Button>
              </>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Всего сотрудников</p>
            <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
          </div>
        </div>
      </div>

      {/* Команда Вохи */}
      <TeamTable
        title="Команда Вохи"
        teamEmployees={vohaTeam}
        icon={<Users className="w-5 h-5 text-blue-600" />}
        colorClass="border-t-blue-500"
      />

      {/* Команда Зета */}
      <TeamTable
        title="Команда Зета"
        teamEmployees={zetTeam}
        icon={<Users className="w-5 h-5 text-purple-600" />}
        colorClass="border-t-purple-500"
      />

      {/* Клоузеры */}
      <TeamTable
        title="Клоузеры"
        teamEmployees={closers}
        icon={<Headphones className="w-5 h-5 text-blue-600" />}
        colorClass="border-t-blue-400"
      />

      {/* IT отдел */}
      <TeamTable
        title="IT отдел"
        teamEmployees={itDepartment}
        icon={<Code className="w-5 h-5 text-gray-700" />}
        colorClass="border-t-gray-500"
      />

      {/* Диалог редактирования сотрудника */}
      <Dialog open={editingEmployee !== null} onOpenChange={(open) => !open && setEditingEmployee(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать сотрудника</DialogTitle>
            <DialogDescription>
              {editingEmployee?.name} - {editingEmployee?.role === 'manager' ? 'Менеджер' :
               
               editingEmployee?.role === 'closer' ? 'Клоузер' :
               editingEmployee?.role === 'it' ? 'IT' : 'Особая роль'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salary" className="text-right">
                Ставка (USDT)
              </Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={formData.salary ?? ''}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="percentRastamozhka" className="text-right">
                % Растаможка
              </Label>
              <Input
                id="percentRastamozhka"
                type="number"
                step="0.1"
                value={formData.percentRastamozhka ?? ''}
                onChange={(e) => setFormData({ ...formData, percentRastamozhka: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="percentDobiv" className="text-right">
                % Добив
              </Label>
              <Input
                id="percentDobiv"
                type="number"
                step="0.1"
                value={formData.percentDobiv ?? ''}
                onChange={(e) => setFormData({ ...formData, percentDobiv: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="percentDobivDyadya" className="text-right">
                % Добив Дяди
              </Label>
              <Input
                id="percentDobivDyadya"
                type="number"
                step="0.1"
                value={formData.percentDobivDyadya ?? ''}
                onChange={(e) => setFormData({ ...formData, percentDobivDyadya: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="percentProfit" className="text-right">
                % Прибыль
              </Label>
              <Input
                id="percentProfit"
                type="number"
                step="0.1"
                value={formData.percentProfit ?? ''}
                onChange={(e) => setFormData({ ...formData, percentProfit: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            {editingEmployee?.role === 'special' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fixedPay" className="text-right">
                  Фикс (USDT)
                </Label>
                <Input
                  id="fixedPay"
                  type="number"
                  step="0.01"
                  value={formData.fixedPay ?? ''}
                  onChange={(e) => setFormData({ ...formData, fixedPay: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Отменить
            </Button>
            <Button
              onClick={handleSaveEmployee}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Сохранение в БД...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Сохранить в БД
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
