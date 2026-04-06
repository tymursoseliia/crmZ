import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUp, ArrowDown, Pencil } from "lucide-react";
import type { Operation } from "@/types/finance";
import type { Employee } from "@/types/finance";

interface OperationsTableViewProps {
  operations: Operation[];
  employees: Employee[];
  sortBy: 'date' | 'amount' | 'manager';
  sortOrder: 'asc' | 'desc';
  onSort: (column: 'date' | 'amount' | 'manager') => void;
  onDelete: (id: string) => void;
  onEdit: (operation: Operation) => void;
  isPeriodClosed: boolean;
  isAdmin: boolean;
}

export default function OperationsTableView({
  operations,
  employees,
  sortBy,
  sortOrder,
  onSort,
  onDelete,
  onEdit,
  isPeriodClosed,
  isAdmin
}: OperationsTableViewProps) {
  const formatUSDT = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) return <ArrowUp className="w-3 h-3 text-gray-400" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3 text-blue-600" />
      : <ArrowDown className="w-3 h-3 text-blue-600" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => onSort('date')}
                className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors"
              >
                Дата
                <SortIcon column="date" />
              </button>
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Тип</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Команда</th>
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => onSort('manager')}
                className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors"
              >
                Менеджер
                <SortIcon column="manager" />
              </button>
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Клоузер</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Сумма RUB</th>
            <th className="px-4 py-3 text-right">
              <button
                onClick={() => onSort('amount')}
                className="flex items-center gap-1 ml-auto text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors"
              >
                После комиссии
                <SortIcon column="amount" />
              </button>
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Комиссия</th>
            {isAdmin && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {operations.map((op) => {
            const manager = employees.find(e => e.id === op.managerId);
            const closer = op.closerId ? employees.find(e => e.id === op.closerId) : null;

            return (
              <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {formatDate(op.date)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={op.type === 'растаможка' ? 'default' : 'secondary'}
                    className={op.type === 'растаможка' ? 'bg-purple-600 text-xs' : 'bg-green-600 text-xs'}
                  >
                    {op.type}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">
                    {op.team === 'voha' ? 'Воха' :
                     op.team === 'zet' ? 'Зет' : 'Офис'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {manager?.name || 'Неизвестен'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {closer ? closer.name : '-'}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  {op.sumRub.toLocaleString()} ₽
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-green-600">
                  ${formatUSDT(op.usdtAfterCommission)}
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-500">
                  {op.dropCommission}%
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(op)}
                        disabled={isPeriodClosed}
                        className="p-1.5 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Редактировать"
                      >
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (isPeriodClosed) {
                            alert('Период закрыт! Удаление невозможно.');
                            return;
                          }
                          if (confirm('Удалить операцию?')) {
                            onDelete(op.id);
                          }
                        }}
                        disabled={isPeriodClosed}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
