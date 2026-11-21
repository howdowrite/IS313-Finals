import { useState, useMemo } from 'react';
import type { Expense } from './utils/expenseCalculator';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseFilter } from './components/ExpenseFilter';
import { SummaryCards } from './components/SummaryCards';
import { useExpenses } from './hooks/useExpenses';
import './App.css';

function App() {
  const { expenses: allExpenses, isLoading } = useExpenses();
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>(allExpenses);

  // Update filtered expenses when allExpenses changes (initial load)
  useMemo(() => {
    setFilteredExpenses(allExpenses);
  }, [allExpenses]);

  const handleFilter = (filtered: Expense[]) => {
    setFilteredExpenses(filtered);
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
            <ExpenseFilter expenses={allExpenses} onFilter={handleFilter} />
          </aside>

          {/* Right column - Summary and List */}
          <section className="content">
            <SummaryCards expenses={filteredExpenses} />
            <ExpenseList expenses={filteredExpenses} />
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