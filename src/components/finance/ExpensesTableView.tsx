import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUp, ArrowDown, Pencil } from "lucide-react";
import type { Expense, ExpenseType } from "@/types/finance";
import type { Employee } from "@/types/finance";
interface ExpensesTableViewProps {
  expenses: Expense[];
  employees: Employee[];
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
  onSort: (column: 'date' | 'amount' | 'category') => void;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  isPeriodClosed: boolean;
  isAdmin: boolean;
}
export default function ExpensesTableView({
  expenses,
  employees,
  sortBy,
  sortOrder,
  onSort,
  onDelete,
  onEdit,
  isPeriodClosed,
  isAdmin
}: ExpensesTableViewProps) {
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
      ? <ArrowUp className="w-3 h-3 text-red-600" />
      : <ArrowDown className="w-3 h-3 text-red-600" />;
  };
  const getTypeBadgeClass = (type: ExpenseType) => {
    switch (type) {
      case 'personal': return 'bg-blue-600';
      case 'tech': return 'bg-gray-600';
      case 'fixed': return 'bg-purple-600';
      case 'common': return 'bg-orange-600';
    }
  };
  const getTypeName = (type: ExpenseType) => {
    switch (type) {
      case 'personal': return 'Персональный';
      case 'tech': return 'Технический';
      case 'fixed': return 'Постоянный';
      case 'common': return 'Общий';
    }
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => onSort('date')}
                className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-red-600 transition-colors"
              >
                Дата
                <SortIcon column="date" />
              </button>
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Тип</th>
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => onSort('category')}
                className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-red-600 transition-colors"
              >
                Категория
                <SortIcon column="category" />
              </button>
            </th>
            <th className="px-4 py-3 text-right">
              <button
                onClick={() => onSort('amount')}
                className="flex items-center gap-1 ml-auto text-xs font-semibold text-gray-700 hover:text-red-600 transition-colors"
              >
                Сумма USDT
                <SortIcon column="amount" />
              </button>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Касса
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Комментарий
            </th>
            {isAdmin && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {expenses.map((exp) => {
            return (
              <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {formatDate(exp.date)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={`${getTypeBadgeClass(exp.type)} text-xs text-white`}
                  >
                    {getTypeName(exp.type)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {exp.category}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-red-600">
                  ${formatUSDT(exp.sumUsdt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {exp.type === 'tech' ? (
                    <span className="text-gray-700">🔧 Техники (25%+25%+50%)</span>
                  ) : exp.type === 'common' ? (
                    <span className="text-orange-700">🏢 Общие (50%+50%)</span>

                  ) : exp.teamId === 'voha' ? (
                    <span className="text-blue-700">💙 Воха (100%)</span>
                  ) : exp.teamId === 'zet' ? (
                    <span className="text-purple-700">💜 Зет (100%)</span>
                  ) : exp.teamId === 'office' ? (
                    <span className="text-indigo-700">💼 Офис (100%)</span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {exp.comment || '-'}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(exp)}
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
                          if (confirm('Удалить расход?')) {
                            onDelete(exp.id);
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
