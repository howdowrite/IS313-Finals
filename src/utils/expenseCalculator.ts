/**
 * Expense Calculator - Core Business Logic
 * Pure functions for expense management, easily testable
 */

export type Category = 'Food' | 'Transport' | 'Entertainment' | 'Utilities' | 'Other';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: Category;
  date: string; // ISO format: YYYY-MM-DD
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface MonthlyTotal {
  month: string; // YYYY-MM
  total: number;
}

/**
 * Calculate total amount from expenses
 */
export function calculateTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Calculate totals grouped by category
 */
export function calculateByCategory(expenses: Expense[]): Record<Category, number> {
  const result: Record<Category, number> = {
    Food: 0,
    Transport: 0,
    Entertainment: 0,
    Utilities: 0,
    Other: 0
  };

  expenses.forEach(expense => {
    if (result.hasOwnProperty(expense.category)) {
      result[expense.category] += expense.amount;
    }
  });

  return result;
}

/**
 * Filter expenses by date range (inclusive)
 */
export function filterByDateRange(expenses: Expense[], startDate: string, endDate: string): Expense[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Include entire end day

  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= start && expenseDate <= end;
  });
}

/**
 * Validate expense input
 */
export function validateExpenseInput(input: Partial<Expense>): ValidationResult {
  const errors: string[] = [];

  // Description validation
  if (!input.description || input.description.trim() === '') {
    errors.push('Description is required');
  } else if (input.description.trim().length > 100) {
    errors.push('Description must be 100 characters or less');
  }

  // Amount validation
  if (input.amount === undefined || input.amount === null) {
    errors.push('Amount is required');
  } else if (typeof input.amount !== 'number' || isNaN(input.amount)) {
    errors.push('Amount must be a valid number');
  } else if (input.amount <= 0) {
    errors.push('Amount must be greater than zero');
  } else if (input.amount > 1000000) {
    errors.push('Amount exceeds maximum allowed (1,000,000)');
  }

  // Category validation
  const validCategories: Category[] = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Other'];
  if (!input.category) {
    errors.push('Category is required');
  } else if (!validCategories.includes(input.category as Category)) {
    errors.push('Invalid category. Must be one of: Food, Transport, Entertainment, Utilities, Other');
  }

  // Date validation
  if (!input.date) {
    errors.push('Date is required');
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    } else {
      const date = new Date(input.date);
      if (isNaN(date.getTime())) {
        errors.push('Date is invalid');
      } else if (date > new Date()) {
        errors.push('Date cannot be in the future');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get monthly totals grouped by year-month
 */
export function getMonthlyTotals(expenses: Expense[]): Record<string, number> {
  const result: Record<string, number> = {};

  expenses.forEach(expense => {
    const monthKey = expense.date.substring(0, 7); // YYYY-MM
    if (!result[monthKey]) {
      result[monthKey] = 0;
    }
    result[monthKey] += expense.amount;
  });

  return result;
}

/**
 * Get monthly totals as array for easier display
 */
export function getMonthlyTotalsArray(expenses: Expense[]): MonthlyTotal[] {
  const totals = getMonthlyTotals(expenses);
  return Object.entries(totals)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => b.month.localeCompare(a.month)); // Most recent first
}

/**
 * Generate unique ID for new expenses
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new expense object with validation
 */
export function createExpense(
  description: string,
  amount: number,
  category: Category,
  date: string
): { expense: Expense | null; validation: ValidationResult } {
  const input = { description, amount, category, date };
  const validation = validateExpenseInput(input);

  if (!validation.valid) {
    return { expense: null, validation };
  }

  const expense: Expense = {
    id: generateId(),
    description: description.trim(),
    amount,
    category,
    date
  };

  return { expense, validation: { valid: true, errors: [] } };
}