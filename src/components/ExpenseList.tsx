import type { Expense } from '../utils/expenseCalculator';
import { useExpenses } from '../hooks/useExpenses';

interface ExpenseListProps {
  expenses: Expense[];
  hasActiveFilters?: boolean;
}

export function ExpenseList({ expenses, hasActiveFilters = false }: ExpenseListProps) {
  const { deleteExpense } = useExpenses();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCategoryColor = (category: Expense['category']) => {
    const colors: Record<string, string> = {
      Food: '#e8f5e9',
      Transport: '#e3f2fd',
      Entertainment: '#fce4ec',
      Utilities: '#fff3e0',
      Other: '#f5f5f5',
    };
    return colors[category] || '#f5f5f5';
  };

  if (expenses.length === 0) {
    return (
      <div className="expense-list empty">
        <p className="empty-message">
          {hasActiveFilters ? 'No expenses match your search and filters. Try adjusting them or clear filters.' : 'No expenses yet. Add your first expense above!'}
        </p>
      </div>
    );
  }

  return (
    <div className="expense-list">
      <h2>Expenses ({expenses.length})</h2>
      <ul className="expenses">
        {expenses.map(expense => (
          <li key={expense.id} className="expense-item" style={{ borderLeftColor: getCategoryColor(expense.category) }}>
            <div className="expense-info">
              <div className="expense-header">
                <span className="expense-description">{expense.description}</span>
                <span className="expense-amount">{formatCurrency(expense.amount)}</span>
              </div>
              <div className="expense-meta">
                <span className="expense-category" style={{ backgroundColor: getCategoryColor(expense.category) }}>
                  {expense.category}
                </span>
                <span className="expense-date">{formatDate(expense.date)}</span>
              </div>
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => deleteExpense(expense.id)}
              aria-label={`Delete ${expense.description}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
