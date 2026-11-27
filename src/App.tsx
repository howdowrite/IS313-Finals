import { useState } from 'react';
import type { Expense } from './utils/expenseCalculator';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseFilter } from './components/ExpenseFilter';
import { SummaryCards } from './components/SummaryCards';
import { useExpenses } from './hooks/useExpenses';
import './App.css';

function App() {
  const { expenses: allExpenses, isLoading, loadDemoExpenses } = useExpenses();
  const [filters, setFilters] = useState<{ category: Expense['category'] | 'All'; startDate: string; endDate: string; search: string }>({
    category: 'All', startDate: '', endDate: '', search: '',
  });

  const filteredExpenses = allExpenses.filter(expense => {
    const matchesCategory = filters.category === 'All' || expense.category === filters.category;
    const matchesStart = !filters.startDate || expense.date >= filters.startDate;
    const matchesEnd = !filters.endDate || expense.date <= filters.endDate;
    const matchesSearch = expense.description.toLocaleLowerCase().includes(filters.search.trim().toLocaleLowerCase());
    return matchesCategory && matchesStart && matchesEnd && matchesSearch;
  });

  const handleFilter = (next: { category: Expense['category'] | 'All'; startDate: string; endDate: string; search: string }) => setFilters(next);

  const handleLoadDemo = () => {
    if (allExpenses.length > 0 && !window.confirm('Loading demo expenses will delete and replace your current entries. Continue?')) {
      return;
    }
    loadDemoExpenses();
  };

  if (isLoading) {
    return <div className="app loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Expense Tracker</h1>
        <p className="subtitle">Track your spending, stay on budget</p>
      </header>

      <main className="app-main">
        <div className="layout">
          {/* Left column - Form and Filters */}
          <aside className="sidebar">
            <ExpenseForm />
            <ExpenseFilter onFilter={handleFilter} onLoadDemo={handleLoadDemo} />
          </aside>

          {/* Right column - Summary and List */}
          <section className="content">
            <SummaryCards expenses={filteredExpenses} />
            <ExpenseList expenses={filteredExpenses} hasActiveFilters={filteredExpenses.length !== allExpenses.length} />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React + TypeScript + Vite | CI/CD with Jenkins, SonarQube, Docker</p>
      </footer>
    </div>
  );
}

export default App;
