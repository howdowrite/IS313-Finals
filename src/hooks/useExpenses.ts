import { useState, useEffect, useCallback, useRef } from 'react';
import type { Expense } from '../utils/expenseCalculator';
import { createExpense, validateExpenseInput } from '../utils/expenseCalculator';

const STORAGE_KEY = 'expense-tracker-expenses';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const expensesRef = useRef(expenses);
  const [isLoading, setIsLoading] = useState(true);

  const updateExpenses = useCallback((nextExpenses: Expense[]) => {
    expensesRef.current = nextExpenses;
    setExpenses(nextExpenses);
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

  return {
    expenses,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAllExpenses,
  };
}
