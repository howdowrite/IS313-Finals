import { useState, useEffect, useCallback } from 'react';
import type { Expense } from '../utils/expenseCalculator';
import { createExpense, validateExpenseInput } from '../utils/expenseCalculator';

const STORAGE_KEY = 'expense-tracker-expenses';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setExpenses(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load expenses:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    setExpenses(prev => [expense, ...prev]);
    return expense;
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(expense => {
      if (expense.id !== id) return expense;
      const updated = { ...expense, ...updates };
      const validation = validateExpenseInput(updated);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      return updated;
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearAllExpenses = useCallback(() => {
    setExpenses([]);
  }, []);

  return {
    expenses,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAllExpenses,
  };
}