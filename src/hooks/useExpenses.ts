import { useState, useEffect, useCallback, useRef } from 'react';
import type { Expense } from '../utils/expenseCalculator';
import { createExpense, validateExpenseInput } from '../utils/expenseCalculator';

const STORAGE_KEY = 'expense-tracker-expenses';
const EXPENSES_UPDATED_EVENT = 'expense-tracker-expenses-updated';

export const demoExpenses: Expense[] = [
  { id: 'demo-1', description: 'Weekly groceries', amount: 64.25, category: 'Food', date: '2026-11-21' },
  { id: 'demo-2', description: 'Coffee with a friend', amount: 8.5, category: 'Food', date: '2026-11-18' },
  { id: 'demo-3', description: 'Monthly bus pass', amount: 42, category: 'Transport', date: '2026-11-03' },
  { id: 'demo-4', description: 'Ride to the airport', amount: 24.75, category: 'Transport', date: '2026-10-29' },
  { id: 'demo-5', description: 'Movie night', amount: 18, category: 'Entertainment', date: '2026-11-14' },
  { id: 'demo-6', description: 'Concert ticket', amount: 55, category: 'Entertainment', date: '2026-10-17' },
  { id: 'demo-7', description: 'Electricity bill', amount: 71.3, category: 'Utilities', date: '2026-11-08' },
  { id: 'demo-8', description: 'Internet bill', amount: 49.99, category: 'Utilities', date: '2026-10-08' },
  { id: 'demo-9', description: 'New notebook', amount: 6.25, category: 'Other', date: '2026-11-11' },
  { id: 'demo-10', description: 'Birthday gift', amount: 30, category: 'Other', date: '2026-10-24' },
];

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const expensesRef = useRef(expenses);
  const [isLoading, setIsLoading] = useState(true);

  const updateExpenses = useCallback((nextExpenses: Expense[]) => {
    expensesRef.current = nextExpenses;
    setExpenses(nextExpenses);
    window.dispatchEvent(new CustomEvent(EXPENSES_UPDATED_EVENT, { detail: nextExpenses }));
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        updateExpenses(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load expenses:', e);
    } finally {
      setIsLoading(false);
    }
  }, [updateExpenses]);

  // Save to localStorage whenever expenses change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [expenses, isLoading]);

  useEffect(() => {
    const handleExpensesUpdated = (event: Event) => {
      const nextExpenses = (event as CustomEvent<Expense[]>).detail;
      expensesRef.current = nextExpenses;
      setExpenses(nextExpenses);
    };
    window.addEventListener(EXPENSES_UPDATED_EVENT, handleExpensesUpdated);
    return () => window.removeEventListener(EXPENSES_UPDATED_EVENT, handleExpensesUpdated);
  }, [updateExpenses]);

  const addExpense = useCallback((
    description: string,
    amount: number,
    category: Expense['category'],
    date: string
  ) => {
    const { expense, validation } = createExpense(description, amount, category, date);
    if (!validation.valid || !expense) {
      throw new Error(validation.errors.join(', '));
    }
    updateExpenses([expense, ...expensesRef.current]);
    return expense;
  }, [updateExpenses]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    const currentExpense = expensesRef.current.find(expense => expense.id === id);
    if (!currentExpense) return;

    const updatedExpense = { ...currentExpense, ...updates };
    const validation = validateExpenseInput(updatedExpense);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    updateExpenses(expensesRef.current.map(expense => expense.id === id ? updatedExpense : expense));
  }, [updateExpenses]);

  const deleteExpense = useCallback((id: string) => {
    updateExpenses(expensesRef.current.filter(e => e.id !== id));
  }, [updateExpenses]);

  const clearAllExpenses = useCallback(() => {
    updateExpenses([]);
  }, [updateExpenses]);

  const loadDemoExpenses = useCallback(() => {
    updateExpenses(demoExpenses);
  }, [updateExpenses]);

  return {
    expenses,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAllExpenses,
    loadDemoExpenses,
  };
}
