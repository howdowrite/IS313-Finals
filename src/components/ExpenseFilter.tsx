import { useState } from 'react';
import type { Category } from '../utils/expenseCalculator';

interface ExpenseFilterProps {
  onFilter: (filters: { category: Category | 'All'; startDate: string; endDate: string; search: string }) => void;
  onLoadDemo?: () => void;
}

export function ExpenseFilter({ onFilter, onLoadDemo }: ExpenseFilterProps) {
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const categories: (Category | 'All')[] = ['All', 'Food', 'Transport', 'Entertainment', 'Utilities', 'Other'];

  const applyFilters = (values: { category: Category | 'All'; startDate: string; endDate: string; search: string }) => {
    onFilter(values);
  };

  return (
    <div className="expense-filter">
      <h3>Filters</h3>
      <div className="form-group">
        <label htmlFor="filter-search">Search expenses</label>
        <input
          id="filter-search"
          type="search"
          value={search}
          onChange={(e) => { const value = e.target.value; setSearch(value); applyFilters({ category, startDate, endDate, search: value }); }}
          placeholder="Search by description"
        />
      </div>
      <div className="filter-row">
        <div className="form-group">
          <label htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            value={category}
            onChange={(e) => { const value = e.target.value as Category | 'All'; setCategory(value); applyFilters({ category: value, startDate, endDate, search }); }}
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
            onChange={(e) => { const value = e.target.value; setStartDate(value); applyFilters({ category, startDate: value, endDate, search }); }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="filter-end">To</label>
          <input
            id="filter-end"
            type="date"
            value={endDate}
            onChange={(e) => { const value = e.target.value; setEndDate(value); applyFilters({ category, startDate, endDate: value, search }); }}
          />
        </div>
      </div>

      <button className="btn btn-secondary" onClick={() => {
        const cleared = { category: 'All' as const, startDate: '', endDate: '', search: '' };
        setCategory(cleared.category);
        setStartDate(cleared.startDate);
        setEndDate(cleared.endDate);
        setSearch(cleared.search);
        onFilter(cleared);
      }}>
        Clear Filters
      </button>

      {onLoadDemo && (
        <div className="demo-expenses-action">
          <span>Need some data to explore?</span>
          <button type="button" className="btn btn-demo" onClick={onLoadDemo}>
            Load demo expenses
          </button>
        </div>
      )}
    </div>
  );
}
