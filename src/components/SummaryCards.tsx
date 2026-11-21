import { calculateTotal, calculateByCategory, getMonthlyTotalsArray } from '../utils/expenseCalculator';
import type { Expense } from '../utils/expenseCalculator';

interface SummaryCardsProps {
  expenses: Expense[];
}

export function SummaryCards({ expenses }: SummaryCardsProps) {
  const total = calculateTotal(expenses);
  const byCategory = calculateByCategory(expenses);
  const monthlyTotals = getMonthlyTotalsArray(expenses);
  const currentMonth = monthlyTotals[0]?.month || '';
  const currentMonthTotal = monthlyTotals[0]?.total || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="summary-cards">
      <div className="card total-card">
        <h3>Total Expenses</h3>
        <p className="amount">{formatCurrency(total)}</p>
        <span className="count">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card month-card">
        <h3>This Month ({currentMonth})</h3>
        <p className="amount">{formatCurrency(currentMonthTotal)}</p>
      </div>

      <div className="card categories-card">
        <h3>By Category</h3>
        <div className="category-breakdown">
          {Object.entries(byCategory)
            .filter(([, amount]) => amount > 0)
            .map(([category, amount]) => (
              <div key={category} className="category-item">
                <span className="category-name">{category}</span>
                <span className="category-amount">{formatCurrency(amount)}</span>
              </div>
            ))}
          {Object.values(byCategory).every(v => v === 0) && (
            <p className="no-data">No expenses recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}