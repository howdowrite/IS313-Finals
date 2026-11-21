import { useState } from 'react';
import { filterByDateRange } from '../utils/expenseCalculator';
import type { Expense, Category } from '../utils/expenseCalculator';

interface ExpenseFilterProps {
  expenses: Expense[];
  onFilter: (filtered: Expense[]) => void;
}

export function ExpenseFilter({ expenses, onFilter }: ExpenseFilterProps) {
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const categories: (Category | 'All')[] = ['All', 'Food', 'Transport', 'Entertainment', 'Utilities', 'Other'];

  const applyFilters = () => {
    let filtered = [...expenses];

    // Category filter
    if (category !== 'All') {
      filtered = filtered.filter(e => e.category === category);
    }

    // Date range filter
    if (startDate || endDate) {
      const start = startDate || '2000-01-01';
      const end = endDate || new Date().toISOString().split('T')[0];
      filtered = filterByDateRange(filtered, start, end);
    }

    onFilter(filtered);
  };

  return (
    <div className="expense-filter">
      <h3>Filters</h3>
      <div className="filter-row">
        <div className="form-group">
          <label htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            value={category}
            onChange={(e) => { setCategory(e.target.value as Category | 'All'); applyFilters(); }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="filter-start">From</label>
          <input
            id="filter-start"
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); applyFilters(); }}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="form-group">
          <label htmlFor="filter-end">To</label>
          <input
            id="filter-end"
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); applyFilters(); }}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <button className="btn btn-secondary" onClick={() => {
        setCategory('All');
        setStartDate('');
        setEndDate('');
        onFilter(expenses);
      }}>
        Clear Filters
      </button>
    </div>
  );
}